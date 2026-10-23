<?php

declare(strict_types=1);

namespace BioColeta\Service;

use BioColeta\Domain\AnomalyDetector;
use BioColeta\Repository\TelemetryRepository;

final class TelemetryService
{
    public function __construct(
        private readonly TelemetryRepository $telemetryRepository,
        private readonly ?AnomalyDetector $anomalyDetector = null,
        private readonly TelemetryPayloadValidator $validator = new TelemetryPayloadValidator(),
    ) {
    }

    /**
     * @return array{id: int, alert_id: int|null}
     */
    public function ingest(array $payload): array
    {
        $row = $this->validator->validate($payload);
        $id = $this->telemetryRepository->insert($row);

        $alertId = null;
        if ($this->anomalyDetector !== null) {
            $alert = $this->anomalyDetector->evaluateAfterInsert($row['device_id'], $id);
            $alertId = $alert['id'] ?? null;
        }

        return ['id' => $id, 'alert_id' => $alertId];
    }
}
