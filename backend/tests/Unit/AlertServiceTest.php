<?php

declare(strict_types=1);

namespace BioColeta\Tests\Unit;

use BioColeta\Repository\AlertRepository;
use BioColeta\Repository\DecisionRepository;
use BioColeta\Service\AlertService;
use DomainException;
use PHPUnit\Framework\TestCase;

final class AlertServiceTest extends TestCase
{
    public function test_decide_resolves_pending_alert(): void
    {
        $alerts = $this->createMock(AlertRepository::class);
        $alerts->method('findById')->willReturn([
            'id' => 1,
            'status' => 'pending',
        ]);
        $alerts->expects(self::once())->method('markResolved')->with(1);

        $decisions = $this->createMock(DecisionRepository::class);
        $decisions->expects(self::once())->method('create')->with(1, 7, 'confirmado', 'ok')->willReturn(10);

        $service = new AlertService($alerts, $decisions);
        $service->decide(1, 'confirmado', 'ok', 7);
    }

    public function test_decide_rejects_already_resolved(): void
    {
        $alerts = $this->createMock(AlertRepository::class);
        $alerts->method('findById')->willReturn([
            'id' => 1,
            'status' => 'resolved',
        ]);
        $alerts->expects(self::never())->method('markResolved');

        $decisions = $this->createMock(DecisionRepository::class);
        $decisions->expects(self::never())->method('create');

        $service = new AlertService($alerts, $decisions);

        $this->expectException(DomainException::class);
        $service->decide(1, 'falso_positivo', null, 7);
    }
}
