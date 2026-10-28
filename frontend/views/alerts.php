<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BioColeta — Painel operacional</title>
    <link rel="stylesheet" href="/assets/app.css?v=13">
</head>
<body class="page">
<header class="topbar">
    <a class="brand" href="/">
        <span class="brand-mark">B</span>
        <span>BioColeta</span>
    </a>
    <span class="muted">Operador: <?= htmlspecialchars((string) $username, ENT_QUOTES, 'UTF-8') ?></span>
    <span id="live-status" class="muted live-status" aria-live="polite">ao vivo</span>
    <form method="post" action="/logout"><button type="submit" class="linkish">Sair</button></form>
</header>
<main class="content">
    <div class="page-heading">
        <div>
            <p class="eyebrow">Central de operação</p>
            <h1>Bueiros monitorados</h1>
            <p class="muted">Veja onde há sinais de obstrução, abra o histórico do bueiro e registre a decisão.</p>
        </div>
        <a class="button button--secondary" href="/simulador">Abrir simulador</a>
    </div>
    <?php if (!empty($error)): ?>
        <p class="error"><?= htmlspecialchars((string) $error, ENT_QUOTES, 'UTF-8') ?></p>
    <?php endif; ?>

    <div id="alerts-root" data-initial='<?= htmlspecialchars(json_encode(['alerts' => $alerts], JSON_THROW_ON_ERROR | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP), ENT_QUOTES, 'UTF-8') ?>'></div>
</main>
<script src="/assets/alerts-live.js?v=13"></script>
</body>
</html>
