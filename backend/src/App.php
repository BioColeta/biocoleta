<?php

declare(strict_types=1);

namespace BioColeta;

final class App
{
    public const NAME = 'BioColeta';

    public static function name(): string
    {
        return self::NAME;
    }
}
