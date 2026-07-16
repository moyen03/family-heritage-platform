<?php

declare(strict_types=1);

namespace App\DTO;

use App\Entity\Person;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * One step in a relationship path from person A to person B.
 */
final class RelationshipPathStep
{
    public function __construct(
        #[Groups(['path:read'])]
        public readonly Person $person,

        /**
         * The relationship type that connects the PREVIOUS person to this one.
         * Null for the starting person.
         */
        #[Groups(['path:read'])]
        public readonly ?string $via,
    ) {
    }
}
