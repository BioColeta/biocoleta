<?php

declare(strict_types=1);

namespace BioColeta\Http;

use BioColeta\Repository\UserRepository;

final class AuthController
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly string $viewsPath,
    ) {
    }

    public function showLogin(?string $error = null): void
    {
        View::render($this->viewsPath, 'login', ['error' => $error]);
    }

    public function login(): void
    {
        $username = trim((string) ($_POST['username'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');
        $user = $this->users->findByUsername($username);

        if ($user === null || !password_verify($password, (string) $user['password_hash'])) {
            $this->showLogin('Credenciais inválidas');
            return;
        }

        SessionGate::login((int) $user['id'], (string) $user['username']);
        header('Location: /alerts');
        exit;
    }

    public function logout(): void
    {
        SessionGate::logout();
        header('Location: /login');
        exit;
    }
}
