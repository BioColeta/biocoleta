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
             VALUES (:device_id, \'pending\', :rule_id, :classification_json)'
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
        $stmt = $this->pdo->query(
            "SELECT * FROM alerts WHERE status = 'pending' ORDER BY created_at DESC"
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

    public function markResolved(int $alertId): void
    {
        $stmt = $this->pdo->prepare(
            "UPDATE alerts SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP(3)
             WHERE id = :id AND status = 'pending'"
        );
        $stmt->execute(['id' => $alertId]);
    }
}
