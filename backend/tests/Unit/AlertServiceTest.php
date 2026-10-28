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
            'status' => 'new',
        ]);
        $alerts->expects(self::once())->method('updateStatus')->with(1, 'resolved')->willReturn(true);

        $decisions = $this->createMock(DecisionRepository::class);
        $decisions->method('existsForAlert')->with(1)->willReturn(false);
        $decisions->expects(self::once())->method('create')->with(1, 7, 'confirmado')->willReturn(10);

        $service = new AlertService($alerts, $decisions);
        $service->decide(1, 'confirmado', 7);
    }

    public function test_decide_rejects_already_resolved(): void
    {
        $alerts = $this->createMock(AlertRepository::class);
        $alerts->method('findById')->willReturn([
            'id' => 1,
            'status' => 'resolved',
        ]);
        $alerts->expects(self::never())->method('updateStatus');

        $decisions = $this->createMock(DecisionRepository::class);
        $decisions->expects(self::never())->method('create');

        $service = new AlertService($alerts, $decisions);

        $this->expectException(DomainException::class);
        $service->decide(1, 'falso_positivo', 7);
    }

    public function test_decide_rejects_when_decision_already_exists(): void
    {
        $alerts = $this->createMock(AlertRepository::class);
        $alerts->method('findById')->willReturn([
            'id' => 1,
            'status' => 'new',
        ]);
        $alerts->expects(self::never())->method('updateStatus');

        $decisions = $this->createMock(DecisionRepository::class);
        $decisions->method('existsForAlert')->with(1)->willReturn(true);
        $decisions->expects(self::never())->method('create');

        $service = new AlertService($alerts, $decisions);

        $this->expectException(DomainException::class);
        $service->decide(1, 'confirmado', 7);
    }

    public function test_decide_moves_false_positive_to_final_status(): void
    {
        $alerts = $this->createMock(AlertRepository::class);
        $alerts->method('findById')->willReturn([
            'id' => 1,
            'status' => 'new',
        ]);
        $alerts->expects(self::once())
            ->method('updateStatus')
            ->with(1, 'false_positive')
            ->willReturn(true);

        $decisions = $this->createMock(DecisionRepository::class);
        $decisions->method('existsForAlert')->with(1)->willReturn(false);
        $decisions->expects(self::once())->method('create')->with(1, 7, 'falso_positivo')->willReturn(10);

        $service = new AlertService($alerts, $decisions);
        $service->decide(1, 'falso_positivo', 7);
    }

    public function test_move_updates_alert_status(): void
    {
        $alerts = $this->createMock(AlertRepository::class);
        $alerts->method('findById')->willReturn([
            'id' => 1,
            'status' => 'new',
        ]);
        $alerts->expects(self::once())
            ->method('updateStatus')
            ->with(1, 'investigating')
            ->willReturn(true);

        $service = new AlertService($alerts, $this->createMock(DecisionRepository::class));

        $service->move(1, 'investigating');
    }

    public function test_move_rejects_reopening_resolved_alert(): void
    {
        $alerts = $this->createMock(AlertRepository::class);
        $alerts->method('findById')->willReturn([
            'id' => 1,
            'status' => 'resolved',
        ]);
        $alerts->expects(self::never())->method('updateStatus');

        $service = new AlertService($alerts, $this->createMock(DecisionRepository::class));

        $this->expectException(DomainException::class);
        $service->move(1, 'investigating');
    }
}
