<?php

declare(strict_types=1);

namespace BioColeta\Tests\Unit;

use PHPUnit\Framework\TestCase;

final class ConfigTest extends TestCase
{
    public function test_app_config_loads_without_database(): void
    {
        $config = require dirname(__DIR__, 2) . '/config/app.php';

        self::assertIsArray($config);
        self::assertSame('BioColeta', $config['name']);
        self::assertArrayHasKey('device_key', $config);
        self::assertArrayHasKey('dsn', $config['db']);
        self::assertDirectoryExists($config['views_path']);
        self::assertDirectoryExists($config['assets_path']);
    }
}
