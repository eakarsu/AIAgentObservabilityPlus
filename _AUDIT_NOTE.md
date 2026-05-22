# Audit Note — AIAgentObservabilityPlus

Domain: observability for AI agents (traces, metrics, costs, eval-on-rails, prompt versioning, regression detection).

## Stack
- Backend: Node + Express (`backend/server.js`), helmet + CORS, JWT auth (`middleware/auth`).
- Persistence: PostgreSQL (`backend/migrations/001_schema.sql`), pool via `config/database`.
- AI: OpenRouter via `services/ai.js` (`runFeature(schema, body)` pattern, results recorded into `ai_results`).
- Frontend: React + react-router (`frontend/src/App.js`), Sidebar/Topbar shell, per-feature pages.
- Ops: `start.sh` wires backend:4055, frontend:4054, db `agent_obs_plus`, seed step, nodemon.

## Current inventory
- Total backend routes: 39 across 8 router files.
- AI endpoints (`routes/ai.js`): 10 = 8 POST features + `GET /samples` + `GET /history`.
  - `regression-detect`, `auto-rca`, `drift-score`, `anomaly-classify`, `prompt-diff`, `cost-anomaly`, `eval-generator`, `judge-calibrator`.
- CRUD entities (mounted in `server.js`): `projects`, `traces`, `prompts`, `evals`, `alerts`, `prompt-versions`, `eval-results`, `api-keys`.
- Cross-cutting: `notifications` (5), `attachments` (4), `webhooks` (6), `dashboard` (1), `custom-views` (8), `obsExtras` (2 — span hierarchy + OTLP `POST /v1/traces` ingest), `auth` (3).
- Domain tables: `users, ai_results, notifications, attachments, webhooks, webhook_deliveries, projects, traces, prompts, evals, alerts, prompt_versions, eval_results, api_keys`.
- Frontend pages: 8 AI feature pages + 2 workbenches (TraceViewer, OtlpIngest) + custom views + CRUD pages.

## Audit recommendations

### Missing AI Counterparts
- Trace summarization endpoint (`POST /api/ai/trace-summarize`) — narrative summary over a trace + spans (entities exist; not in `routes/ai.js`).
- Sample-curator agent (`POST /api/ai/sample-curate`) — pick high-signal traces for eval ingestion / golden-set augmentation.
- Root-cause assistant tied to live trace IDs (existing `auto-rca` is text-only; no `/traces/:id/rca` shortcut).
- Prompt-version A/B harness orchestrator (AI-driven traffic split + verdict; current `regression-detect` is one-shot scoring).
- Tenant-aware cost attribution AI (allocate `cost-anomaly` deltas across projects/api-keys).

### Missing Non-AI Features
- StatsD / Prometheus / OpenMetrics ingest (only OTLP `POST /v1/traces` exists).
- Real alerting fan-out (`alerts` is CRUD only — no evaluator loop, no PagerDuty/Slack sink; `webhooks` table exists but not wired into alert rules).
- Role-based access control (auth is JWT-only; no role column visible on `users`, no per-project ACL).
- Retention policy / TTL job for `traces`, `eval_results`, `ai_results` (no scheduled prune job in `services/`).
- Dashboard query API beyond the single `dashboard` route (time-window aggregations, percentile rollups, per-model breakdown).
- Span-level persistence (currently spans are derived deterministically from a `trace` row in `obsExtras.js`, not stored).

### Custom Suggestions
- Replay debugger — re-run a stored trace's prompt+tool sequence against a candidate prompt/model (`POST /api/replay/:traceId`).
- Cost-per-tenant attribution dashboard wired to `api_keys` + `projects`.
- Prompt-version A/B harness with shadow traffic + AI judge verdict.
- Sample-curator agent that nominates traces into eval suites automatically.
- Drift sentinel scheduler — periodically run `drift-score` against rolling windows and write to `alerts`.

## Implemented in this pass
None — audit-only.

## Backlog (prioritized) by tag

### MECHANICAL
1. `POST /api/ai/trace-summarize` — reuse `runFeature` + new SCHEMA; pull trace+spans by id.
2. `POST /api/ai/sample-curate` — pick top-N traces for eval ingestion.
3. `POST /api/ai/replay-verdict` — AI verdict on candidate-vs-baseline replay (companion to replay debugger).
4. Per-feature `/api/ai/<feature>` symmetry audit — confirm every SCHEMA key has a route (already aligned).
5. Drift sentinel cron stub in `services/` calling `drift-score` and inserting into `alerts`.

### NEEDS-SCHEMA
6. `spans` table (trace_id, parent_span_id, name, attrs jsonb, duration_ms, status) — replaces deterministic mock in `obsExtras.js`.
7. `roles` + `project_members` for RBAC; add `role` to `users`.
8. `retention_policies` table (entity, ttl_days) + worker.
9. `tenants` / `cost_attribution` rollup tables keyed off `api_keys`/`projects`.
10. `replay_runs` table (trace_id, candidate_prompt_id, verdict, metrics jsonb).

### NEEDS-PRODUCT-DECISION
11. Alert evaluator loop — what triggers (threshold? AI verdict?), fan-out targets (Slack/PagerDuty/webhook).
12. Sampling strategy for ingest (head/tail/probabilistic) — affects schema + cost.
13. Eval scoring authority — is `judge-calibrator` advisory or gating CI?
14. A/B harness traffic model — shadow, mirror, percentage split?
15. Multi-tenant isolation strength (logical vs schema vs DB-per-tenant).

### NEEDS-CREDS
16. PagerDuty / Slack / MS Teams alert sinks.
17. Prometheus remote-write / OTLP-gRPC receivers (current ingest is OTLP JSON only).
18. OpenRouter key (`OPENROUTER_API_KEY`) required for any live AI feature call.
19. SSO/OIDC (Okta, Google) for enterprise auth.

### TOO-RISKY
20. Auto-applying prompt rollbacks based on drift verdict (production-affecting; gate behind manual approval).
21. Auto-suppressing alerts via AI confidence (false-negative blast radius).
22. Sending raw trace payloads (may contain PII) to OpenRouter without redaction layer.

## Categorization with counts
- MECHANICAL: 5
- NEEDS-SCHEMA: 5
- NEEDS-PRODUCT-DECISION: 5
- NEEDS-CREDS: 4
- TOO-RISKY: 3
- Total backlog items: 22
