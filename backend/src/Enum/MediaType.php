<?php

declare(strict_types=1);

namespace App\Enum;

enum MediaType: string
{
    case Photo    = 'photo';
    case Video    = 'video';
    case Document = 'document';
    case Audio    = 'audio';
}
