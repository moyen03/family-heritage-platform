<?php

declare(strict_types=1);

namespace App\Enum;

enum DatePrecision: string
{
    case Exact = 'exact';
    case Year = 'year';
    case Approximate = 'approximate';
    case Unknown = 'unknown';
}
