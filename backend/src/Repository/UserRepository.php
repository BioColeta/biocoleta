<?php

declare(strict_types=1);

namespace BioColeta\Repository;

use PDO;

class UserRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function findByUsername(string $username): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE username = :username');
        $stmt->execute(['username' => $username]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }
}
