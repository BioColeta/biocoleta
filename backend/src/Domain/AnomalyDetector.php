<?php

declare(strict_types=1);

namespace BioColeta\Domain;

use BioColeta\Repository\AlertRepository;
use BioColeta\Repository\TelemetryRepository;

final class AnomalyDetector
{
    public const RULE_ID = 'obstruction_level_flow_v1';
    public const LEVEL_MIN = 75.0;
    public const FLOW_MAX = 0.05;
    public const CONSECUTIVE = 2;

    public function __construct(
        private readonly TelemetryRepository $telemetryRepository,
        private readonly AlertRepository $alertRepository,
    ) {
    }

    /**
     * @return array{id: int}|null
     */
    public function evaluateAfterInsert(string $deviceId, int $telemetryId): ?array
    {
        $readings = $this->telemetryRepository->findLatestByDevice($deviceId, self::CONSECUTIVE);
        if (count($readings) < self::CONSECUTIVE) {
            return null;
        }

        // findLatest returns newest first; normalize oldest → newest for pair
        $pair = array_reverse($readings);
        foreach ($pair as $reading) {
            if (!$this->isAnomalous((float) $reading['water_level'], (float) $reading['water_flow'])) {
                return null;
            }
        }

        $ids = array_map(static fn (array $r): int => (int) $r['id'], $pair);
        if ($this->alertRepository->existsForTelemetryPair($ids[0], $ids[1])) {
            return null;
        }

        $classification = [
            'rule_id' => self::RULE_ID,
            'thresholds' => [
                'water_level_min' => self::LEVEL_MIN,
                'water_flow_max' => self::FLOW_MAX,
                'consecutive' => self::CONSECUTIVE,
            ],
            'telemetry_ids' => $ids,
            'readings' => array_map(static fn (array $r): array => [
                'id' => (int) $r['id'],
                'water_level' => (float) $r['water_level'],
                'water_flow' => (float) $r['water_flow'],
            ], $pair),
        ];

        $alertId = $this->alertRepository->create($deviceId, self::RULE_ID, $classification);

        return ['id' => $alertId];
    }

    public function isAnomalous(float $waterLevel, float $waterFlow): bool
    {
        return $waterLevel >= self::LEVEL_MIN && $waterFlow <= self::FLOW_MAX;
    }
}
