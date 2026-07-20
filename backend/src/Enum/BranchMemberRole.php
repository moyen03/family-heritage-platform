<?php

declare(strict_types=1);

namespace App\Enum;

enum BranchMemberRole: string
{
    case Viewer = 'viewer';
    case Member = 'member';

    public function label(): string
    {
        return match($this) {
            self::Viewer => 'Viewer',
            self::Member => 'Member',
        };
    }
}
