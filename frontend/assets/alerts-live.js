(function () {
  const root = document.getElementById('alerts-root');
  const statusEl = document.getElementById('live-status');
  if (!root) return;

  const statuses = {
    new: { label: 'Alerta ativo', tone: 'danger' },
    investigating: { label: 'Alerta ativo', tone: 'danger' },
    resolved: { label: 'Confirmado', tone: 'danger' },
    false_positive: { label: 'Falso positivo', tone: 'muted' },
    cleared: { label: 'Normalizado', tone: 'ok' },
  };
  const activeStatuses = ['new', 'investigating'];

  const conditions = {
    obstructed: { label: 'Obstruído', tone: 'danger' },
    clear: { label: 'Normal', tone: 'ok' },
  };

  function conditionFor(status) {
    return ['new', 'investigating', 'resolved'].includes(status) ? 'obstructed' : 'clear';
  }
  const fallbackBounds = {
    minLat: -23.5700,
    maxLat: -23.5555,
    minLng: -46.6630,
    maxLng: -46.6480,
  };

  let latestAlerts = [];
  let selectedDeviceId = null;
  let mounted = false;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatLevel(reading) {
    if (!reading || reading.water_level == null) return '—';
    return Number(reading.water_level).toFixed(1).replace('.', ',') + '%';
  }

  function formatFlow(reading) {
    if (!reading || reading.water_flow == null) return '—';
    return Number(reading.water_flow).toFixed(2).replace('.', ',') + ' L/s';
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function readingsFor(alert) {
    const readings = (alert.classification || {}).readings || [];
    return readings.slice(0, 2);
  }

  function isPlaceholder(alert) {
    return alert.id == null || alert.status === 'clear';
  }

  function statusFor(alert) {
    if (isPlaceholder(alert)) return 'clear';
    return statuses[alert.status] ? alert.status : 'new';
  }

  function isActive(alert) {
    return activeStatuses.includes(statusFor(alert));
  }

  function alertTimestamp(alert) {
    return Date.parse(String(alert.created_at || '').replace(' ', 'T')) || Number(alert.id) || 0;
  }

  function hasCoords(alert) {
    return typeof alert.latitude === 'number' && typeof alert.longitude === 'number'
      && !Number.isNaN(alert.latitude) && !Number.isNaN(alert.longitude);
  }

  function boundsFor(alerts) {
    const coords = alerts.filter(hasCoords);
    if (coords.length === 0) return fallbackBounds;
    const lats = coords.map((alert) => alert.latitude);
    const lngs = coords.map((alert) => alert.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latPad = Math.max((maxLat - minLat) * 0.18, 0.0008);
    const lngPad = Math.max((maxLng - minLng) * 0.18, 0.0008);
    return {
      minLat: minLat - latPad,
      maxLat: maxLat + latPad,
      minLng: minLng - lngPad,
      maxLng: maxLng + lngPad,
    };
  }

  function project(alert, bounds) {
    if (!hasCoords(alert)) return { x: 50, y: 50 };
    const latSpan = bounds.maxLat - bounds.minLat || 1;
    const lngSpan = bounds.maxLng - bounds.minLng || 1;
    const x = ((alert.longitude - bounds.minLng) / lngSpan) * 100;
    const y = ((bounds.maxLat - alert.latitude) / latSpan) * 100;
    return {
      x: Math.min(95, Math.max(5, x)),
      y: Math.min(92, Math.max(8, y)),
    };
  }

  function groupDevices(alerts) {
    const uniqueAlerts = new Map();
    alerts.forEach((alert) => {
      const key = isPlaceholder(alert) ? `device:${alert.device_id}` : `alert:${alert.id}`;
      if (!uniqueAlerts.has(key)) uniqueAlerts.set(key, { ...alert, status: statusFor(alert) });
    });

    const bounds = boundsFor(Array.from(uniqueAlerts.values()));
    const devices = new Map();
    Array.from(uniqueAlerts.values()).forEach((alert) => {
      const deviceId = alert.device_id || 'unknown';
      if (!devices.has(deviceId)) {
        devices.set(deviceId, {
          deviceId,
          entityId: alert.entity_id || deviceId,
          position: project(alert, bounds),
          hasCoords: hasCoords(alert),
          alerts: [],
        });
      }
      if (!isPlaceholder(alert)) devices.get(deviceId).alerts.push(alert);
    });

    return Array.from(devices.values()).map((device) => {
      const alertsByTime = device.alerts.slice().sort((a, b) => alertTimestamp(b) - alertTimestamp(a));
      const activeAlert = alertsByTime.find(isActive) || null;
      const currentAlert = activeAlert || alertsByTime[0] || null;
      return {
        ...device,
        alerts: alertsByTime,
        activeAlert,
        currentAlert,
        status: currentAlert ? statusFor(currentAlert) : 'clear',
      };
    }).sort((a, b) => {
      const aActive = a.activeAlert ? 1 : 0;
      const bActive = b.activeAlert ? 1 : 0;
      return bActive - aActive || alertTimestamp(b.currentAlert || {}) - alertTimestamp(a.currentAlert || {});
    });
  }

  function measurementHtml(reading, index) {
    return `
      <div class="measurement">
        <span class="measurement__title">${index === 0 ? '1ª medição' : '2ª medição'}</span>
        <div class="metrics-block">
          <div class="metric"><span class="metric__name">Nível</span><strong class="metric__value">${escapeHtml(formatLevel(reading))}</strong></div>
          <div class="metric"><span class="metric__name">Fluxo</span><strong class="metric__value">${escapeHtml(formatFlow(reading))}</strong></div>
        </div>
      </div>`;
  }

  function evidenceHtml(alert) {
    const readings = readingsFor(alert);
    if (readings.length === 0) return '<p class="empty empty--small">Sem medições detalhadas para este alerta.</p>';
    return `<div class="measurements-block">${readings.map(measurementHtml).join('')}</div>`;
  }

  function stateNoticeHtml(alert) {
    if (!alert || isActive(alert)) return '';
    const notices = {
      resolved: 'Obstrução confirmada · aguardando a telemetria normalizar.',
      cleared: 'Telemetria normalizada automaticamente.',
      false_positive: 'Descartado como falso positivo.',
    };
    const text = notices[statusFor(alert)];
    return text ? `<p class="card-help">${escapeHtml(text)}</p>` : '';
  }

  function decisionActionsHtml(alert) {
    if (!alert || !isActive(alert)) return '';
    const id = escapeHtml(alert.id);

    return `
      <div class="drain-actions">
        <form method="post" action="/alerts/${id}/decision">
          <button type="submit" name="outcome" value="confirmado" class="btn btn--confirm">Confirmar obstrução</button>
        </form>
        <form method="post" action="/alerts/${id}/decision">
          <button type="submit" name="outcome" value="falso_positivo" class="btn btn--danger">Falso positivo</button>
        </form>
      </div>`;
  }

  function historyHtml(device) {
    if (!device || device.alerts.length === 0) return '<p class="empty empty--small">Nenhum histórico para este bueiro.</p>';
    return `
      <ol class="history-list">
        ${device.alerts.map((alert) => {
          const status = statuses[statusFor(alert)];
          const readings = readingsFor(alert);
          const lastReading = readings[readings.length - 1] || null;
          return `
            <li class="history-item">
              <span class="status-chip status-chip--${status.tone}">${escapeHtml(status.label)}</span>
              <strong>${escapeHtml(formatDate(alert.created_at))}</strong>
              <span>Nível ${escapeHtml(formatLevel(lastReading))} · Fluxo ${escapeHtml(formatFlow(lastReading))}</span>
            </li>`;
        }).join('')}
      </ol>`;
  }

  function panelHtml(device) {
    if (!device) {
      return `
        <p class="eyebrow">Detalhes</p>
        <h2>Selecione um bueiro</h2>
        <p class="muted">Clique em um ponto do mapa para ver medições, histórico e registrar a decisão.</p>`;
    }

    const condition = conditions[conditionFor(device.status)];
    return `
      <div class="drain-panel__head">
        <div>
          <p class="eyebrow">Bueiro</p>
          <h2>${escapeHtml(device.entityId)}</h2>
          <p class="muted">${escapeHtml(device.deviceId)}</p>
        </div>
        <span class="status-chip status-chip--${condition.tone}">${escapeHtml(condition.label)}</span>
      </div>
      ${device.currentAlert ? `
        <section>
          <h3>Evidência do alerta</h3>
          ${evidenceHtml(device.currentAlert)}
          ${stateNoticeHtml(device.currentAlert)}
          ${decisionActionsHtml(device.currentAlert)}
        </section>` : `
        <section>
          <p class="empty empty--small">Sem obstrução detectada neste bueiro.</p>
        </section>`}
      <section>
        <h3>Histórico recente</h3>
        ${historyHtml(device)}
      </section>`;
  }

  function summaryHtml(devices) {
    const obstructedCount = devices.filter((device) => conditionFor(device.status) === 'obstructed').length;
    const clearCount = devices.length - obstructedCount;
    return `
      <div><strong>${obstructedCount}</strong><span>obstruídos</span></div>
      <div><strong>${clearCount}</strong><span>normais</span></div>
      <div><strong>${devices.length}</strong><span>monitorados</span></div>`;
  }

  function markerHtml(device) {
    const condition = conditions[conditionFor(device.status)];
    return `
      <button
        type="button"
        class="drain-marker drain-marker--${condition.tone}${device.deviceId === selectedDeviceId ? ' is-selected' : ''}"
        style="left: ${device.position.x}%; top: ${device.position.y}%;"
        data-device-id="${escapeHtml(device.deviceId)}"
        aria-pressed="${device.deviceId === selectedDeviceId}"
        aria-label="Bueiro ${escapeHtml(device.entityId)} — ${escapeHtml(condition.label)}">
        <span class="drain-marker__pulse"></span>
        <span class="drain-marker__dot"></span>
        <span class="drain-marker__tag">${escapeHtml(device.entityId)}</span>
      </button>`;
  }

  function mount() {
    root.innerHTML = `
      <div class="operations-shell">
        <section class="drain-map-card">
          <div class="drain-map-card__head">
            <div>
              <p class="eyebrow">Mapa operacional</p>
              <h2>Bueiros monitorados</h2>
            </div>
            <div class="map-summary" aria-label="Resumo dos bueiros" data-slot="summary"></div>
          </div>
          <div class="drain-map" role="group" aria-label="Mapa esquemático com bueiros monitorados" data-slot="map"></div>
          <div class="map-legend">
            <span><i class="legend-dot legend-dot--danger"></i>Obstruído</span>
            <span><i class="legend-dot legend-dot--ok"></i>Normal</span>
          </div>
        </section>
        <aside class="drain-panel" data-slot="panel"></aside>
      </div>`;
    mounted = true;
  }

  function updateSelectionClasses() {
    root.querySelectorAll('[data-device-id]').forEach((marker) => {
      const isSelected = marker.dataset.deviceId === selectedDeviceId;
      marker.classList.toggle('is-selected', isSelected);
      marker.setAttribute('aria-pressed', String(isSelected));
    });
  }

  function renderPanel(devices) {
    const panel = root.querySelector('[data-slot="panel"]');
    if (!panel) return;
    const selectedDevice = devices.find((device) => device.deviceId === selectedDeviceId) || null;
    panel.innerHTML = panelHtml(selectedDevice);
  }

  function render() {
    if (!mounted) mount();
    const devices = groupDevices(latestAlerts);

    if (!selectedDeviceId || !devices.some((device) => device.deviceId === selectedDeviceId)) {
      selectedDeviceId = (devices.find((device) => device.activeAlert) || devices[0] || {}).deviceId || null;
    }

    const summarySlot = root.querySelector('[data-slot="summary"]');
    if (summarySlot) summarySlot.innerHTML = summaryHtml(devices);

    const mapSlot = root.querySelector('[data-slot="map"]');
    if (mapSlot) {
      mapSlot.innerHTML = `
        <span class="map-blocks"></span>
        <span class="map-park"></span>
        <span class="map-river"></span>
        <span class="map-avenue map-avenue--h"></span>
        <span class="map-avenue map-avenue--v"></span>
        ${devices.map(markerHtml).join('')}`;
      bindMarkers(devices);
    }

    renderPanel(devices);
  }

  function selectDevice(deviceId, devices) {
    selectedDeviceId = deviceId;
    updateSelectionClasses();
    renderPanel(devices);
  }

  function bindMarkers(devices) {
    root.querySelectorAll('[data-device-id]').forEach((marker) => {
      marker.addEventListener('click', () => selectDevice(marker.dataset.deviceId, devices));
    });
  }

  async function refresh() {
    try {
      const response = await fetch('/api/alerts', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
      if (response.status === 401) { window.location.href = '/login'; return; }
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      latestAlerts = data.alerts || [];
      render();
      if (statusEl) statusEl.textContent = 'ao vivo · ' + new Date().toLocaleTimeString();
    } catch (error) {
      if (statusEl) statusEl.textContent = 'offline · tentando...';
    }
  }

  try {
    const initial = JSON.parse(root.dataset.initial || '{"alerts":[]}');
    latestAlerts = initial.alerts || [];
  } catch (error) {
    latestAlerts = [];
  }
  render();
  setInterval(refresh, 4000);
  refresh();
})();
