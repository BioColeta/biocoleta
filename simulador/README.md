# Simulador IoT

HTML bench that posts telemetry to the backend over HTTP/REST every 10 seconds.

1. Start MariaDB and the PHP server (`php -S 127.0.0.1:8080 -t backend/public` from repo root, with env `DEVICE_KEY=demo-device-key`).
2. Open `simulador-v1.html` in a browser.
3. Confirm base URL and device key match the backend.
4. Use **Obstrução (Alerta)** then wait for a second post (or click Transmitir again) to trip the detector.
