<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use App\Enum\AuditAction;
use App\Repository\AuditLogRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ApiResource(
    operations: [
        new GetCollection(
            uriTemplate: '/audit-logs',
            security: "is_granted('ROLE_BRANCH_ADMIN')",
        ),
        new Get(
            uriTemplate: '/audit-logs/{id}',
            security: "is_granted('ROLE_BRANCH_ADMIN')",
        ),
    ],
    normalizationContext: ['groups' => ['audit:read']],
    order: ['createdAt' => 'DESC'],
)]
#[ApiFilter(SearchFilter::class, properties: [
    'entityType' => 'exact',
    'entityId'   => 'exact',
    'action'     => 'exact',
    'userId'     => 'exact',
])]
#[ORM\Entity(repositoryClass: AuditLogRepository::class)]
#[ORM\Table(name: 'audit_logs')]
class AuditLog
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['audit:read'])]
    private string $id;

    #[ORM\Column(type: 'string', length: 36, nullable: true)]
    #[Groups(['audit:read'])]
    private ?string $userId = null;

    #[ORM\Column(type: 'string', enumType: AuditAction::class)]
    #[Groups(['audit:read'])]
    private AuditAction $action;

    #[ORM\Column(type: 'string', length: 100)]
    #[Groups(['audit:read'])]
    private string $entityType;

    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['audit:read'])]
    private string $entityId;

    /**
     * @var array<string, mixed>|null
     */
    #[ORM\Column(type: 'json', nullable: true)]
    #[Groups(['audit:read'])]
    private ?array $oldValues = null;

    /**
     * @var array<string, mixed>|null
     */
    #[ORM\Column(type: 'json', nullable: true)]
    #[Groups(['audit:read'])]
    private ?array $newValues = null;

    #[ORM\Column(type: 'string', length: 45, nullable: true)]
    #[Groups(['audit:read'])]
    private ?string $ipAddress = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['audit:read'])]
    private ?string $userAgent = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['audit:read'])]
    private \DateTimeImmutable $createdAt;

    /**
     * @param array<string, mixed>|null $oldValues
     * @param array<string, mixed>|null $newValues
     */
    public function __construct(
        string $id,
        AuditAction $action,
        string $entityType,
        string $entityId,
        ?string $userId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ) {
        $this->id = $id;
        $this->action = $action;
        $this->entityType = $entityType;
        $this->entityId = $entityId;
        $this->userId = $userId;
        $this->oldValues = $oldValues;
        $this->newValues = $newValues;
        $this->ipAddress = $ipAddress;
        $this->userAgent = $userAgent;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getUserId(): ?string
    {
        return $this->userId;
    }

    public function getAction(): AuditAction
    {
        return $this->action;
    }

    public function getEntityType(): string
    {
        return $this->entityType;
    }

    public function getEntityId(): string
    {
        return $this->entityId;
    }

    /** @return array<string, mixed>|null */
    public function getOldValues(): ?array
    {
        return $this->oldValues;
    }

    /** @return array<string, mixed>|null */
    public function getNewValues(): ?array
    {
        return $this->newValues;
    }

    public function getIpAddress(): ?string
    {
        return $this->ipAddress;
    }

    public function getUserAgent(): ?string
    {
        return $this->userAgent;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    #[Groups(['audit:read'])]
    public function getCreatedAtIso(): string
    {
        return $this->createdAt->format(\DateTimeInterface::ATOM);
    }
}
