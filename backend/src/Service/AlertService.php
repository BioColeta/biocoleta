<?php

declare(strict_types=1);

namespace BioColeta\Service;

use BioColeta\Repository\AlertRepository;
use BioColeta\Repository\DecisionRepository;
use DomainException;
use InvalidArgumentException;

final class AlertService
{
    private const OUTCOMES = ['confirmado', 'falso_positivo'];

    public function __construct(
        private readonly AlertRepository $alertRepository,
        private readonly DecisionRepository $decisionRepository,
    ) {
    }

    /** @return list<array<string, mixed>> */
    public function listPending(): array
    {
        return $this->alertRepository->listPending();
    }

    public function decide(int $alertId, string $outcome, ?string $note, int $userId): void
    {
        if (!in_array($outcome, self::OUTCOMES, true)) {
            throw new InvalidArgumentException('Invalid outcome');
        }

        $alert = $this->alertRepository->findById($alertId);
        if ($alert === null) {
            throw new InvalidArgumentException('Alert not found');
        }
        if ($alert['status'] !== 'pending') {
            throw new DomainException('Alert already resolved');
        }

        $this->decisionRepository->create($alertId, $userId, $outcome, $note);
        $this->alertRepository->markResolved($alertId);
    }
}
