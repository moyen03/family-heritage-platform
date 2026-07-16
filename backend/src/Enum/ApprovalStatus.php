<?php

declare(strict_types=1);

namespace App\Enum;

enum ApprovalStatus: string
{
    case Pending           = 'pending';
    case Approved          = 'approved';
    case Rejected          = 'rejected';
    case RevisionRequested = 'revision_requested';

    public function label(): string
    {
        return match ($this) {
            self::Pending           => 'Pending Review',
            self::Approved          => 'Approved',
            self::Rejected          => 'Rejected',
            self::RevisionRequested => 'Revision Requested',
        };
    }

    public function isTerminal(): bool
    {
        return match ($this) {
            self::Approved, self::Rejected => true,
            default                        => false,
        };
    }
}
