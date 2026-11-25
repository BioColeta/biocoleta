# BioColeta

Preventive urban drainage monitoring: telemetry, obstruction detection, assisted analysis, human
decision, service orders and rain planning in a single web app.

> **Everything here is simulated.** Drains, sensors, telemetry, authentication and the "AI" analysis
> run inside your browser. Only the drain elevations come from real terrain data. This is an
> academic project and it does not predict real floods.

## Run

Requires Node 24 or newer (see `.nvmrc`).

```bash
npm install
npm run dev
```

Open http://localhost:5173 and choose "Entrar como operador de demonstração".

| Command           | What it does                                      |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Development server                                |
| `npm run build`   | Type check and production build                   |
| `npm run lint`    | ESLint and Prettier check                         |
| `npm run test`    | Unit and component tests (Vitest)                 |
| `npm run e2e`     | Browser tests (Playwright, uses your Chrome)      |
| `npm run terrain` | Resample drain elevations and rebuild the network |

## Demo script

1. Sign in and keep the dashboard open.
2. Open **Simulador** in another tab and press **Iniciar roteiro**.
3. Obstruct the drain. Two readings later the panel announces the alert.
4. Open the alert, request the analysis and confirm the obstruction.
5. Create a service order and move it to done. Telemetry normalizes and closes the alert.
6. Open **Planejamento de chuva**, choose a storm and review the cleaning ranking.

Use **Tempestade** for a busy network and **Restaurar dados** to start over.

## Architecture

```
screens (src/features)  ->  query hooks (src/api)  ->  HTTP /api/*
                                                        |
                            MSW service worker (src/mocks/handlers.ts)
                                                        |
                       services  ->  pure rules (src/domain)  ->  localStorage
                                                        ^
                              simulation engine (src/mocks/engine)
```

- Screens only talk to `src/api`. To plug a real backend, implement the same endpoints, set
  `VITE_API_URL` and remove the mock startup in `src/main.tsx`.
- Detection rule: level of at least 75% and flow up to 0.05 L/s on two consecutive readings.
- A person decides every alert and approves every service order. The analysis only informs.

## Limitations of the mock

- Data stays in one browser. Tabs sync with each other; different devices do not.
- The engine runs in one visible tab at a time and stops when every tab is hidden.
- Authentication is not real security. Never reuse it with real data.
- The base map and the 3D relief need internet. Markers and calculations keep working without it.
- Rain planning uses a simplified rational method: no travel time, variable infiltration or pipe
  hydraulics. Catchment areas, capacities and obstruction losses are made up.

## Deploy

Pushes to `main` publish to GitHub Pages after all checks pass. A repository administrator has to
enable it once: **Settings > Pages > Source: GitHub Actions**.

## Terrain data

Drain elevations are sampled once by `npm run terrain` and committed. The 3D relief and the
elevations come from [Terrain Tiles on AWS](https://registry.opendata.aws/terrain-tiles)
([attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)): SRTM and
GMTED2010 terrain data courtesy of the U.S. Geological Survey; global ETOPO1 terrain data from the
U.S. National Oceanic and Atmospheric Administration. Base map by
[OpenFreeMap](https://openfreemap.org) with OpenStreetMap data.

## Previous version

The PHP 8 + MariaDB MVP (`backend/`, `frontend/`, `database/`, `simulador/`) is still in the tree
until its removal is approved, and is preserved by the `v1-php-mvp` tag.
