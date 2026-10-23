<?php

declare(strict_types=1);

namespace BioColeta\Tests\Unit;

use BioColeta\Http\TelemetryController;
use BioColeta\Repository\TelemetryRepository;
use BioColeta\Service\TelemetryService;
use PDO;
use PHPUnit\Framework\TestCase;

final class TelemetryControllerAuthTest extends TestCase
{
    public function test_missing_device_key_returns_unauthorized_without_persist(): void
    {
        $pdo = $this->createMock(PDO::class);
        $pdo->expects(self::never())->method('prepare');

        $controller = new TelemetryController(
            new TelemetryService(new TelemetryRepository($pdo)),
            'expected-device-key',
        );

        $_SERVER['HTTP_X_DEVICE_KEY'] = '';
        ob_start();
        $controller->create();
        $output = ob_get_clean();

        self::assertSame(401, http_response_code());
        self::assertStringContainsString('unauthorized', (string) $output);
    }
}
