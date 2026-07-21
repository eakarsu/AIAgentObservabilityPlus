# Agent Observability Plus operations

Startup is read-only. Dependency installation, database creation, migrations, user provisioning, demo data, and port cleanup are separate explicit operations.

## Explicit bootstrap

1. Copy `.env.example` to an untracked `.env` and replace its placeholders.
2. Create an empty PostgreSQL database and least-privilege role externally.
3. Run `npm run migrate`, provision an administrator with `npm run create-admin`, and run `npm test`.
4. Run `npm start` only after the database and secrets are ready.

Demo rows require `ENABLE_DEMO_SEED=true` and are never loaded by startup.

## Supported hardened workflow

- `POST /api/v1/traces`: authenticated OTLP/JSON ingestion with real span persistence and recursive redaction.
- `GET /api/traces/:id/spans`: tenant-scoped persisted span hierarchy.
- `POST /api/evaluations/runs`: versioned dataset/case evidence and regression gate.
- `GET /api/evaluations/incidents` and status transitions: incident investigation history.
- Retention preview/application requires commander authorization and an exact deletion confirmation token.

Legacy global routes are disabled by default. Production model-gateway exporters, deployment metadata, paging connectors, encryption/KMS, and organization-approved evaluation thresholds remain external.
