<?php

declare(strict_types=1);

namespace BioColeta\Tests\Integration;

use BioColeta\Database\ConnectionFactory;
use BioColeta\Repository\TelemetryRepository;
use PDO;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class TelemetryRepositoryTest extends TestCase
{
    private PDO $pdo;

    protected function setUp(): void
    {
        $config = require dirname(__DIR__, 2) . '/config/app.php';
        $db = $config['db'];

        if (getenv('DB_DSN') === false || getenv('DB_DSN') === '') {
            $db['dsn'] = 'mysql:host=127.0.0.1;port=3307;dbname=biocoleta;charset=utf8mb4';
            $db['user'] = 'biocoleta';
            $db['password'] = 'demo_db';
        }

        try {
            $this->pdo = ConnectionFactory::fromConfig($db);
            $this->pdo->query('SELECT 1 FROM telemetry LIMIT 1');
        } catch (RuntimeException |\PDOException $e) {
            self::markTestSkipped('MariaDB not available for integration tests: ' . $e->getMessage());
        }
    }

    public function test_insert_persists_telemetry_row(): void
    {
        $repo = new TelemetryRepository($this->pdo);
        $payload = [
            'device_id' => 'ESP32-DRAIN-0102',
            'entity_id' => 'BUEIRO-0102',
            'timestamp' => '2026-10-23T14:00:00.000Z',
            'readings' => [
                ['measurement' => 'water_level', 'value' => 20.0],
                ['measurement' => 'water_flow', 'value' => 2.5],
            ],
        ];

        $id = $repo->insert([
            'device_id' => 'ESP32-DRAIN-0102',
            'entity_id' => 'BUEIRO-0102',
            'recorded_at' => '2026-10-23 14:00:00.000',
            'water_level' => 20.0,
            'water_flow' => 2.5,
            'quality' => 0.98,
            'tamper_alert' => false,
            'raw_json' => $payload,
        ]);

        self::assertGreaterThan(0, $id);

        $row = $repo->findById($id);
        self::assertNotNull($row);
        self::assertSame('ESP32-DRAIN-0102', $row['device_id']);
        self::assertEqualsWithDelta(20.0, (float) $row['water_level'], 0.001);
        self::assertEqualsWithDelta(2.5, (float) $row['water_flow'], 0.001);
    }
}
