# MVP Drain Monitoring Specification

## Problem Statement

Urban drainage failures are often noticed only after flooding. BioColeta needs a minimal end-to-end loop: a simulated drain device sends continuous telemetry, the system detects a known obstruction pattern without AI, and an Operator sees the alert and records a human decision.

## Goals

- [ ] Simulated IoT device continuously posts normal telemetry over HTTP
- [ ] Simulated anomaly (high level + near-zero flow) is ingested and persisted
- [ ] Deterministic detector correctly flags the anomaly and stores structured output
- [ ] Operator panel shows the alert and accepts a recorded decision

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| AI / LLM classification, prompts, prompt versioning | YAGNI for MVP (AD-003) |
| MQTT / broker | HTTP-only (AD-001) |
| Geographic map of drains | Not required for demo loop |
| Work orders / crew dispatch | Human decision record only |
| Multi-tenant / multi-city ops beyond payload fields | Single demo city/device |
| OAuth / advanced RBAC | Simple session + device key |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Anomaly rule | `water_level >= 75` AND `water_flow <= 0.05` on **2 consecutive** readings for same `device_id` | Matches existing simulador UI/log | y (plan default) |
| Operator auth | PHP session; one seeded user | MVP demo | y (plan default) |
| Device auth | Header `X-Device-Key` required on telemetry POST | Prevents open ingest | y (plan default) |
| Decision values | `confirmado` \| `falso_positivo` | Human-in-the-loop without OS | y (plan default) |
| Telemetry payload shape | Contract already in `simulador-v1.html` (city_id, device_id, readings[], …) | Reuse existing contract | y |
| Test stack | PHPUnit for domain/unit; manual/scripted HTTP for ingest demo until CI exists | Greenfield repo | n — confirm at Execute |

**Open questions:** none blocking Specify — test runner confirmation deferred to Execute kickoff.

---

## User Stories

### P1: Telemetry ingestion ⭐ MVP

**User Story**: As a Dispositivo (simulador), I want to POST JSON telemetry so that the system persists level and flow readings.

**Why P1**: Without ingest, no detection or alerts.

**Acceptance Criteria**:

1. WHEN a valid telemetry JSON is POSTed to `/api/telemetry` with a valid `X-Device-Key` THEN the system SHALL persist the reading and respond `201` with a structured body including telemetry id
2. WHEN the payload is missing required fields or readings THEN the system SHALL respond `400` without persisting
3. WHEN `X-Device-Key` is missing or invalid THEN the system SHALL respond `401` without persisting

**Independent Test**: POST a sample payload with curl and verify a row in `telemetry` (or equivalent).

---

### P1: Deterministic anomaly detection ⭐ MVP

**User Story**: As the system, I want to evaluate consecutive readings with a fixed rule so that obstruction suspects become structured alerts without AI.

**Why P1**: Replaces vision success criterion 3 for MVP.

**Acceptance Criteria**:

1. WHEN two consecutive persisted readings for the same `device_id` both satisfy `water_level >= 75` AND `water_flow <= 0.05` THEN the system SHALL create an alert with status `new` and a structured classification payload (rule id, thresholds, reading ids)
2. WHEN readings are normal (outside the rule) THEN the system SHALL NOT create an alert
3. WHEN an alert already exists for the same device from the same consecutive pair THEN the system SHALL NOT create a duplicate alert for that pair

**Independent Test**: Insert/post two anomalous readings; assert one alert with structured fields; post normal readings; assert no new alert.

---

### P1: Operator alert panel ⭐ MVP

**User Story**: As an Operador, I want to see monitored drains on a simple map so that I know which location needs attention.

**Why P1**: Success criterion 4 (visibility).

**Acceptance Criteria**:

1. WHEN an authenticated Operador opens the alerts page THEN the system SHALL show one marker per monitored drain with status color, device id, timestamps, and classification summary
2. WHEN a user selects a drain marker THEN the system SHALL show the alert evidence and recent history for that drain
3. WHEN an unauthenticated user requests the alerts page THEN the system SHALL redirect to login

**Independent Test**: Seed a pending alert; log in; verify it appears on the panel.

---

### P1: Operator decision record ⭐ MVP

**User Story**: As an Operador, I want to register my decision on an alert so that human oversight is auditable.

**Why P1**: Success criterion 4 (decision); business rule — no autonomous critical action.

**Acceptance Criteria**:

1. WHEN an Operador submits decision `confirmado` on an active alert THEN the system SHALL persist the decision, set alert status to `resolved`, and record actor + timestamp. The drain stays obstructed (red) until telemetry normalizes.
2. WHEN an Operador submits decision `falso_positivo` on an active alert THEN the system SHALL persist the decision, set alert status to `false_positive`, and record actor + timestamp
3. WHEN the alert is already `resolved`, `false_positive`, or `cleared` THEN the system SHALL reject a new decision with `409` or equivalent UI error
4. WHEN a new reading for a device leaves the obstruction rule (`water_level < 75` OR `water_flow > 0.05`) THEN the system SHALL auto-clear that device's open/confirmed alerts to status `cleared`

**Independent Test**: Resolve one alert from the UI; verify DB audit fields; retry resolve and expect rejection.

---

### P1: Continuous IoT simulator ⭐ MVP

**User Story**: As a demonstrator, I want the HTML simulator to send telemetry on an interval and offer an obstruction scenario so that the full loop can be demoed.

**Why P1**: Success criteria 1–2.

**Acceptance Criteria**:

1. WHEN the simulator is running against a configured backend base URL THEN it SHALL POST telemetry approximately every 10 seconds representing current slider values
2. WHEN the user selects the obstruction scenario THEN level/flow SHALL match the anomaly thresholds and the next POST(s) SHALL carry those values

**Independent Test**: Run simulator + backend; observe continuous POSTs; trigger obstruction; see alert appear.

---

## Edge Cases

- WHEN a single anomalous reading arrives (not yet two consecutive) THEN the system SHALL NOT create an alert
- WHEN level is high but flow is above `0.05` THEN the system SHALL NOT create an obstruction alert
- WHEN duplicate identical POSTs retry with the same content THEN the system SHALL still persist each reading unless a future idempotency key is introduced (MVP: accept duplicates; detection uses consecutive persisted rows)
- WHEN MariaDB is unavailable THEN the API SHALL return `503` without partial silent success

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| TEL-01 | P1: Telemetry ingestion | Tasks | In Tasks |
| TEL-02 | P1: Telemetry ingestion | Tasks | In Tasks |
| TEL-03 | P1: Telemetry ingestion | Tasks | In Tasks |
| DET-01 | P1: Deterministic anomaly detection | Tasks | In Tasks |
| DET-02 | P1: Deterministic anomaly detection | Tasks | In Tasks |
| DET-03 | P1: Deterministic anomaly detection | Tasks | In Tasks |
| ALT-01 | P1: Operator alert panel | Tasks | In Tasks |
| ALT-02 | P1: Operator alert panel | Tasks | In Tasks |
| ALT-03 | P1: Operator alert panel | Tasks | In Tasks |
| DEC-01 | P1: Operator decision record | Tasks | In Tasks |
| DEC-02 | P1: Operator decision record | Tasks | In Tasks |
| SIM-01 | P1: Continuous IoT simulator | Tasks | In Tasks |
| SIM-02 | P1: Continuous IoT simulator | Tasks | In Tasks |

**Coverage:** 13 total, 13 mapped in `tasks.md`, 0 unmapped

---

## Success Criteria

- [ ] Device simulator transmits continuous normal telemetry over HTTP
- [ ] Simulated anomaly is persisted and processed
- [ ] Deterministic detector identifies the anomaly and stores validated structured output
- [ ] Platform shows the alert and allows Operator decision recording
