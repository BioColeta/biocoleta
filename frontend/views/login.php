<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BioColeta — Entrar</title>
    <link rel="stylesheet" href="/assets/app.css?v=8">
</head>
<body class="page">
<main class="auth-shell">
    <a class="brand auth-brand" href="/">
        <span class="brand-mark">B</span>
        <span>BioColeta</span>
    </a>
    <section class="auth-card">
        <p class="eyebrow">Área do operador</p>
        <h1>Bem-vindo de volta</h1>
        <p class="muted">Acompanhe os sinais dos dispositivos e organize os próximos passos.</p>
        <?php if (!empty($error)): ?>
            <p class="error" role="alert"><?= htmlspecialchars((string) $error, ENT_QUOTES, 'UTF-8') ?></p>
        <?php endif; ?>
        <form method="post" action="/login">
            <label>Usuário
                <input type="text" name="username" required autocomplete="username">
            </label>
            <label>Senha
                <input type="password" name="password" required autocomplete="current-password">
            </label>
            <button class="button button--primary button--full" type="submit">Entrar no painel</button>
        </form>
        <a class="back-link" href="/">Voltar para o início</a>
    </section>
</main>
</body>
</html>
