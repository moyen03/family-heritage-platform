<?php

declare(strict_types=1);

namespace App\DTO;

use App\Entity\Person;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * A node in the family tree — wraps a Person with their depth and relationship to the root.
 */
final class PersonTreeNode
{
    public function __construct(
        #[Groups(['tree:read'])]
        public readonly Person $person,

        /** Generation distance from the root person (1 = parent/child, 2 = grandparent/grandchild …) */
        #[Groups(['tree:read'])]
        public readonly int $generation,

        /** The relationship type that connects this node to its parent in the traversal (e.g. "parent", "child"). */
        #[Groups(['tree:read'])]
        public readonly string $relationType,
    ) {
    }
}
