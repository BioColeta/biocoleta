<?php

declare(strict_types=1);

namespace BioColeta\Tests\Unit;

use BioColeta\Domain\AnomalyDetector;
use BioColeta\Repository\AlertRepository;
use BioColeta\Repository\TelemetryRepository;
use PHPUnit\Framework\TestCase;

final class AnomalyDetectorTest extends TestCase
{
    public function test_is_anomalous_requires_high_level_and_low_flow(): void
    {
        $detector = $this->detectorWith([], false);

        self::assertTrue($detector->isAnomalous(75.0, 0.05));
        self::assertTrue($detector->isAnomalous(85.0, 0.01));
        self::assertFalse($detector->isAnomalous(74.9, 0.01));
        self::assertFalse($detector->isAnomalous(85.0, 0.06));
    }

    public function test_no_alert_with_fewer_than_two_readings(): void
    {
        $detector = $this->detectorWith([
            ['id' => 1, 'water_level' => 85, 'water_flow' => 0.01],
        ], false);

        self::assertNull($detector->evaluateAfterInsert('ESP32-DRAIN-0102', 1));
    }

    public function test_alert_when_two_consecutive_anomalous(): void
    {
        $detector = $this->detectorWith([
            ['id' => 2, 'water_level' => 85, 'water_flow' => 0.01],
            ['id' => 1, 'water_level' => 80, 'water_flow' => 0.0],
        ], false, expectCreate: true);

        $result = $detector->evaluateAfterInsert('ESP32-DRAIN-0102', 2);
        self::assertSame(['id' => 99], $result);
    }

    public function test_no_alert_when_second_reading_normal(): void
    {
        $detector = $this->detectorWith([
            ['id' => 2, 'water_level' => 20, 'water_flow' => 2.5],
            ['id' => 1, 'water_level' => 85, 'water_flow' => 0.01],
        ], false);

        self::assertNull($detector->evaluateAfterInsert('ESP32-DRAIN-0102', 2));
    }

    public function test_dedupe_skips_existing_pair(): void
    {
        $detector = $this->detectorWith([
            ['id' => 2, 'water_level' => 85, 'water_flow' => 0.01],
            ['id' => 1, 'water_level' => 80, 'water_flow' => 0.0],
        ], true);

        self::assertNull($detector->evaluateAfterInsert('ESP32-DRAIN-0102', 2));
    }

    /** @param list<array<string, mixed>> $latest */
    private function detectorWith(array $latest, bool $pairExists, bool $expectCreate = false): AnomalyDetector
    {
        $telemetry = $this->createMock(TelemetryRepository::class);
        $telemetry->method('findLatestByDevice')->willReturn($latest);

        $alerts = $this->createMock(AlertRepository::class);
        $alerts->method('existsForTelemetryPair')->willReturn($pairExists);
        if ($expectCreate) {
            $alerts->expects(self::once())->method('create')->willReturn(99);
        } else {
            $alerts->expects(self::never())->method('create');
        }

        return new AnomalyDetector($telemetry, $alerts);
    }
}
