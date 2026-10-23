<?php

declare(strict_types=1);

namespace BioColeta\Database;

use PDO;
use PDOException;
use RuntimeException;

final class ConnectionFactory
{
    /**
     * @param array{dsn: string, user: string, password: string} $db
     */
    public static function fromConfig(array $db): PDO
    {
        try {
            $pdo = new PDO(
                $db['dsn'],
                $db['user'],
                $db['password'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
        } catch (PDOException $e) {
            throw new RuntimeException('Database connection failed: ' . $e->getMessage(), 0, $e);
        }

        return $pdo;
    }
}
