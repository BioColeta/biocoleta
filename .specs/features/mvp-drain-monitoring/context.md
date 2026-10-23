# MVP Drain Monitoring Context

**Gathered:** 2026-10-23
**Spec:** `.specs/features/mvp-drain-monitoring/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Deliver the MVP demo loop: HTTP telemetry ingest → deterministic obstruction detection → Operator SSR panel → human decision record. No AI, no MQTT, no map, no work-order dispatch.

---

## Implementation Decisions

### Protocol & ingest

- HTTP/REST only: `POST /api/telemetry`
- Reuse JSON contract from existing simulador (`city_id`, `sector`, `entity_type`, `entity_id`, `device_id`, `timestamp`, `readings[]`, `quality`, `tamper_alert`)
- Device authentication via `X-Device-Key`

### Operator UI

- PHP 8 OOP backend with server-rendered views (not SPA)
- Views/assets live under repo `frontend/`, served by `backend/`
- Simple session login; one seeded operator user for demo

### Detection (non-AI)

- Rule: `water_level >= 75` AND `water_flow <= 0.05` on two consecutive readings per `device_id`
- Structured alert payload includes rule id, thresholds, and contributing reading ids
- No `ai/` package, stubs, or prompt tables

### Decision recording

- Outcomes: `confirmado` | `falso_positivo`
- Optional short free-text note
- Alert moves `pending` → `resolved`; audit who/when

### Agent's Discretion

- Exact PHP router/framework (plain front controller vs micro-framework) — prefer minimal plain PHP 8 OOP unless team later standardizes
- Template engine (plain PHP views vs Twig) — default plain PHP views for KISS
- Exact table/column naming — follow design.md

### Declined / Undiscussed Gray Areas → Assumptions

- Idempotency keys on telemetry: not in MVP (logged in spec edge cases)
- Rate limiting: not in MVP
- Multi-device fleet UI: single demo device sufficient

---

## Specific References

- Vision: `docs/BioColeta.md`
- Existing bench UI: `simulador-iot/simulador-v1.html` (to be moved/evolved under `simulador/`)
- Inline rule already documented in simulador comments/logs

---

## Deferred Ideas

- MQTT path (UI toggle in current simulador)
- AI classifier consuming short history windows
- Map highlighting obstruction points
- Work-order / crew dispatch after confirmation
- Prompt versioning in DB (vision NFR — postponed with AI)
