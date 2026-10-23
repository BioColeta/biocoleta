<?php

declare(strict_types=1);

use BioColeta\Database\ConnectionFactory;
use BioColeta\Domain\AnomalyDetector;
use BioColeta\Http\JsonResponse;
use BioColeta\Http\TelemetryController;
use BioColeta\Repository\AlertRepository;
use BioColeta\Repository\TelemetryRepository;
use BioColeta\Service\TelemetryService;
use Throwable;

require dirname(__DIR__) . '/vendor/autoload.php';

$config = require dirname(__DIR__) . '/config/app.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if ($method === 'POST' && $path === '/api/telemetry') {
    try {
        $pdo = ConnectionFactory::fromConfig($config['db']);
    } catch (Throwable $e) {
        JsonResponse::send(503, ['error' => 'service_unavailable']);
        exit;
    }

    $telemetryRepository = new TelemetryRepository($pdo);
    $alertRepository = new AlertRepository($pdo);
    $detector = new AnomalyDetector($telemetryRepository, $alertRepository);

    $controller = new TelemetryController(
        new TelemetryService($telemetryRepository, $detector),
        (string) $config['device_key'],
    );
    $controller->create();
    exit;
}

JsonResponse::send(404, ['error' => 'not_found']);
