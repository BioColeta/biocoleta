<?php

declare(strict_types=1);

namespace BioColeta\Http;

final class JsonResponse
{
    public static function send(int $status, array $body): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($body, JSON_THROW_ON_ERROR);
    }
}
