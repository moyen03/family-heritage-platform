<?php

declare(strict_types=1);

namespace App\Enum;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case BranchAdmin = 'branch_admin';
    case Member = 'member';
    case Viewer = 'viewer';

    public function label(): string
    {
        return match($this) {
            self::SuperAdmin => 'Super Admin',
            self::BranchAdmin => 'Branch Admin',
            self::Member => 'Member',
            self::Viewer => 'Viewer',
        };
    }

    public function symfonyRole(): string
    {
        return match($this) {
            self::SuperAdmin => 'ROLE_SUPER_ADMIN',
            self::BranchAdmin => 'ROLE_BRANCH_ADMIN',
            self::Member => 'ROLE_MEMBER',
            self::Viewer => 'ROLE_VIEWER',
        };
    }
}

