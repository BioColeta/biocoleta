<?php

declare(strict_types=1);

namespace BioColeta\Service;

use BioColeta\Repository\TelemetryRepository;
use InvalidArgumentException;

final class TelemetryService
{
    public function __construct(
        private readonly TelemetryRepository $telemetryRepository,
        private readonly TelemetryPayloadValidator $validator = new TelemetryPayloadValidator(),
    ) {
    }

    /**
     * @return array{id: int, alert_id: null}
     */
    public function ingest(array $payload): array
    {
        $row = $this->validator->validate($payload);
        $id = $this->telemetryRepository->insert($row);

        // alert_id filled by detector in later tasks (T3.2)
        return ['id' => $id, 'alert_id' => null];
    }
}
