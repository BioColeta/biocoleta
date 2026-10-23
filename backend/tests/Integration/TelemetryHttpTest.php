<?php

declare(strict_types=1);

namespace BioColeta\Tests\Integration;

use BioColeta\Database\ConnectionFactory;
use BioColeta\Http\TelemetryController;
use BioColeta\Repository\TelemetryRepository;
use BioColeta\Service\TelemetryService;
use PDO;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class TelemetryHttpTest extends TestCase
{
    private PDO $pdo;
    private string $deviceKey = 'demo-device-key';

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
            self::markTestSkipped('MariaDB not available: ' . $e->getMessage());
        }
    }

    public function test_valid_post_returns_201_with_id(): void
    {
        $controller = new TelemetryController(
            new TelemetryService(new TelemetryRepository($this->pdo)),
            $this->deviceKey,
        );

        $_SERVER['HTTP_X_DEVICE_KEY'] = $this->deviceKey;
        $payload = json_encode([
            'entity_id' => 'BUEIRO-0102',
            'device_id' => 'ESP32-DRAIN-0102',
            'timestamp' => '2026-10-23T15:00:00.000Z',
            'readings' => [
                ['measurement' => 'water_level', 'value' => 22.0],
                ['measurement' => 'water_flow', 'value' => 2.2],
            ],
            'quality' => 0.9,
            'tamper_alert' => false,
        ], JSON_THROW_ON_ERROR);

        ob_start();
        $controller->create($payload);
        $output = ob_get_clean();
        $body = json_decode((string) $output, true);

        self::assertSame(201, http_response_code());
        self::assertIsArray($body);
        self::assertArrayHasKey('id', $body);
        self::assertGreaterThan(0, $body['id']);
    }

    public function test_invalid_payload_returns_400(): void
    {
        $controller = new TelemetryController(
            new TelemetryService(new TelemetryRepository($this->pdo)),
            $this->deviceKey,
        );

        $_SERVER['HTTP_X_DEVICE_KEY'] = $this->deviceKey;

        ob_start();
        $controller->create('{"device_id":"x"}');
        $output = ob_get_clean();

        self::assertSame(400, http_response_code());
        self::assertStringContainsString('validation_failed', (string) $output);
    }
}
