<?php

declare(strict_types=1);

namespace BioColeta\Tests\Unit;

use BioColeta\App;
use PHPUnit\Framework\TestCase;

final class AppTest extends TestCase
{
    public function test_name_returns_product_name(): void
    {
        self::assertSame('BioColeta', App::name());
    }
}
