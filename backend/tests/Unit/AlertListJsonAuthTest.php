<?php

declare(strict_types=1);

namespace BioColeta\Tests\Unit;

use BioColeta\Http\AlertController;
use BioColeta\Repository\AlertRepository;
use BioColeta\Repository\DecisionRepository;
use BioColeta\Service\AlertService;
use PHPUnit\Framework\TestCase;

final class AlertListJsonAuthTest extends TestCase
{
    public function test_list_json_rejects_unauthenticated(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION = [];
        } else {
            $_SESSION = [];
        }
        unset($_SESSION['user_id']);

        $alerts = $this->createMock(AlertRepository::class);
        $alerts->expects(self::never())->method('listPending');
        $controller = new AlertController(
            new AlertService($alerts, $this->createMock(DecisionRepository::class)),
            sys_get_temp_dir(),
        );

        ob_start();
        $controller->listJson();
        $output = ob_get_clean();

        self::assertSame(401, http_response_code());
        self::assertStringContainsString('unauthorized', (string) $output);
    }

    public function test_move_rejects_unauthenticated(): void
    {
        $_SESSION = [];
        unset($_SESSION['user_id']);

        $alerts = $this->createMock(AlertRepository::class);
        $alerts->expects(self::never())->method('findById');
        $controller = new AlertController(
            new AlertService($alerts, $this->createMock(DecisionRepository::class)),
            sys_get_temp_dir(),
        );

        ob_start();
        $controller->move(1);
        $output = ob_get_clean();

        self::assertSame(401, http_response_code());
        self::assertStringContainsString('unauthorized', (string) $output);
    }
}
