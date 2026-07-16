<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Relationship;
use App\Entity\User;
use App\Repository\RelationshipRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

/**
 * @implements ProcessorInterface<Relationship, Relationship|null>
 */
final class RelationshipStateProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly RelationshipRepository $relationshipRepository,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ?Relationship
    {
        if (!$data instanceof Relationship) {
            return null;
        }

        if ($operation instanceof Delete) {
            $this->deleteWithInverse($data);
            return null;
        }

        if ($operation instanceof Post) {
            /** @var User $user */
            $user = $this->security->getUser();
            $data->setCreatedBy($user);

            $this->validateRelationship($data);

            // Persist the primary relationship
            $this->entityManager->persist($data);

            // Auto-create the inverse relationship (e.g. parent → child)
            $this->createInverseIfNeeded($data);
        }

        $this->entityManager->persist($data);
        $this->entityManager->flush();

        return $data;
    }

    private function validateRelationship(Relationship $relationship): void
    {
        if ($relationship->getPerson1()->getId() === $relationship->getPerson2()->getId()) {
            throw new BadRequestHttpException('A person cannot have a relationship with themselves.');
        }

        if ($this->relationshipRepository->relationshipExists(
            $relationship->getPerson1(),
            $relationship->getPerson2(),
            $relationship->getType(),
        )) {
            throw new ConflictHttpException(
                sprintf(
                    'A "%s" relationship between these two persons already exists.',
                    $relationship->getType()->value,
                )
            );
        }
    }

    /**
     * Auto-create the inverse relationship when creating a new one.
     * Example: creating parent(A→B) also creates child(B→A).
     * Symmetric types (sibling, half_sibling) get both directions too,
     * so graph traversal always works by querying person1.
     */
    private function createInverseIfNeeded(Relationship $relationship): void
    {
        $inverseType = $relationship->getType()->inverse();
        $person1 = $relationship->getPerson1();
        $person2 = $relationship->getPerson2();

        // Skip if inverse already exists
        if ($this->relationshipRepository->relationshipExists($person2, $person1, $inverseType)) {
            return;
        }

        $inverse = $relationship->createInverse();
        $this->entityManager->persist($inverse);
    }

    /**
     * When deleting a relationship, also delete its inverse so the graph stays consistent.
     */
    private function deleteWithInverse(Relationship $relationship): void
    {
        $inverseType = $relationship->getType()->inverse();

        $inverse = $this->relationshipRepository->findOneBy([
            'person1' => $relationship->getPerson2(),
            'person2' => $relationship->getPerson1(),
            'type' => $inverseType,
        ]);

        $this->entityManager->remove($relationship);

        if ($inverse !== null) {
            $this->entityManager->remove($inverse);
        }

        $this->entityManager->flush();
    }
}
