<?php

declare(strict_types=1);

namespace App\Enum;

enum AddressType: string
{
    case Current    = 'current';
    case Historical = 'historical';
    case Birth      = 'birth';
    case Childhood  = 'childhood';
}

