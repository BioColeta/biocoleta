<?php

declare(strict_types=1);

use BioColeta\Database\ConnectionFactory;
use BioColeta\Domain\AnomalyDetector;
use BioColeta\Http\AlertController;
use BioColeta\Http\AuthController;
use BioColeta\Http\JsonResponse;
use BioColeta\Http\SessionGate;
use BioColeta\Http\TelemetryController;
use BioColeta\Repository\AlertRepository;
use BioColeta\Repository\DecisionRepository;
use BioColeta\Repository\TelemetryRepository;
use BioColeta\Repository\UserRepository;
use BioColeta\Service\AlertService;
use BioColeta\Service\TelemetryService;
use Throwable;

require dirname(__DIR__) . '/vendor/autoload.php';

$config = require dirname(__DIR__) . '/config/app.php';
$viewsPath = (string) $config['views_path'];
$assetsPath = (string) $config['assets_path'];

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if ($method === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, X-Device-Key');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    http_response_code(204);
    exit;
}

if (str_starts_with($path, '/assets/')) {
    $file = $assetsPath . '/' . basename($path);
    if (!is_file($file)) {
        http_response_code(404);
        exit;
    }
    $ext = pathinfo($file, PATHINFO_EXTENSION);
    $types = ['css' => 'text/css', 'js' => 'application/javascript'];
    header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
    readfile($file);
    exit;
}

try {
    $pdo = ConnectionFactory::fromConfig($config['db']);
} catch (Throwable $e) {
    if (str_starts_with($path, '/api/')) {
        JsonResponse::send(503, ['error' => 'service_unavailable']);
        exit;
    }
    http_response_code(503);
    echo 'Database unavailable';
    exit;
}

$telemetryRepository = new TelemetryRepository($pdo);
$alertRepository = new AlertRepository($pdo);
$userRepository = new UserRepository($pdo);
$decisionRepository = new DecisionRepository($pdo);
$alertService = new AlertService($alertRepository, $decisionRepository);
$authController = new AuthController($userRepository, $viewsPath);
$alertController = new AlertController($alertService, $viewsPath);

if ($method === 'POST' && $path === '/api/telemetry') {
    $detector = new AnomalyDetector($telemetryRepository, $alertRepository);
    $controller = new TelemetryController(
        new TelemetryService($telemetryRepository, $detector),
        (string) $config['device_key'],
    );
    $controller->create();
    exit;
}

SessionGate::start();

if ($path === '/' && $method === 'GET') {
    header('Location: ' . (SessionGate::userId() ? '/alerts' : '/login'));
    exit;
}

if ($path === '/login' && $method === 'GET') {
    $authController->showLogin();
    exit;
}

if ($path === '/login' && $method === 'POST') {
    $authController->login();
    exit;
}

if ($path === '/logout' && $method === 'POST') {
    $authController->logout();
    exit;
}

if ($path === '/alerts' && $method === 'GET') {
    $alertController->index();
    exit;
}

if ($method === 'POST' && preg_match('#^/alerts/(\d+)/decision$#', $path, $matches) === 1) {
    $alertController->decide((int) $matches[1]);
    exit;
}

if (str_starts_with($path, '/api/')) {
    JsonResponse::send(404, ['error' => 'not_found']);
    exit;
}

http_response_code(404);
echo 'Not found';
