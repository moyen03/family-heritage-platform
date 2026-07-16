<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Person;
use App\Entity\Relationship;
use App\Repository\PersonRepository;
use App\Repository\RelationshipRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Provides all relationships for a given person (both directions).
 * Powers: GET /persons/{personId}/relationships
 *
 * @implements ProviderInterface<Relationship>
 */
final class RelationshipStateProvider implements ProviderInterface
{
    public function __construct(
        private readonly PersonRepository $personRepository,
        private readonly RelationshipRepository $relationshipRepository,
    ) {
    }

    /**
     * @return Relationship[]
     */
    public function provide(Operation $operation, array $uriVariables = [], array $context = []): array
    {
        $personId = $uriVariables['personId'] ?? null;

        if (!is_string($personId)) {
            throw new NotFoundHttpException('Person not found.');
        }

        /** @var Person|null $person */
        $person = $this->personRepository->find($personId);

        if ($person === null) {
            throw new NotFoundHttpException(sprintf('Person "%s" not found.', $personId));
        }

        return $this->relationshipRepository->findForPerson($person);
    }
}
