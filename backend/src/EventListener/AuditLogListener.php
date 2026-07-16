<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\ApprovalRequest;
use App\Entity\Marriage;
use App\Entity\Person;
use App\Entity\PersonName;
use App\Entity\Relationship;
use App\Enum\AuditAction;
use Doctrine\Common\EventSubscriber;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Event\PostRemoveEventArgs;
use Doctrine\ORM\Event\PostUpdateEventArgs;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Events;
use Ramsey\Uuid\Uuid;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Automatically writes to audit_logs for every change to auditable entities.
 *
 * Uses DBAL inserts (not ORM persist) to avoid recursion during flush cycles.
 *
 * Audited entities: Person, PersonName, Relationship, Marriage, ApprovalRequest
 */
final class AuditLogListener implements EventSubscriber
{
    /** @var array<int, array<string, mixed>> */
    private array $preUpdateChangeSets = [];

    public function __construct(
        private readonly Security $security,
        private readonly RequestStack $requestStack,
    ) {
    }

    public function getSubscribedEvents(): array
    {
        return [
            Events::preUpdate,
            Events::postPersist,
            Events::postUpdate,
            Events::postRemove,
        ];
    }

    public function preUpdate(PreUpdateEventArgs $args): void
    {
        $entity = $args->getObject();

        if (!$this->isAuditable($entity)) {
            return;
        }

        $this->preUpdateChangeSets[spl_object_id($entity)] = $args->getEntityChangeSet();
    }

    public function postPersist(PostPersistEventArgs $args): void
    {
        $entity = $args->getObject();

        if (!$this->isAuditable($entity)) {
            return;
        }

        $this->insertLog(
            $args->getObjectManager()->getConnection(),
            AuditAction::Created,
            $this->getEntityType($entity),
            $this->getEntityId($entity),
            null,
            ['id' => $this->getEntityId($entity)],
        );
    }

    public function postUpdate(PostUpdateEventArgs $args): void
    {
        $entity = $args->getObject();

        if (!$this->isAuditable($entity)) {
            return;
        }

        $oid = spl_object_id($entity);
        $changeSet = $this->preUpdateChangeSets[$oid] ?? [];
        unset($this->preUpdateChangeSets[$oid]);

        // Detect soft delete: deletedAt flipped from null to a value
        $action = isset($changeSet['deletedAt']) && $changeSet['deletedAt'][1] !== null
            ? AuditAction::Deleted
            : AuditAction::Updated;

        // Detect approval status changes
        if ($entity instanceof ApprovalRequest && isset($changeSet['status'])) {
            $newStatus = $changeSet['status'][1];
            if ($newStatus instanceof \BackedEnum) {
                $action = match ($newStatus->value) {
                    'approved' => AuditAction::Approved,
                    'rejected' => AuditAction::Rejected,
                    default    => AuditAction::Updated,
                };
            }
        }

        $this->insertLog(
            $args->getObjectManager()->getConnection(),
            $action,
            $this->getEntityType($entity),
            $this->getEntityId($entity),
            $this->serializeChangeSet($changeSet, 0),
            $this->serializeChangeSet($changeSet, 1),
        );
    }

    public function postRemove(PostRemoveEventArgs $args): void
    {
        $entity = $args->getObject();

        if (!$this->isAuditable($entity)) {
            return;
        }

        $this->insertLog(
            $args->getObjectManager()->getConnection(),
            AuditAction::Deleted,
            $this->getEntityType($entity),
            $this->getEntityId($entity),
            ['id' => $this->getEntityId($entity)],
            null,
        );
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private function isAuditable(object $entity): bool
    {
        return $entity instanceof Person
            || $entity instanceof PersonName
            || $entity instanceof Relationship
            || $entity instanceof Marriage
            || $entity instanceof ApprovalRequest;
    }

    private function getEntityType(object $entity): string
    {
        return (new \ReflectionClass($entity))->getShortName();
    }

    private function getEntityId(object $entity): string
    {
        return method_exists($entity, 'getId') ? (string) $entity->getId() : '';
    }

    /**
     * Extract one side (0=old, 1=new) of a Doctrine change set as a JSON-safe array.
     *
     * @param array<string, array{0: mixed, 1: mixed}> $changeSet
     * @return array<string, mixed>
     */
    private function serializeChangeSet(array $changeSet, int $side): array
    {
        $result = [];

        foreach ($changeSet as $field => [$old, $new]) {
            $value = $side === 0 ? $old : $new;
            $result[$field] = $this->serializeValue($value);
        }

        return $result;
    }

    private function serializeValue(mixed $value): mixed
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format(\DateTimeInterface::ATOM);
        }

        if ($value instanceof \BackedEnum) {
            return $value->value;
        }

        if ($value instanceof \UnitEnum) {
            return $value->name;
        }

        if (is_object($value) && method_exists($value, 'getId')) {
            return (string) $value->getId();
        }

        return $value;
    }

    /**
     * @param array<string, mixed>|null $oldValues
     * @param array<string, mixed>|null $newValues
     */
    private function insertLog(
        \Doctrine\DBAL\Connection $connection,
        AuditAction $action,
        string $entityType,
        string $entityId,
        ?array $oldValues,
        ?array $newValues,
    ): void {
        $user = $this->security->getUser();
        $request = $this->requestStack->getCurrentRequest();

        $connection->insert('audit_logs', [
            'id'          => Uuid::uuid4()->toString(),
            'user_id'     => method_exists($user ?? new \stdClass(), 'getId') ? (string) $user->getId() : null,
            'action'      => $action->value,
            'entity_type' => $entityType,
            'entity_id'   => $entityId,
            'old_values'  => $oldValues !== null ? json_encode($oldValues, JSON_UNESCAPED_UNICODE) : null,
            'new_values'  => $newValues !== null ? json_encode($newValues, JSON_UNESCAPED_UNICODE) : null,
            'ip_address'  => $request?->getClientIp(),
            'user_agent'  => $request?->headers->get('User-Agent'),
            'created_at'  => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
        ]);
    }
}
