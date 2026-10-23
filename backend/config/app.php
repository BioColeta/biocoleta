<?php

declare(strict_types=1);

/**
 * Application configuration. Secrets come from environment variables.
 * Copy `.env.example` to `.env` for local development (not loaded automatically
 * unless you export vars or use a process manager).
 */
return [
    'name' => 'BioColeta',
    'env' => getenv('APP_ENV') ?: 'local',
    'device_key' => getenv('DEVICE_KEY') ?: '',
    'views_path' => getenv('VIEWS_PATH') ?: dirname(__DIR__, 2) . '/frontend/views',
    'assets_path' => getenv('ASSETS_PATH') ?: dirname(__DIR__, 2) . '/frontend/assets',
    'db' => [
        'dsn' => getenv('DB_DSN') ?: 'mysql:host=127.0.0.1;port=3306;dbname=biocoleta;charset=utf8mb4',
        'user' => getenv('DB_USER') ?: 'biocoleta',
        'password' => getenv('DB_PASSWORD') ?: '',
    ],
];
