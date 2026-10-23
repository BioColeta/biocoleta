<?php

declare(strict_types=1);

namespace BioColeta\Http;

final class SessionGate
{
    public static function start(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
    }

    public static function userId(): ?int
    {
        self::start();
        return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
    }

    public static function requireUser(): int
    {
        $id = self::userId();
        if ($id === null) {
            header('Location: /login');
            exit;
        }

        return $id;
    }

    public static function login(int $userId, string $username): void
    {
        self::start();
        $_SESSION['user_id'] = $userId;
        $_SESSION['username'] = $username;
    }

    public static function logout(): void
    {
        self::start();
        $_SESSION = [];
        session_destroy();
    }
}
