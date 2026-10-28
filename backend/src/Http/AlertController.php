<?php

declare(strict_types=1);

namespace BioColeta\Http;

use BioColeta\Service\AlertService;
use DomainException;
use InvalidArgumentException;

final class AlertController
{
    public function __construct(
        private readonly AlertService $alertService,
        private readonly string $viewsPath,
    ) {
    }

    public function index(): void
    {
        SessionGate::requireUser();
        View::render($this->viewsPath, 'alerts', [
            'alerts' => $this->boardAlerts(),
            'username' => $_SESSION['username'] ?? 'operator',
            'error' => null,
        ]);
    }

    public function listJson(): void
    {
        if (SessionGate::userId() === null) {
            JsonResponse::send(401, ['error' => 'unauthorized']);
            return;
        }

        JsonResponse::send(200, ['alerts' => $this->boardAlerts()]);
    }

    /** @return list<array<string, mixed>> */
    private function boardAlerts(): array
    {
        return array_map(static function (array $alert): array {
            $alert['classification'] = json_decode((string) $alert['classification_json'], true) ?: [];
            $alert['latitude'] = isset($alert['latitude']) ? (float) $alert['latitude'] : null;
            $alert['longitude'] = isset($alert['longitude']) ? (float) $alert['longitude'] : null;
            return $alert;
        }, $this->alertService->listBoard());
    }

    public function decide(int $alertId): void
    {
        $userId = SessionGate::requireUser();
        $outcome = (string) ($_POST['outcome'] ?? '');

        try {
            $this->alertService->decide($alertId, $outcome, $userId);
            header('Location: /alerts');
            exit;
        } catch (DomainException $e) {
            http_response_code(409);
            View::render($this->viewsPath, 'alerts', [
                'alerts' => $this->boardAlerts(),
                'username' => $_SESSION['username'] ?? 'operator',
                'error' => 'Alerta já encerrado',
            ]);
        } catch (InvalidArgumentException $e) {
            http_response_code(400);
            View::render($this->viewsPath, 'alerts', [
                'alerts' => $this->boardAlerts(),
                'username' => $_SESSION['username'] ?? 'operator',
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function move(int $alertId): void
    {
        if (SessionGate::userId() === null) {
            JsonResponse::send(401, ['error' => 'unauthorized']);
            return;
        }
        $status = (string) ($_POST['status'] ?? '');

        try {
            $this->alertService->move($alertId, $status);
            JsonResponse::send(200, ['ok' => true]);
        } catch (DomainException $e) {
            JsonResponse::send(409, ['error' => $e->getMessage()]);
        } catch (InvalidArgumentException $e) {
            JsonResponse::send(400, ['error' => $e->getMessage()]);
        }
    }
}
