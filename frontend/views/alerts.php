<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BioColeta — Alertas</title>
    <link rel="stylesheet" href="/assets/app.css">
</head>
<body class="page">
<header class="topbar">
    <strong>BioColeta</strong>
    <span class="muted">Operador: <?= htmlspecialchars((string) $username, ENT_QUOTES, 'UTF-8') ?></span>
    <form method="post" action="/logout"><button type="submit" class="linkish">Sair</button></form>
</header>
<main class="content">
    <h1>Alertas pendentes</h1>
    <?php if (!empty($error)): ?>
        <p class="error"><?= htmlspecialchars((string) $error, ENT_QUOTES, 'UTF-8') ?></p>
    <?php endif; ?>

    <?php if ($alerts === []): ?>
        <p class="empty">Nenhum alerta pendente.</p>
    <?php else: ?>
        <ul class="alert-list">
            <?php foreach ($alerts as $alert): ?>
                <li class="alert-item">
                    <div>
                        <strong><?= htmlspecialchars((string) $alert['device_id'], ENT_QUOTES, 'UTF-8') ?></strong>
                        <span class="muted">#<?= (int) $alert['id'] ?> · <?= htmlspecialchars((string) $alert['created_at'], ENT_QUOTES, 'UTF-8') ?></span>
                    </div>
                    <p class="summary">
                        Regra: <?= htmlspecialchars((string) ($alert['classification']['rule_id'] ?? $alert['rule_id']), ENT_QUOTES, 'UTF-8') ?>
                        · IDs telemetria:
                        <?= htmlspecialchars(implode(', ', $alert['classification']['telemetry_ids'] ?? []), ENT_QUOTES, 'UTF-8') ?>
                    </p>
                    <form method="post" action="/alerts/<?= (int) $alert['id'] ?>/decision" class="decision-form">
                        <label>Decisão
                            <select name="outcome" required>
                                <option value="confirmado">confirmado</option>
                                <option value="falso_positivo">falso_positivo</option>
                            </select>
                        </label>
                        <label>Nota
                            <input type="text" name="note" maxlength="255" placeholder="opcional">
                        </label>
                        <button type="submit">Registrar</button>
                    </form>
                </li>
            <?php endforeach; ?>
        </ul>
    <?php endif; ?>
</main>
</body>
</html>
