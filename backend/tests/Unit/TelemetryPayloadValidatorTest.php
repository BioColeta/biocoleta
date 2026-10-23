<?php

declare(strict_types=1);

namespace BioColeta\Tests\Unit;

use BioColeta\Service\TelemetryPayloadValidator;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class TelemetryPayloadValidatorTest extends TestCase
{
    private TelemetryPayloadValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new TelemetryPayloadValidator();
    }

    public function test_valid_payload_maps_level_and_flow(): void
    {
        $row = $this->validator->validate($this->samplePayload());

        self::assertSame('ESP32-DRAIN-0102', $row['device_id']);
        self::assertSame(20.0, $row['water_level']);
        self::assertSame(2.5, $row['water_flow']);
        self::assertFalse($row['tamper_alert']);
    }

    public function test_missing_device_id_is_rejected(): void
    {
        $payload = $this->samplePayload();
        unset($payload['device_id']);

        $this->expectException(InvalidArgumentException::class);
        $this->validator->validate($payload);
    }

    public function test_missing_water_level_reading_is_rejected(): void
    {
        $payload = $this->samplePayload();
        $payload['readings'] = [
            ['measurement' => 'water_flow', 'value' => 2.5],
        ];

        $this->expectException(InvalidArgumentException::class);
        $this->validator->validate($payload);
    }

    private function samplePayload(): array
    {
        return [
            'city_id' => 'MATAO-SP',
            'sector' => 'sanitation',
            'entity_type' => 'drain',
            'entity_id' => 'BUEIRO-0102',
            'device_id' => 'ESP32-DRAIN-0102',
            'timestamp' => '2026-10-23T14:00:00.000Z',
            'readings' => [
                ['sensor_id' => 'WATER-LEVEL-01', 'measurement' => 'water_level', 'value' => 20.0, 'unit' => 'percent'],
                ['sensor_id' => 'WATER-FLOW-01', 'measurement' => 'water_flow', 'value' => 2.5, 'unit' => 'L/s'],
            ],
            'quality' => 0.98,
            'tamper_alert' => false,
        ];
    }
}
