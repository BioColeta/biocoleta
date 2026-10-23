# STATE

## Decisions

### AD-001
- **Decision**: IoT telemetry ingestion for MVP uses HTTP/REST only (`POST /api/telemetry`); MQTT is out of scope.
- **Reason**: KISS for MVP; vision doc allowed either protocol; team chose HTTP (option A).
- **Trade-off**: No MQTT demo path until a later feature.
- **Scope**: backend API, simulador, all telemetry-related stories
- **Date**: 2026-10-23
- **Status**: active

### AD-002
- **Decision**: Operator UI is PHP 8 server-rendered views served by the same backend app (not a SPA).
- **Reason**: Single deploy stack aligned with vision (PHP 8 OOP); team chose SSR (option A).
- **Trade-off**: No separate JS frontend toolchain in MVP.
- **Scope**: backend, frontend views/assets
- **Date**: 2026-10-23
- **Status**: active

### AD-003
- **Decision**: Anomaly classification in MVP is deterministic rule-based; no AI/LLM module, prompts, or AI scaffolding.
- **Reason**: YAGNI/KISS for MVP; success criterion 3 adapted to non-AI structured output.
- **Trade-off**: No probabilistic scoring or prompt versioning until a future feature.
- **Scope**: entire MVP feature `mvp-drain-monitoring`
- **Date**: 2026-10-23
- **Status**: active

### AD-004
- **Decision**: Persistence is MariaDB (relational) for telemetry, alerts, decisions, and operator users.
- **Reason**: Locked by project vision document.
- **Trade-off**: No document/time-series DB in MVP.
- **Scope**: database migrations, backend repositories
- **Date**: 2026-10-23
- **Status**: active

### AD-005
- **Decision**: Repository layout is `backend/`, `frontend/`, `database/`, `simulador/` at repo root; `frontend/` holds SSR views/assets consumed by `backend/`.
- **Reason**: Explicit package boundaries requested for MVP scaffolding.
- **Trade-off**: Views live outside `backend/` source tree (wiring via config path).
- **Scope**: all packages
- **Date**: 2026-10-23
- **Status**: active

## Handoff

- **Feature**: mvp-drain-monitoring (`.specs/features/mvp-drain-monitoring/`)
- **Phase / Task**: Plan scaffold complete; awaiting Execute (T0.1)
- **Completed**: spec, context, design, tasks, folder scaffold, GitHub issues #5–#11 (milestone MVP-demo)
- **In-progress**: none
- **Next step**: On explicit request, Execute Phase 0 — Composer + PHPUnit bootstrap (T0.1)
- **Blockers**: none
- **Uncommitted files**: `.specs/`, `backend/`, `frontend/`, `database/`, `simulador/`, README (simulador-iot removed)
- **Branch**: main (or current working branch)
