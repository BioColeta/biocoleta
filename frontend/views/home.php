<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BioColeta — Monitoramento preventivo</title>
    <link rel="stylesheet" href="/assets/app.css?v=14">
</head>
<body class="page">
<header class="topbar topbar--public">
    <a class="brand" href="/">
        <span class="brand-mark">B</span>
        <span>BioColeta</span>
    </a>
    <span class="topbar-tag">Monitoramento preventivo</span>
    <a class="linkish" href="/login">Acessar painel</a>
</header>

<main class="home-shell">
    <section class="hero">
        <div class="hero-copy">
            <p class="eyebrow">Drenagem urbana · operação em tempo real</p>
            <h1>Veja o risco antes que a água vire problema.</h1>
            <p class="hero-lead">
                O BioColeta recebe sinais dos dispositivos, identifica padrões de obstrução
                e ajuda a equipe a decidir o próximo passo com clareza.
            </p>
            <div class="hero-actions">
                <a class="button button--primary" href="/login">Abrir painel</a>
                <a class="button button--secondary" href="/simulador">Testar simulador</a>
            </div>
        </div>
        <div class="hero-visual" aria-label="Fluxo do BioColeta">
            <div class="signal-orb"><span></span></div>
            <div class="hero-status">
                <span class="status-dot status-dot--ok"></span>
                <span>Fluxo de monitoramento ativo</span>
            </div>
        </div>
    </section>

    <section class="home-section">
        <div class="section-heading">
            <p class="eyebrow">Como funciona</p>
            <h2>Do sinal à decisão em três passos</h2>
        </div>
        <div class="step-grid">
            <article class="step-card">
                <span class="step-number">01</span>
                <h3>O dispositivo envia</h3>
                <p>Nível da água e fluxo chegam continuamente por telemetria HTTP.</p>
            </article>
            <article class="step-card">
                <span class="step-number">02</span>
                <h3>O sistema identifica</h3>
                <p>Uma regra simples encontra duas leituras seguidas com sinais de obstrução.</p>
            </article>
            <article class="step-card">
                <span class="step-number">03</span>
                <h3>A equipe decide</h3>
                <p>O operador acompanha o alerta, move seu status e registra a decisão.</p>
            </article>
        </div>
    </section>

    <section class="home-cta">
        <div>
            <p class="eyebrow">Primeira vez aqui?</p>
            <h2>Comece pelo simulador.</h2>
            <p>Escolha um cenário, envie duas leituras e veja o alerta nascer no painel.</p>
        </div>
        <a class="button button--light" href="/simulador">Ir para o simulador</a>
    </section>
</main>
</body>
</html>
