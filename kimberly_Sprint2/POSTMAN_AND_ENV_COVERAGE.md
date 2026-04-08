# Sprint 2 — Postman artifacts, environments, and PRD alignment

Use this as the **inventory** for API integration work completed in Sprint 2 and for **ongoing** Newman runs. Authoritative procedures: [`tests/postman/README.md`](../tests/postman/README.md), [`AGENTS.md`](../AGENTS.md).

---

## 1. Postman environments (committed)

| File | Role |
|------|------|
| [`tests/postman/environments/mock-openai.postman_environment.json`](../tests/postman/environments/mock-openai.postman_environment.json) | **Default for automation:** `baseUrl` = `http://localhost:3000`, `QUIZMAKER_OPENAI_LIVE` = `false` (documents intent). `test_email` / `test_password` are **empty placeholders** — no secrets committed. |
| [`tests/postman/environments/live-openai.postman_environment.json`](../tests/postman/environments/live-openai.postman_environment.json) | **Optional live TEKS:** `QUIZMAKER_OPENAI_LIVE` = `true` (documentation only). **Server** `.dev.vars` must match the run; restart `npm run dev` after toggling. |

**Important:** Newman’s `QUIZMAKER_OPENAI_LIVE` value does **not** override the app. The **server** reads `.dev.vars` / deployment env. For **`npm run test:newman`** (mock TEKS), keep **`QUIZMAKER_OPENAI_LIVE=false`** (or unset) in `.dev.vars` and restart the dev server if you changed it.

---

## 2. Postman collections (created for Sprint 2)

| Collection | npm script | Environment | Sprint part |
|------------|------------|-------------|-------------|
| [`postman-auth-integration.json`](../tests/postman/collections/postman-auth-integration.json) | `npm run test:newman:auth` | mock | A |
| [`postman-mcq-crud-integration.json`](../tests/postman/collections/postman-mcq-crud-integration.json) | `npm run test:newman:mcq` | mock | B |
| [`postman-teks-generate-integration.json`](../tests/postman/collections/postman-teks-generate-integration.json) | `npm run test:newman:teks` | mock | C (automation) |
| [`postman-teks-live-optional.json`](../tests/postman/collections/postman-teks-live-optional.json) | `npm run test:newman:teks:live` | live | C (optional; tokens) |

**Full suite (Part D):** `npm run test:newman` = auth → mcq → teks (**mock**), all using **mock-openai** env.

---

## 3. `docs/TEKS_ALIGNED_MCQ.md` — what Sprint 2 covers vs out of scope

The TEKS PRD describes **product** work: UI dialog, MCQ create page, TEKS data, **and** the **`POST /api/mcqs/generate-teks`** contract.

| PRD area | Sprint 2 Newman coverage |
|----------|---------------------------|
| **Backend API** — request body: `subject`, `grade_level`, `strand_name`, `standard_code`, `standard_description`, `topic_specifics` | **Yes.** Valid body in `postman-teks-generate-integration.json` (and live optional collection). |
| **Backend API** — response: `title`, `description`, `question`, `choices[]` with `choice_text`, `is_correct`, `order_index` | **Yes (asserted where practical).** Mock run: status **200**, **`[Mock]`** title prefix, **4** choices, no API key / `sk-` in response text. |
| **AI / schema** — exactly **4** choices, one correct | **Yes** — `choices` length **4** in assertions. |
| **Validation** — invalid input returns safe error | **Yes** — empty `subject` (and related invalid shape) → **400**, no stack trace in body. |
| **OpenAI feature flag** `QUIZMAKER_OPENAI_LIVE` (mock vs live) | **Yes** — mock path in default collections; live optional collection + docs in `tests/postman/README.md`. |
| **Frontend** — TEKS dialog, cascading dropdowns, create page, loading states | **Out of scope** for Sprint 2 (API-only sprint). Track under UI/E2E / later phases. |
| **Exhaustive** subject / grade / strand / standard combinations from `lib/teks.ts` | **Not exhaustive in Newman** — one **representative** valid payload (Science / grade 5 / sample standard). Add more requests later if the team wants matrix coverage. |
| **Authentication on `generate-teks`** | **Not asserted in Postman** — middleware allows `/api/*` without session; route does not require auth today. If the product adds auth, add INT-* cases and collections. |

---

## 4. Sprint 2 completeness checklist

| Item | Status |
|------|--------|
| Auth API Newman (`INT-AUTH-*`) | Done — `postman-auth-integration.json` |
| MCQ + attempts Newman (`INT-MCQ-*`, `INT-ATT-*`) | Done — `postman-mcq-crud-integration.json` |
| TEKS generate Newman — mock + negative (`INT-TEKS-001`, `INT-TEKS-002`) | Done — `postman-teks-generate-integration.json` + mock env |
| TEKS — optional live (`INT-TEKS-LIVE-001`) | Done — `postman-teks-live-optional.json` + `test:newman:teks:live` + README |
| Mock environment file committed, no secrets | Done — `mock-openai.postman_environment.json` |
| Full suite command | Done — `npm run test:newman` (Part D) |
| Promote to `kimberly_test_plan.md` | **Deferred** — team merges small deltas when ready |

---

## 5. Where to continue next (continuous work)

| Track | Location |
|-------|----------|
| Mock vs live TEKS toggles, `verify-openai`, restarts | [`tests/postman/README.md`](../tests/postman/README.md) |
| Sprint narrative and parts A–D | [`README.md`](README.md) (this folder) |
| CI / staging Newman variables | [`tests/postman/README.md`](../tests/postman/README.md) Phase 4 section, `kimberly_test_plan.md` §12 / §13 |
| TEKS product requirements (UI + API evolution) | [`docs/TEKS_ALIGNED_MCQ.md`](../docs/TEKS_ALIGNED_MCQ.md) |
