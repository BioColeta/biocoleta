<?php

declare(strict_types=1);

namespace BioColeta\Repository;

use PDO;

class DecisionRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function existsForAlert(int $alertId): bool
    {
        $stmt = $this->pdo->prepare('SELECT id FROM decisions WHERE alert_id = :alert_id LIMIT 1');
        $stmt->execute(['alert_id' => $alertId]);

        return $stmt->fetch() !== false;
    }

    public function create(int $alertId, int $userId, string $outcome): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO decisions (alert_id, user_id, outcome)
             VALUES (:alert_id, :user_id, :outcome)'
        );
        $stmt->execute([
            'alert_id' => $alertId,
            'user_id' => $userId,
            'outcome' => $outcome,
        ]);

        return (int) $this->pdo->lastInsertId();
    }
}
