<?php

declare(strict_types=1);

namespace App\Enum;

enum AuditAction: string
{
    case Created  = 'created';
    case Updated  = 'updated';
    case Deleted  = 'deleted';
    case Restored = 'restored';
    case Approved = 'approved';
    case Rejected = 'rejected';
}
