<?php

declare(strict_types=1);

namespace BioColeta\Http;

use BioColeta\Service\TelemetryService;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

final class TelemetryController
{
    public function __construct(
        private readonly TelemetryService $telemetryService,
        private readonly string $deviceKey,
    ) {
    }

    public function create(?string $rawBody = null): void
    {
        $providedKey = $_SERVER['HTTP_X_DEVICE_KEY'] ?? '';
        if ($this->deviceKey === '' || !hash_equals($this->deviceKey, (string) $providedKey)) {
            JsonResponse::send(401, ['error' => 'unauthorized']);
            return;
        }

        $raw = $rawBody ?? file_get_contents('php://input');
        if ($raw === false || $raw === '') {
            JsonResponse::send(400, ['error' => 'invalid_json']);
            return;
        }

        try {
            $payload = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            JsonResponse::send(400, ['error' => 'invalid_json']);
            return;
        }

        if (!is_array($payload)) {
            JsonResponse::send(400, ['error' => 'invalid_json']);
            return;
        }

        try {
            $result = $this->telemetryService->ingest($payload);
            JsonResponse::send(201, $result);
        } catch (InvalidArgumentException $e) {
            JsonResponse::send(400, ['error' => 'validation_failed', 'message' => $e->getMessage()]);
        } catch (RuntimeException $e) {
            JsonResponse::send(503, ['error' => 'service_unavailable', 'message' => $e->getMessage()]);
        }
    }
}
