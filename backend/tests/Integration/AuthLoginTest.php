<?php

declare(strict_types=1);

namespace BioColeta\Tests\Integration;

use BioColeta\Database\ConnectionFactory;
use BioColeta\Repository\UserRepository;
use PDO;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class AuthLoginTest extends TestCase
{
    private PDO $pdo;

    protected function setUp(): void
    {
        $db = [
            'dsn' => 'mysql:host=127.0.0.1;port=3307;dbname=biocoleta;charset=utf8mb4',
            'user' => 'biocoleta',
            'password' => 'demo_db',
        ];
        try {
            $this->pdo = ConnectionFactory::fromConfig($db);
            $this->pdo->query('SELECT 1 FROM users LIMIT 1');
        } catch (RuntimeException |\PDOException $e) {
            self::markTestSkipped('MariaDB not available: ' . $e->getMessage());
        }
    }

    public function test_seed_operator_password_verifies(): void
    {
        $user = (new UserRepository($this->pdo))->findByUsername('operator');
        self::assertNotNull($user);
        self::assertTrue(password_verify('demo_operator', (string) $user['password_hash']));
        self::assertFalse(password_verify('wrong-password', (string) $user['password_hash']));
    }
}
