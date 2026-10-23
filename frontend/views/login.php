<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BioColeta — Login</title>
    <link rel="stylesheet" href="/assets/app.css">
</head>
<body class="page">
<main class="card">
    <h1>BioColeta</h1>
    <p class="muted">Acesso do Operador</p>
    <?php if (!empty($error)): ?>
        <p class="error"><?= htmlspecialchars((string) $error, ENT_QUOTES, 'UTF-8') ?></p>
    <?php endif; ?>
    <form method="post" action="/login">
        <label>Usuário
            <input type="text" name="username" required autocomplete="username">
        </label>
        <label>Senha
            <input type="password" name="password" required autocomplete="current-password">
        </label>
        <button type="submit">Entrar</button>
    </form>
</main>
</body>
</html>
