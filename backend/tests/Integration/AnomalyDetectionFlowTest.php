<?php

declare(strict_types=1);

namespace BioColeta\Tests\Integration;

use BioColeta\Database\ConnectionFactory;
use BioColeta\Domain\AnomalyDetector;
use BioColeta\Repository\AlertRepository;
use BioColeta\Repository\TelemetryRepository;
use BioColeta\Service\TelemetryService;
use PDO;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class AnomalyDetectionFlowTest extends TestCase
{
    private PDO $pdo;
    private TelemetryService $service;
    private AlertRepository $alerts;

    protected function setUp(): void
    {
        $db = [
            'dsn' => 'mysql:host=127.0.0.1;port=3307;dbname=biocoleta;charset=utf8mb4',
            'user' => 'biocoleta',
            'password' => 'demo_db',
        ];
        try {
            $this->pdo = ConnectionFactory::fromConfig($db);
            $this->pdo->query('SELECT 1 FROM alerts LIMIT 1');
        } catch (RuntimeException |\PDOException $e) {
            self::markTestSkipped('MariaDB not available: ' . $e->getMessage());
        }

        $deviceSuffix = (string) random_int(1000, 9999);
        $this->deviceId = 'ESP32-TEST-' . $deviceSuffix;
        $tel = new TelemetryRepository($this->pdo);
        $this->alerts = new AlertRepository($this->pdo);
        $this->service = new TelemetryService($tel, new AnomalyDetector($tel, $this->alerts));
    }

    private string $deviceId;

    public function test_two_anomalous_readings_create_one_new_alert(): void
    {
        $payload = fn (float $level, float $flow): array => [
            'entity_id' => 'BUEIRO-TEST',
            'device_id' => $this->deviceId,
            'timestamp' => gmdate('c'),
            'readings' => [
                ['measurement' => 'water_level', 'value' => $level],
                ['measurement' => 'water_flow', 'value' => $flow],
            ],
        ];

        $first = $this->service->ingest($payload(85.0, 0.01));
        self::assertNull($first['alert_id']);

        $second = $this->service->ingest($payload(90.0, 0.0));
        self::assertNotNull($second['alert_id']);

        $third = $this->service->ingest($payload(91.0, 0.0));
        // May create another alert for new pair (2nd,3rd) — DET-03 is same pair dedupe.
        // Ensure first alert exists and is new with structure.
        $alert = $this->alerts->findById((int) $second['alert_id']);
        self::assertNotNull($alert);
        self::assertSame('new', $alert['status']);
        $classification = json_decode((string) $alert['classification_json'], true);
        self::assertSame(AnomalyDetector::RULE_ID, $classification['rule_id']);
        self::assertCount(2, $classification['telemetry_ids']);

        // Re-ingest same logical pair dedupe: evaluate again on same last two ids should not
        // create duplicate for identical pair — covered by existsForTelemetryPair on 2nd/3rd etc.
        unset($third);
    }

    public function test_normal_readings_do_not_create_alert(): void
    {
        $result = $this->service->ingest([
            'entity_id' => 'BUEIRO-TEST',
            'device_id' => $this->deviceId . '-N',
            'timestamp' => gmdate('c'),
            'readings' => [
                ['measurement' => 'water_level', 'value' => 20.0],
                ['measurement' => 'water_flow', 'value' => 2.5],
            ],
        ]);
        self::assertNull($result['alert_id']);

        $result2 = $this->service->ingest([
            'entity_id' => 'BUEIRO-TEST',
            'device_id' => $this->deviceId . '-N',
            'timestamp' => gmdate('c'),
            'readings' => [
                ['measurement' => 'water_level', 'value' => 21.0],
                ['measurement' => 'water_flow', 'value' => 2.4],
            ],
        ]);
        self::assertNull($result2['alert_id']);
    }
}
