<?php

declare(strict_types=1);

namespace App\Enum;

enum RelationshipType: string
{
    case Parent = 'parent';
    case Child = 'child';
    case Sibling = 'sibling';
    case HalfSibling = 'half_sibling';
    case StepParent = 'step_parent';
    case StepChild = 'step_child';
    case AdoptedParent = 'adopted_parent';
    case AdoptedChild = 'adopted_child';
    case Guardian = 'guardian';
    case FosterParent = 'foster_parent';

    /**
     * Returns the inverse relationship type.
     */
    public function inverse(): self
    {
        return match($this) {
            self::Parent => self::Child,
            self::Child => self::Parent,
            self::Sibling => self::Sibling,
            self::HalfSibling => self::HalfSibling,
            self::StepParent => self::StepChild,
            self::StepChild => self::StepParent,
            self::AdoptedParent => self::AdoptedChild,
            self::AdoptedChild => self::AdoptedParent,
            self::Guardian => self::Guardian,
            self::FosterParent => self::FosterParent,
        };
    }
}
