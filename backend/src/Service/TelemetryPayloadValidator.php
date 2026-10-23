<?php

declare(strict_types=1);

namespace BioColeta\Service;

use InvalidArgumentException;

final class TelemetryPayloadValidator
{
    /**
     * @return array{
     *   device_id: string,
     *   entity_id: string,
     *   recorded_at: string,
     *   water_level: float,
     *   water_flow: float,
     *   quality: ?float,
     *   tamper_alert: bool,
     *   raw_json: array
     * }
     */
    public function validate(array $payload): array
    {
        foreach (['device_id', 'entity_id', 'timestamp', 'readings'] as $field) {
            if (!array_key_exists($field, $payload) || $payload[$field] === null || $payload[$field] === '') {
                throw new InvalidArgumentException("Missing required field: {$field}");
            }
        }

        if (!is_array($payload['readings']) || $payload['readings'] === []) {
            throw new InvalidArgumentException('Missing required field: readings');
        }

        $level = $this->readingValue($payload['readings'], 'water_level');
        $flow = $this->readingValue($payload['readings'], 'water_flow');

        $recordedAt = $this->normalizeTimestamp((string) $payload['timestamp']);

        $quality = null;
        if (array_key_exists('quality', $payload) && $payload['quality'] !== null && $payload['quality'] !== '') {
            $quality = (float) $payload['quality'];
        }

        return [
            'device_id' => (string) $payload['device_id'],
            'entity_id' => (string) $payload['entity_id'],
            'recorded_at' => $recordedAt,
            'water_level' => $level,
            'water_flow' => $flow,
            'quality' => $quality,
            'tamper_alert' => (bool) ($payload['tamper_alert'] ?? false),
            'raw_json' => $payload,
        ];
    }

    private function readingValue(array $readings, string $measurement): float
    {
        foreach ($readings as $reading) {
            if (!is_array($reading)) {
                continue;
            }
            if (($reading['measurement'] ?? null) === $measurement && array_key_exists('value', $reading)) {
                return (float) $reading['value'];
            }
        }

        throw new InvalidArgumentException("Missing reading: {$measurement}");
    }

    private function normalizeTimestamp(string $timestamp): string
    {
        $dt = date_create($timestamp);
        if ($dt === false) {
            throw new InvalidArgumentException('Invalid timestamp');
        }

        return $dt->format('Y-m-d H:i:s.v');
    }
}
