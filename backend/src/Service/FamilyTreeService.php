<?php

declare(strict_types=1);

namespace App\Service;

use App\DTO\PersonTreeNode;
use App\DTO\RelationshipPathStep;
use App\Entity\Person;
use App\Repository\RelationshipRepository;

/**
 * BFS-based family tree traversal service.
 *
 * Relationship storage model (both directions are always stored):
 *   (person1=Parent, person2=Child, type=parent)
 *   (person1=Child,  person2=Parent, type=child)
 *
 * Ancestor traversal:  find where X is person2 with a parent-type → person1 is the ancestor.
 * Descendant traversal: find where X is person1 with a parent-type → person2 is the descendant.
 */
final class FamilyTreeService
{
    public const DEFAULT_MAX_DEPTH = 10;

    public function __construct(
        private readonly RelationshipRepository $relationshipRepository,
    ) {
    }

    /**
     * Return all ancestors of $person up to $maxDepth generations.
     * Generation 1 = parents, 2 = grandparents, etc.
     *
     * @return PersonTreeNode[]
     */
    public function getAncestors(Person $person, int $maxDepth = self::DEFAULT_MAX_DEPTH): array
    {
        $result = [];
        $visited = [$person->getId() => true];

        // Queue entries: [person, generation]
        $queue = [[$person, 0]];

        while (!empty($queue)) {
            /** @var array{0: Person, 1: int} $entry */
            $entry = array_shift($queue);
            [$current, $generation] = $entry;

            if ($generation >= $maxDepth) {
                continue;
            }

            // findParents: person2 = current → person1 is the ancestor
            $parentRelationships = $this->relationshipRepository->findParents($current);

            foreach ($parentRelationships as $rel) {
                $ancestor = $rel->getPerson1();

                if (isset($visited[$ancestor->getId()])) {
                    continue;
                }

                $visited[$ancestor->getId()] = true;
                $nextGeneration = $generation + 1;

                $result[] = new PersonTreeNode(
                    person: $ancestor,
                    generation: $nextGeneration,
                    relationType: $rel->getType()->value,
                );

                $queue[] = [$ancestor, $nextGeneration];
            }
        }

        usort($result, static fn (PersonTreeNode $a, PersonTreeNode $b) => $a->generation <=> $b->generation);

        return $result;
    }

    /**
     * Return all descendants of $person up to $maxDepth generations.
     * Generation 1 = children, 2 = grandchildren, etc.
     *
     * @return PersonTreeNode[]
     */
    public function getDescendants(Person $person, int $maxDepth = self::DEFAULT_MAX_DEPTH): array
    {
        $result = [];
        $visited = [$person->getId() => true];

        // Queue entries: [person, generation]
        $queue = [[$person, 0]];

        while (!empty($queue)) {
            /** @var array{0: Person, 1: int} $entry */
            $entry = array_shift($queue);
            [$current, $generation] = $entry;

            if ($generation >= $maxDepth) {
                continue;
            }

            // findChildren: person1 = current with parent-type → person2 is the descendant
            $childRelationships = $this->relationshipRepository->findChildren($current);

            foreach ($childRelationships as $rel) {
                $descendant = $rel->getPerson2();

                if (isset($visited[$descendant->getId()])) {
                    continue;
                }

                $visited[$descendant->getId()] = true;
                $nextGeneration = $generation + 1;

                $result[] = new PersonTreeNode(
                    person: $descendant,
                    generation: $nextGeneration,
                    relationType: $rel->getType()->value,
                );

                $queue[] = [$descendant, $nextGeneration];
            }
        }

        usort($result, static fn (PersonTreeNode $a, PersonTreeNode $b) => $a->generation <=> $b->generation);

        return $result;
    }

    /**
     * Find the shortest path between two persons using BFS across ALL relationship types.
     *
     * Returns an ordered list of RelationshipPathStep from $from to $to,
     * or null if no connection exists within $maxDepth steps.
     *
     * @return RelationshipPathStep[]|null
     */
    public function findPath(Person $from, Person $to, int $maxDepth = 20): ?array
    {
        if ($from->getId() === $to->getId()) {
            return [new RelationshipPathStep($from, null)];
        }

        // BFS — each queue entry is a full path built so far
        $startStep = new RelationshipPathStep($from, null);
        $queue = [[$startStep]];
        $visited = [$from->getId() => true];

        while (!empty($queue)) {
            /** @var RelationshipPathStep[] $currentPath */
            $currentPath = array_shift($queue);

            if (count($currentPath) > $maxDepth) {
                continue;
            }

            $currentPerson = $currentPath[array_key_last($currentPath)]->person;

            // All relationships touching this person (both directions)
            $relationships = $this->relationshipRepository->findForPerson($currentPerson);

            foreach ($relationships as $rel) {
                // Determine the neighbour and label from this person's perspective
                if ($rel->getPerson1()->getId() === $currentPerson->getId()) {
                    $neighbour = $rel->getPerson2();
                    $via = $rel->getType()->value;
                } else {
                    $neighbour = $rel->getPerson1();
                    $via = $rel->getType()->inverse()->value;
                }

                $newPath = [...$currentPath, new RelationshipPathStep($neighbour, $via)];

                if ($neighbour->getId() === $to->getId()) {
                    return $newPath;
                }

                if (!isset($visited[$neighbour->getId()])) {
                    $visited[$neighbour->getId()] = true;
                    $queue[] = $newPath;
                }
            }
        }

        return null; // no path found
    }
}
