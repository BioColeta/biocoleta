<?php

declare(strict_types=1);

namespace BioColeta\Repository;

use PDO;

class DecisionRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function create(int $alertId, int $userId, string $outcome, ?string $note): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO decisions (alert_id, user_id, outcome, note)
             VALUES (:alert_id, :user_id, :outcome, :note)'
        );
        $stmt->execute([
            'alert_id' => $alertId,
            'user_id' => $userId,
            'outcome' => $outcome,
            'note' => $note,
        ]);

        return (int) $this->pdo->lastInsertId();
    }
}
