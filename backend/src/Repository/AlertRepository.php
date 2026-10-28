<?php

declare(strict_types=1);

namespace BioColeta\Repository;

use PDO;

class AlertRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function create(string $deviceId, string $ruleId, array $classification): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO alerts (device_id, status, rule_id, classification_json)
             VALUES (:device_id, \'new\', :rule_id, :classification_json)'
        );
        $stmt->execute([
            'device_id' => $deviceId,
            'rule_id' => $ruleId,
            'classification_json' => json_encode($classification, JSON_THROW_ON_ERROR),
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    public function existsForTelemetryPair(int $firstId, int $secondId): bool
    {
        $stmt = $this->pdo->prepare(
            "SELECT id FROM alerts
             WHERE JSON_CONTAINS(classification_json, :pair, '$.telemetry_ids')"
        );
        $pair = json_encode([$firstId, $secondId], JSON_THROW_ON_ERROR);
        $stmt->execute(['pair' => $pair]);

        return $stmt->fetch() !== false;
    }

    /** @return list<array<string, mixed>> */
    public function listPending(): array
    {
        return $this->listByStatuses(['new', 'investigating']);
    }

    /**
     * @param list<string> $statuses
     * @return list<array<string, mixed>>
     */
    public function listByStatuses(array $statuses): array
    {
        $placeholders = implode(', ', array_fill(0, count($statuses), '?'));
        $stmt = $this->pdo->prepare(
            "SELECT a.*, d.entity_id, d.latitude, d.longitude
             FROM alerts a
             LEFT JOIN devices d ON d.device_id = a.device_id
             WHERE a.status IN ({$placeholders})
             ORDER BY a.created_at DESC"
        );
        $stmt->execute($statuses);

        return $stmt === false ? [] : $stmt->fetchAll();
    }

    /**
     * Board rows for the operator map: every active device plus a synthetic
     * placeholder for devices that currently have no alert, so the map shows
     * all monitored drains (obstructed or normal).
     *
     * @return list<array<string, mixed>>
     */
    public function listBoard(): array
    {
        $stmt = $this->pdo->query(
            "SELECT a.id, a.device_id, a.status, a.rule_id, a.classification_json,
                    a.created_at, a.resolved_at, d.entity_id, d.latitude, d.longitude
             FROM alerts a
             JOIN devices d ON d.device_id = a.device_id
             UNION ALL
             SELECT NULL AS id, d.device_id, 'clear' AS status, NULL AS rule_id,
                    '{}' AS classification_json, d.created_at, NULL AS resolved_at,
                    d.entity_id, d.latitude, d.longitude
             FROM devices d
             WHERE d.active = 1
               AND NOT EXISTS (SELECT 1 FROM alerts a WHERE a.device_id = d.device_id)
             ORDER BY created_at DESC"
        );

        return $stmt === false ? [] : $stmt->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM alerts WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    /**
     * Auto-close any still-open obstruction alerts for a device once telemetry
     * normalizes. Confirmed (`resolved`) alerts are closed too so the drain
     * leaves the red state only when readings are healthy again.
     */
    public function autoClearForDevice(string $deviceId): int
    {
        $stmt = $this->pdo->prepare(
            "UPDATE alerts
             SET status = 'cleared', resolved_at = CURRENT_TIMESTAMP(3)
             WHERE device_id = :device_id
               AND status IN ('new', 'investigating', 'resolved')"
        );
        $stmt->execute(['device_id' => $deviceId]);

        return $stmt->rowCount();
    }

    public function markResolved(int $alertId): void
    {
        $stmt = $this->pdo->prepare(
            "UPDATE alerts SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP(3)
             WHERE id = :id AND status <> 'resolved'"
        );
        $stmt->execute(['id' => $alertId]);
    }

    public function updateStatus(int $alertId, string $status): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE alerts
             SET status = :status,
             resolved_at = CASE WHEN :resolved_status IN (\'resolved\', \'false_positive\')
                                THEN CURRENT_TIMESTAMP(3) ELSE NULL END
             WHERE id = :id'
        );
        $stmt->execute([
            'status' => $status,
            'resolved_status' => $status,
            'id' => $alertId,
        ]);

        return $stmt->rowCount() > 0;
    }
}
