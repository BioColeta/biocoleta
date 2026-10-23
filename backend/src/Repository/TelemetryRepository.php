<?php

declare(strict_types=1);

namespace BioColeta\Repository;

use PDO;

class TelemetryRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @param array{
     *   device_id: string,
     *   entity_id: string,
     *   recorded_at: string,
     *   water_level: float,
     *   water_flow: float,
     *   quality: ?float,
     *   tamper_alert: bool,
     *   raw_json: array|string
     * } $row
     */
    public function insert(array $row): int
    {
        $rawJson = is_string($row['raw_json'])
            ? $row['raw_json']
            : json_encode($row['raw_json'], JSON_THROW_ON_ERROR);

        $stmt = $this->pdo->prepare(
            'INSERT INTO telemetry (
                device_id, entity_id, recorded_at, water_level, water_flow,
                quality, tamper_alert, raw_json
            ) VALUES (
                :device_id, :entity_id, :recorded_at, :water_level, :water_flow,
                :quality, :tamper_alert, :raw_json
            )'
        );

        $stmt->execute([
            'device_id' => $row['device_id'],
            'entity_id' => $row['entity_id'],
            'recorded_at' => $row['recorded_at'],
            'water_level' => $row['water_level'],
            'water_flow' => $row['water_flow'],
            'quality' => $row['quality'],
            'tamper_alert' => $row['tamper_alert'] ? 1 : 0,
            'raw_json' => $rawJson,
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM telemetry WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    /** @return list<array<string, mixed>> newest first */
    public function findLatestByDevice(string $deviceId, int $limit): array
    {
        $limit = max(1, $limit);
        $stmt = $this->pdo->prepare(
            "SELECT * FROM telemetry
             WHERE device_id = :device_id
             ORDER BY id DESC
             LIMIT {$limit}"
        );
        $stmt->execute(['device_id' => $deviceId]);

        return $stmt->fetchAll();
    }
}

