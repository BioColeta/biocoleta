<?php

declare(strict_types=1);

namespace BioColeta\Service;

use BioColeta\Repository\AlertRepository;
use BioColeta\Repository\DecisionRepository;
use DomainException;
use InvalidArgumentException;
use PDOException;

final class AlertService
{
    private const OUTCOMES = ['confirmado', 'falso_positivo'];
    private const STATUSES = ['new', 'investigating', 'resolved', 'false_positive'];

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

    /** @return list<array<string, mixed>> */
    public function listBoard(): array
    {
        return $this->alertRepository->listBoard();
    }

    public function move(int $alertId, string $status): void
    {
        if (!in_array($status, self::STATUSES, true)) {
            throw new InvalidArgumentException('Invalid alert status');
        }

        $alert = $this->alertRepository->findById($alertId);
        if ($alert === null) {
            throw new InvalidArgumentException('Alert not found');
        }

        if (in_array((string) $alert['status'], ['resolved', 'false_positive'], true)
            && $status !== $alert['status']) {
            throw new DomainException('Closed alert cannot be reopened');
        }

        $this->alertRepository->updateStatus($alertId, $status);
    }

    public function decide(int $alertId, string $outcome, int $userId): void
    {
        if (!in_array($outcome, self::OUTCOMES, true)) {
            throw new InvalidArgumentException('Invalid outcome');
        }

        $alert = $this->alertRepository->findById($alertId);
        if ($alert === null) {
            throw new InvalidArgumentException('Alert not found');
        }
        if (in_array($alert['status'], ['resolved', 'false_positive', 'cleared'], true)
            || $this->decisionRepository->existsForAlert($alertId)) {
            throw new DomainException('Alert already resolved');
        }

        $status = $outcome === 'falso_positivo' ? 'false_positive' : 'resolved';

        try {
            $this->alertRepository->updateStatus($alertId, $status);
            $this->decisionRepository->create($alertId, $userId, $outcome);
        } catch (PDOException $e) {
            if ((string) $e->getCode() === '23000') {
                throw new DomainException('Alert already resolved', 0, $e);
            }
            throw $e;
        }
    }
}
