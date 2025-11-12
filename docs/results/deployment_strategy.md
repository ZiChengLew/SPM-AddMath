# Deployment & Growth Strategy

## 1. Objectives
- Deliver a reliable Performance Tracker launch (papers + dashboard) while keeping existing question bank stable.
- Establish a repeatable release pipeline so new AI tagging logic and analytics can ship weekly.
- Prepare the infrastructure to ingest OCR/CSV data, persist user results, and generate recommendations in near real-time.

## 2. Environments & Hosting
- **Local Dev**: bun/Next.js with mocked APIs; seed data via CSV + mock JSON. Require `.env.local` template for tracker APIs, tagging service URL, storage buckets.
- **Staging** (Vercel preview or Netlify site):
  - Connect to staging Supabase (or chosen DB) with limited dataset.
  - Enable feature toggles for tracker routes (`NEXT_PUBLIC_TRACKER_ENABLED`).
  - Run weekly auto-tag cron jobs against a curated subset to validate OCR accuracy.
- **Production** (Vercel):
  - Edge caching for read-heavy pages (`/lists`, `/tracker/dashboard`).
  - Use serverless API routes (or dedicated service) for save/read operations on `results`, `recommendation_set`.
  - Secrets managed via Vercel environment variables (OpenAI keys, Supabase URL, Tesseract service token).

## 3. Release Pipeline
1. **Branching**: trunk-based; feature branches merged via PR with preview deploy.
2. **CI Checks**:
   - `npm run lint`
   - `npm run test` (add soon once data-layer available)
   - Optional: run lightweight e2e smoke (Playwright) on `/tracker/papers` & `/tracker/dashboard`.
3. **Data Migrations**: use SQL migration scripts versioned in `scripts/migrations/`.
4. **Deployment**: merge to `main` triggers Vercel production deploy; staging environment updated from `release/*` branch if needed.

## 4. Backend & Data Tasks
- **Phase 1** (MVP persistence):
  - Choose managed DB (Supabase/Postgres) → create tables from spec (`results`, `recommendation_set`).
  - Build REST endpoints (`/api/tracker/results`, `/api/tracker/recommendations`) with validation + idempotent upserts (now pointing at Postgres).
  - Store CSV knowledge graph in DB or object storage; expose lookup endpoint for concept/skill metadata.
- **Phase 2** (Analytics & Recommendations):
  - Aggregate job (weekly) to compute weak links, trend metrics.
  - Recommendation builder service combining subtopic stats + question pool.
  - Cache latest dashboard payloads per user to reduce recomputation.
- **Phase 3** (Scalability):
  - Queue-based OCR tagging pipeline (RabbitMQ/SQS) to decouple uploads.
  - Introduce feature flag to toggle experimental recommendation algorithms.

## 5. Integrations
- **Auto Tagging (`auto_tag.py`)**:
  - Containerize Tesseract ingestion; deploy as separate worker (e.g., AWS Lambda with prebuilt layer or Docker on Render).
  - Provide API endpoint that returns tagged concept/skill IDs; front-end stores alongside question metadata.
- **Knowledge Graph**:
  - Import `concept_nodes`, `skill_nodes`, `edges` into graph/relational tables; create resolver service to trace dependent skills for dashboard.
- **Question Bank Linkages**:
  - When user completes a question set, send tracked scores to `/api/tracker/results`.
  - Provide deep links from dashboard cards back into question lists filtered by subtopic.

## 6. Observability & QA
- Logging: centralize API logs (Vercel + DB) via Logflare or Supabase logs.
- Metrics: instrument key flows (result save success rate, recommendation generation time).
- Alerts: configure Slack/email for failed cron jobs, high OCR errors, API error spikes.
- QA checklist per release:
  1. Papers modal captures full mark table, persists to DB, updates list.
  2. Dashboard reflects latest data after save (hot reload or manual refresh).
  3. Recommendation set behaves correctly when no new papers exist.

## 7. Rollout Timeline (Suggested)
- **Week 1–2**: Stand up staging DB, implement API routes, swap front-end mocks for live data; manual QA in staging.
- **Week 3**: Integrate recommendation job + knowledge graph queries; add telemetry.
- **Week 4**: Enable tracker routes in production behind feature flag; invite pilot users (10–20 students) to gather feedback.
- **Week 5+**: Graduate feature flag, automate weekly recommendation generation, start building teacher dashboard requirements.

## 8. Pending Decisions & Approvals
- Final choice of managed database + hosting for OCR worker.
- OpenAI usage limits / cost monitoring for tagging and recommendations.
- Data retention policy (how long to keep historical attempts) and privacy compliance.
- UI polish tasks list (shared components, design tokens) to schedule post-launch.

## 9. Configuration Checklist
- Copy `.env.example` to `.env.local` and populate:
  - `NEXT_PUBLIC_TRACKER_DEFAULT_USER_ID` — fallback user identifier for local/dev runs (replace with real auth user id once identity is wired in).
  - `DATABASE_URL` — Postgres connection string (e.g. Supabase or local instance).
- Document per-environment secrets in your password manager (DB URL, Supabase anon key, OCR service token, OpenAI key).
- For staging/production, set identical variables in Vercel dashboard before deploying tracker routes.

## 10. Database Migration Workflow
- Schema SQL lives at `db/migrations/001_init.sql`. Apply with `psql "$DATABASE_URL" -f db/migrations/001_init.sql`.
- For iterative changes, create sequential files (`db/migrations/002_*.sql`) and track execution (consider `schema_migrations` table later).
- Seed demo data separately (SQL or script) so production runs start clean.

## 11. Sample Data (Optional)
- `db/seeds/tracker_sample.sql` wipes and re-inserts a richer demo dataset for the `demo-user`.
- Run via pgAdmin (Query Tool) or `psql "$DATABASE_URL" -f db/seeds/tracker_sample.sql` after the base migration.
- The dataset covers four recent papers plus active/archived recommendation sets so charts and weak-link analytics have meaningful values.
- Never run this in production unless you are resetting demo data—wrap in transactions and adjust the `user_id` if you need to seed real accounts.

Review this plan and adjust priorities; once approved we can lock tasks into the engineering kanban and execute step by step.
