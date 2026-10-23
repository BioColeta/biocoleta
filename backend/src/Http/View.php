<?php

declare(strict_types=1);

namespace BioColeta\Http;

final class View
{
    public static function render(string $viewsPath, string $template, array $data = []): void
    {
        extract($data, EXTR_SKIP);
        $file = rtrim($viewsPath, '/') . '/' . $template . '.php';
        if (!is_file($file)) {
            http_response_code(500);
            echo 'View not found';
            return;
        }
        require $file;
    }
}
