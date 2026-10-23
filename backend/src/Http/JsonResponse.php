<?php

declare(strict_types=1);

namespace BioColeta\Http;

final class JsonResponse
{
    public static function send(int $status, array $body): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, X-Device-Key');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        echo json_encode($body, JSON_THROW_ON_ERROR);
    }
}

