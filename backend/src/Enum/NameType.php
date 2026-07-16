<?php

declare(strict_types=1);

namespace App\Enum;

enum NameType: string
{
    case Birth    = 'birth';
    case Nickname = 'nickname';
    case Title    = 'title';
    case Alias    = 'alias';
    case Married  = 'married';

    public function label(): string
    {
        return match($this) {
            self::Birth    => 'Birth Name',
            self::Nickname => 'Nickname',
            self::Title    => 'Title / Honorific',
            self::Alias    => 'Alias',
            self::Married  => 'Married Name',
        };
    }
}

