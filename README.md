# BioColeta

Preventive urban drainage monitoring MVP (IoT telemetry → deterministic alerts → operator decisions).

## Packages

| Path | Role |
| ---- | ---- |
| `backend/` | PHP 8 OOP API + app core |
| `frontend/` | SSR views and assets |
| `database/` | MariaDB migrations |
| `simulador/` | HTML IoT bench (HTTP) |
| `docs/` | Vision and docs |
| `.specs/` | Spec-driven development artifacts |

## Specs

MVP feature: [`.specs/features/mvp-drain-monitoring/`](.specs/features/mvp-drain-monitoring/)

## Local demo

```bash
# MariaDB (example)
docker run -d --name biocoleta-mariadb \
  -e MARIADB_ROOT_PASSWORD=demo_root \
  -e MARIADB_DATABASE=biocoleta \
  -e MARIADB_USER=biocoleta \
  -e MARIADB_PASSWORD=demo_db \
  -p 3307:3306 mariadb:11.4

docker exec -i biocoleta-mariadb mariadb -ubiocoleta -pdemo_db biocoleta < database/migrations/001_init.sql
docker exec -i biocoleta-mariadb mariadb -ubiocoleta -pdemo_db biocoleta < database/migrations/002_seed_demo.sql

cd backend && composer install
export DEVICE_KEY=demo-device-key
export DB_DSN='mysql:host=127.0.0.1;port=3307;dbname=biocoleta;charset=utf8mb4'
export DB_USER=biocoleta
export DB_PASSWORD=demo_db
php -S 127.0.0.1:8080 -t public
```

- Operator UI: http://127.0.0.1:8080/login — user `operator` / `demo_operator`
- Simulator: open `simulador/simulador-v1.html` (base URL `http://127.0.0.1:8080`, key `demo-device-key`)

```bash
cd backend && ./vendor/bin/phpunit
```
