# BioColeta

Preventive urban drainage monitoring MVP.

IoT telemetry → deterministic obstruction detection → operator map → human decision → auto-clear when readings normalize.

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

## Prerequisites

- Docker (or Colima on macOS)
- PHP 8.2+
- Composer
- `curl` (optional, for smoke checks)

On macOS with Colima:

```bash
colima start
```

## Tutorial: run the MVP locally

### 1. Start MariaDB

```bash
docker run -d --name biocoleta-mariadb \
  -e MARIADB_ROOT_PASSWORD=demo_root \
  -e MARIADB_DATABASE=biocoleta \
  -e MARIADB_USER=biocoleta \
  -e MARIADB_PASSWORD=demo_db \
  -p 3307:3306 mariadb:11.4
```

Wait until the database accepts connections:

```bash
until docker exec biocoleta-mariadb mariadb -ubiocoleta -pdemo_db biocoleta -e 'SELECT 1' >/dev/null 2>&1; do
  sleep 1
done
echo "MariaDB ready"
```

If the container already exists from a previous run:

```bash
docker start biocoleta-mariadb
```

### 2. Apply migrations

Fresh database (recommended order):

```bash
docker exec -i biocoleta-mariadb mariadb -ubiocoleta -pdemo_db biocoleta < database/migrations/001_init.sql
docker exec -i biocoleta-mariadb mariadb -ubiocoleta -pdemo_db biocoleta < database/migrations/002_seed_demo.sql
```

`001_init.sql` and `002_seed_demo.sql` already include the final MVP schema (workflow statuses, coordinates, and demo drains).

If you are upgrading an older local database that was created before those columns existed, also apply:

```bash
docker exec -i biocoleta-mariadb mariadb -ubiocoleta -pdemo_db biocoleta < database/migrations/003_alert_workflow.sql
docker exec -i biocoleta-mariadb mariadb -ubiocoleta -pdemo_db biocoleta < database/migrations/004_false_positive_status.sql
docker exec -i biocoleta-mariadb mariadb -ubiocoleta -pdemo_db biocoleta < database/migrations/005_device_coordinates.sql
docker exec -i biocoleta-mariadb mariadb -ubiocoleta -pdemo_db biocoleta < database/migrations/006_cleared_status.sql
```

### 3. Install backend dependencies

```bash
cd backend
composer install
```

### 4. Start the PHP server

From `backend/`:

```bash
export DEVICE_KEY=demo-device-key
export DB_DSN='mysql:host=127.0.0.1;port=3307;dbname=biocoleta;charset=utf8mb4'
export DB_USER=biocoleta
export DB_PASSWORD=demo_db
php -S 127.0.0.1:8080 -t public
```

Leave this terminal open while using the app.

### 5. Open the app

| Surface | URL | Notes |
| ------- | --- | ----- |
| Hub | http://127.0.0.1:8080/ | Public entry page |
| Operator login | http://127.0.0.1:8080/login | user `operator` / password `demo_operator` |
| Operator map | http://127.0.0.1:8080/alerts | Requires login |
| Simulator | http://127.0.0.1:8080/simulador | Base URL `http://127.0.0.1:8080`, device key `demo-device-key` |

## Demo flow

1. Open the hub and choose **Testar simulador**.
2. Keep automatic sends active, or use **Pausar envios automáticos** while adjusting values.
3. Select **Obstrução** and use **Enviar agora** (or wait for automatic sends) until at least two anomalous readings are posted.
4. Open the operator panel (`/alerts`). The drain appears on the map as **Obstruído**.
5. Select the drain marker to inspect the two readings and recent history.
6. Choose one action:
   - **Confirmar obstrução** → drain stays red (confirmed), no longer asks for a decision.
   - **Falso positivo** → drain goes back to **Normal**.
7. After confirmation, send a **Normal** reading from the simulator. The drain auto-clears to green when telemetry leaves the obstruction rule.

### Detection rule

An alert is created when two consecutive readings for the same `device_id` satisfy:

- `water_level >= 75`
- `water_flow <= 0.05`

A drain auto-clears when a new reading has `water_level < 75` **or** `water_flow > 0.05`.

## Stop the stack

```bash
# stop PHP (Ctrl+C in the server terminal, or:)
lsof -ti :8080 | xargs kill

# stop MariaDB (keeps data)
docker stop biocoleta-mariadb
```

On macOS, if you also want to stop Colima:

```bash
colima stop
```

## Restart later

```bash
colima start   # macOS / Colima only
docker start biocoleta-mariadb

cd backend
export DEVICE_KEY=demo-device-key
export DB_DSN='mysql:host=127.0.0.1;port=3307;dbname=biocoleta;charset=utf8mb4'
export DB_USER=biocoleta
export DB_PASSWORD=demo_db
php -S 127.0.0.1:8080 -t public
```

## Tests

```bash
cd backend
./vendor/bin/phpunit
```

Unit suite only:

```bash
cd backend
./vendor/bin/phpunit --testsuite Unit
```

## Operator model (MVP)

- Map shows monitored drains with two visual states: **Obstruído** / **Normal**.
- Operator actions: `Confirmar obstrução` and `Falso positivo` only.
- Confirmed drains stay obstructed until telemetry normalizes (`cleared`).
- Device coordinates in `devices` drive marker positions on the schematic city map.
