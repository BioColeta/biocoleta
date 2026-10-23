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
        $alerts = $this->alertService->listPending();
        $decoded = array_map(static function (array $alert): array {
            $alert['classification'] = json_decode((string) $alert['classification_json'], true) ?: [];
            return $alert;
        }, $alerts);

        View::render($this->viewsPath, 'alerts', [
            'alerts' => $decoded,
            'username' => $_SESSION['username'] ?? 'operator',
            'error' => null,
        ]);
    }

    public function decide(int $alertId): void
    {
        $userId = SessionGate::requireUser();
        $outcome = (string) ($_POST['outcome'] ?? '');
        $note = trim((string) ($_POST['note'] ?? ''));
        $note = $note === '' ? null : $note;

        try {
            $this->alertService->decide($alertId, $outcome, $note, $userId);
            header('Location: /alerts');
            exit;
        } catch (DomainException $e) {
            http_response_code(409);
            View::render($this->viewsPath, 'alerts', [
                'alerts' => $this->alertService->listPending(),
                'username' => $_SESSION['username'] ?? 'operator',
                'error' => 'Alerta já resolvido',
            ]);
        } catch (InvalidArgumentException $e) {
            http_response_code(400);
            View::render($this->viewsPath, 'alerts', [
                'alerts' => $this->alertService->listPending(),
                'username' => $_SESSION['username'] ?? 'operator',
                'error' => $e->getMessage(),
            ]);
        }
    }
}
