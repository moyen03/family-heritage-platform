<?php

declare(strict_types=1);

namespace App\Enum;

enum PrivacyLevel: string
{
    case Public  = 'public';
    case Family  = 'family';
    case Private = 'private';
}

