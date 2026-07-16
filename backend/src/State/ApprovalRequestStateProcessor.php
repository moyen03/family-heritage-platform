<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\ApprovalRequest;
use App\Entity\Person;
use App\Entity\User;
use App\Enum\ApprovalStatus;
use App\Repository\PersonRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

/**
 * @implements ProcessorInterface<ApprovalRequest, ApprovalRequest|null>
 */
final class ApprovalRequestStateProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly PersonRepository $personRepository,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ?ApprovalRequest
    {
        if (!$data instanceof ApprovalRequest) {
            return null;
        }

        if ($operation instanceof Delete) {
            $this->entityManager->remove($data);
            $this->entityManager->flush();

            return null;
        }

        /** @var User $user */
        $user = $this->security->getUser();

        if ($operation instanceof Post) {
            $this->validateNewRequest($data);
            $data->setRequestedBy($user);
            $data->setStatus(ApprovalStatus::Pending);
        }

        if ($operation instanceof Patch) {
            $this->validateReview($data);

            $data->setReviewedBy($user);
            $data->setReviewedAt(new \DateTimeImmutable());

            // Apply changes to the target entity when approved
            if ($data->getStatus() === ApprovalStatus::Approved) {
                $this->applyChanges($data);
            }
        }

        $this->entityManager->persist($data);
        $this->entityManager->flush();

        return $data;
    }

    private function validateNewRequest(ApprovalRequest $request): void
    {
        if (empty($request->getChangesJson())) {
            throw new BadRequestHttpException('changesJson must contain at least one field to change.');
        }

        // Verify the entity actually exists
        $this->resolveEntity($request->getEntityType(), $request->getEntityId());
    }

    private function validateReview(ApprovalRequest $request): void
    {
        if ($request->getStatus()->isTerminal()) {
            throw new ConflictHttpException(
                sprintf(
                    'This approval request is already %s and cannot be updated.',
                    $request->getStatus()->value,
                )
            );
        }
    }

    /**
     * Apply the proposed changes from changesJson to the target entity.
     * Currently supports: Person.
     */
    private function applyChanges(ApprovalRequest $request): void
    {
        $entity = $this->resolveEntity($request->getEntityType(), $request->getEntityId());

        if ($entity instanceof Person) {
            $this->applyPersonChanges($entity, $request->getChangesJson());
        }
    }

    private function resolveEntity(string $entityType, string $entityId): object
    {
        return match ($entityType) {
            'Person' => $this->personRepository->find($entityId)
                ?? throw new BadRequestHttpException(sprintf('Person "%s" not found.', $entityId)),
            default  => throw new BadRequestHttpException(
                sprintf('Unsupported entity type "%s". Supported: Person.', $entityType)
            ),
        };
    }

    /**
     * Apply a map of field changes to a Person entity via its public setters.
     *
     * @param array<string, mixed> $changes
     */
    private function applyPersonChanges(Person $person, array $changes): void
    {
        $allowed = [
            'firstName', 'middleName', 'lastName', 'maidenName',
            'birthPlace', 'deathPlace', 'biography', 'birthDate', 'deathDate',
        ];

        foreach ($changes as $field => $value) {
            if (!in_array($field, $allowed, true)) {
                continue; // silently skip unknown/disallowed fields
            }

            $setter = 'set' . ucfirst($field);

            if (!method_exists($person, $setter)) {
                continue;
            }

            // Cast date strings to DateTimeImmutable
            if (in_array($field, ['birthDate', 'deathDate'], true) && is_string($value)) {
                $value = new \DateTimeImmutable($value);
            }

            $person->$setter($value);
        }

        $this->entityManager->persist($person);
    }
}
