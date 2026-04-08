# Sprint 2 — API integration tests & OpenAI feature flag

**Status:** Working document — **Parts A–C** delivered (collections built + Newman green). **Part D** is the sprint exit: one full `npm run test:newman` with **mock** TEKS (confirm green before closing Sprint 2).  
**Purpose:** Single place for **Sprint 2** — kept here first; after review, updates flow into [`kimberly_test_plan.md`](../kimberly_test_plan.md) in **small, confirmed deltas** so the main plan stays the guard-railed source of truth.

**Artifact inventory & TEKS PRD alignment:** [`POSTMAN_AND_ENV_COVERAGE.md`](POSTMAN_AND_ENV_COVERAGE.md) — all Postman collections, **`mock-openai`** / **`live-openai`** envs, mapping to [`docs/TEKS_ALIGNED_MCQ.md`](../docs/TEKS_ALIGNED_MCQ.md), and gaps (UI, non-exhaustive TEKS permutations).

**Comprehensive delivery (PRDs, OWASP-oriented API signals, build vs Newman, feature flag):** [`COMPREHENSIVE_API_TEST_DELIVERY.md`](COMPREHENSIVE_API_TEST_DELIVERY.md). **`npm run test:api-integration`** aliases the full Newman suite (`test:newman`).

## What Sprint 2 is (and is not)

| In scope for Sprint 2 | Out of scope for Sprint 2 (later / other docs) |
|------------------------|------------------------------------------------|
| **Build and run API integration tests** (Postman + Newman) against a **running** app | **Browser / UI / E2E** (e.g. Playwright) — not required this sprint |
| **Exercise** `QUIZMAKER_OPENAI_LIVE` for `POST /api/mcqs/generate-teks`: **mock** path required for default automation; **live** path **optional**, documented ([`tests/postman/README.md`](../tests/postman/README.md)) | **GitHub Actions** wiring for Playwright or live OpenAI — future branch/CI work |
| **HTTP contracts**, sessions/cookies as exercised in collections, safe error bodies | Full **security program** sign-off, traceability matrix work, Phase 5 consolidation — main test plan |
| **Vitest** remains the project’s **unit** layer; Sprint 2 does **not** replace or expand Vitest scope | Treating **Vitest “Phase 1”** as a Sprint 2 deliverable — it is **not**; Sprint 2 is **Newman/API only** |

**Sprint 2 scope (only these goals — nothing beyond):**

1. **Build and run API integration tests** (Postman + Newman) for Auth, MCQ/attempts, and TEKS generation.  
2. **Test the OpenAI feature flag** (`QUIZMAKER_OPENAI_LIVE`) for `POST /api/mcqs/generate-teks` per [test plan §6](../kimberly_test_plan.md#6-openai-feature-flag-quizmaker_openai_live) — mock assertions in default collections; optional live Newman documented separately.

---

## Guardrails, rules, and “done” for each step

Work should stay aligned with:

| Layer | Role |
|-------|------|
| [`kimberly_test_plan.md`](../kimberly_test_plan.md) | Strategy, INT-* IDs, **§6** flag, **§13.7** Newman catalog, **§1.1** what integration proves |
| [`docs/TEST_CASE_GUIDE.MD`](../docs/TEST_CASE_GUIDE.MD) | Integration rules (real implementation, collection independence, errors) |
| [`AGENTS.md`](../AGENTS.md) | Repo scripts, **`verify-openai`**, **`QUIZMAKER_OPENAI_LIVE`** + restart after `.dev.vars` changes |
| [`tests/postman/README.md`](../tests/postman/README.md) | Mock vs **live** TEKS toggles, **`test:newman:teks:live`**, no secrets in committed envs |

**Discipline:** Treat each **Part** as complete only after its **Verify** command exits **0** (and, for Part D, after a fresh **`npm run test:newman`** with **mock** TEKS). Do not skip ahead without a green run for the prior part.

---

## Promotion to `kimberly_test_plan.md`

This folder is the **staging** narrative for Sprint 2. When the team agrees:

- Merge **incremental** updates into [`kimberly_test_plan.md`](../kimberly_test_plan.md) (e.g. §13.7 table, §6 notes) — **not** a dump of this entire file.
- Keep the main plan authoritative for **guardrails** and cross-phase references; Sprint 2 README remains a **historical / sprint** record if useful.

---

## Basis (API PRDs — do not diverge without team agreement)

| Document | Role |
|----------|------|
| [`kimberly_test_plan.md`](../kimberly_test_plan.md) | Strategy, INT-* catalog, §6 flag, §13.7 Newman design, §1.1 |
| [`docs/TEST_CASE_GUIDE.MD`](../docs/TEST_CASE_GUIDE.MD) | Integration rules: actual implementation, collection independence, errors |
| [`docs/BASIC_AUTHENTICATION.md`](../docs/BASIC_AUTHENTICATION.md) | Auth API |
| [`docs/MCQ_CRUD.md`](../docs/MCQ_CRUD.md) | MCQ / attempts API |
| [`docs/TEKS_ALIGNED_MCQ.md`](../docs/TEKS_ALIGNED_MCQ.md) | TEKS generation API |

---

## Completed so far (summary)

| Step | What was built / run | Confirmed |
|------|----------------------|-----------|
| **Part A** | `postman-auth-integration.json` — INT-AUTH-001–012 | `npm run test:newman:auth` **exit 0** |
| **Part B** | `postman-mcq-crud-integration.json` — INT-MCQ / INT-ATT | `npm run test:newman:mcq` **exit 0** |
| **Part C** | `postman-teks-generate-integration.json` — mock TEKS + invalid body; flag **§6** via mock path | `npm run test:newman:teks` **exit 0** (server **mock**: `QUIZMAKER_OPENAI_LIVE` false/unset) |
| **Part C (optional)** | Live TEKS: `postman-teks-live-optional.json`, **`test:newman:teks:live`** | Documented in [`tests/postman/README.md`](../tests/postman/README.md); **not** required to close Sprint 2 |
| **Part D** | Full suite | Run **`npm run test:newman`** (mock TEKS) and record **exit 0** to close the sprint |

---

## What Sprint 2 proves (and does not)

Same boundaries as [§1.1](../kimberly_test_plan.md#11-what-the-tests-prove--top-program-risks-review-hub) and [§13.7.1](../kimberly_test_plan.md#1371-what-newman-integration-proves-and-does-not): HTTP contracts and flag behavior on a **running** app — not browser E2E, not full security program sign-off.

---

## Sprint 2 as one whole (parts, not a separate “Stage 1”)

Auth API tests are **the first completed part of Sprint 2**, not a prerequisite from another stage. The test plan’s Newman rollout order ([§13.7](../kimberly_test_plan.md#137-integration-api-test-catalog--staged-newman-implementation)) lists auth → MCQ → TEKS for **repository organization**; **for Sprint 2, all of that is one sprint.**

| Sprint 2 part | Focus | Status |
|---------------|--------|--------|
| **Part A — Auth API tests** | INT-AUTH-001–012; `postman-auth-integration.json` | **Done** (build + run: `npm run test:newman:auth`) |
| **Part B — MCQ + attempts API tests** | INT-MCQ-*, INT-ATT-*; `postman-mcq-crud-integration.json` | **Done** — verification block below |
| **Part C — TEKS API + OpenAI flag** | INT-TEKS-001–002 (+ optional **INT-TEKS-LIVE-001**); `postman-teks-generate-integration.json` | **Done** (automation: mock + negative); live path optional — see **Completed work — Part C** below |
| **Part D — Run the full API suite** | One command: auth → mcq → teks (**mock**) | **Exit step** — run **`npm run test:newman`** with **`QUIZMAKER_OPENAI_LIVE=false`** (or unset) in **`.dev.vars`**, dev **restarted** after any toggle; **exit 0** = Sprint 2 API work closed |

**Note:** Test plan “Phase 1” (Vitest) is **not** Sprint 2. Sprint 2 is **only** Newman/API work and TEKS flag behavior above.

---

## Completed work — Part A (Auth)

Already delivered as **part of Sprint 2**:

- **Artifact:** `tests/postman/collections/postman-auth-integration.json`
- **Coverage:** INT-AUTH-001–012 — signup/login/logout/me, validation negatives, auth gate on `/api/auth/me` and `GET /api/mcqs` without cookie (**QM-AUTH-05–07**, **QM-AUTH-10** via API).
- **Verify:** `npm run test:newman:auth` with app at `baseUrl` and `tests/postman/environments/mock-openai.postman_environment.json` (or equivalent).

Details remain in [§13.7](../kimberly_test_plan.md#137-integration-api-test-catalog--staged-newman-implementation) summary table.

---

## Completed work — Part B (MCQ + attempts)

- **Artifact:** `tests/postman/collections/postman-mcq-crud-integration.json`
- **Coverage:** INT-MCQ / INT-ATT scenarios per tables below; **QM-MCQ-05–07** via API (unauthenticated and cross-user access).
- **Verify:** `npm run test:newman:mcq` with app at `baseUrl` and `tests/postman/environments/mock-openai.postman_environment.json`.

### Verification (representative run)

- **25** requests, **0** failed, **26** assertions, exit **0** (~29s); app at `http://localhost:3000`.

**Flow (summary):** Unauthenticated `GET`/`POST /api/mcqs` (401); User A signup → create → list → search → invalid pagination (400) → GET unknown id (404) → GET by id → attempts (correct + wrong) → list attempts → attempt `{}` (400) → bad choice id (404) → create validation (1 choice, two correct) → PUT → logout; User B signup → PUT/DELETE A’s MCQ (404); logout B; User A login → DELETE (204) → GET deleted (404).

### INT-MCQ / INT-ATT catalog (reference)

**Source:** [docs/MCQ_CRUD.md](../docs/MCQ_CRUD.md)

| ID | Title | Integration scenario | Preconditions | Steps (API) | Expected results |
|----|--------|----------------------|---------------|-------------|------------------|
| INT-MCQ-001 | Create MCQ | Valid create | Session | `POST /api/mcqs` | **201**; ids; flexible `is_correct` if needed ([§5.2](../kimberly_test_plan.md#52-integration--postman--newman)) |
| INT-MCQ-002 | List MCQs | Paginated list | ≥1 MCQ | `GET /api/mcqs` | **200**; `mcqs` + `pagination` |
| INT-MCQ-003 | Search / pagination | Filter + pages | Data | `GET /api/mcqs?page=&limit=&search=` | **200** |
| INT-MCQ-004 | Invalid pagination | Bad params | Session | Invalid `page`/`limit` | **400** |
| INT-MCQ-005 | Get by id | Read one | Known id | `GET /api/mcqs/{id}` | **200** + `choices` |
| INT-MCQ-006 | Get missing id | Not found | Session | Bad id | **404** |
| INT-MCQ-007 | Update own | Edit | Owned id | `PUT /api/mcqs/{id}` | **200** |
| INT-MCQ-008 | Update other’s MCQ | IDOR | B’s id, A session | `PUT` | **404** |
| INT-MCQ-009 | Delete own | Remove | Owned id | `DELETE` | **204** |
| INT-MCQ-010 | Delete other’s | IDOR | B’s id, A session | `DELETE` | **404** |
| INT-MCQ-011–014 | Negatives | Validation / unauth | | Bad body / no cookie | **400** / **401** |

| ID | Title | Scenario | Steps | Expected |
|----|--------|----------|-------|----------|
| INT-ATT-001 | Record attempt | Valid attempt | `POST .../attempts` | **200**; shape per PRD |
| INT-ATT-002 | List attempts | History | `GET .../attempts` | **200**; `{ attempts }` |
| INT-ATT-003–005 | Negatives | Bad input / unauth | | **400** / **404** / **401** |

**Exit Part B:** `npm run test:newman:mcq` passes — **met.**

---

## Completed work — Part C (TEKS + OpenAI flag)

- **Artifact:** `tests/postman/collections/postman-teks-generate-integration.json`
- **Coverage (automation):** **INT-TEKS-001** — mock `POST /api/mcqs/generate-teks` (**200**, `[Mock]` title prefix, 4 choices, no API key material in response); **INT-TEKS-002** — invalid body (**400**, no stack trace in body). Signup precedes TEKS calls for a fresh user (session not required for generate-teks).
- **Verify:** `npm run test:newman:teks` with app at `baseUrl` and `tests/postman/environments/mock-openai.postman_environment.json`. Server must have **`QUIZMAKER_OPENAI_LIVE` unset, `false`, or `0`** (e.g. `.dev.vars`) so the route returns mock content — Postman’s `QUIZMAKER_OPENAI_LIVE` value does not override the server.

### Verification (representative run)

- **3** requests, **0** failed, **8** assertions, exit **0** (~2.5s); `baseUrl` `http://localhost:3000`.

### INT-TEKS catalog (reference)

**Source:** [docs/TEKS_ALIGNED_MCQ.md](../docs/TEKS_ALIGNED_MCQ.md), [§6](../kimberly_test_plan.md#6-openai-feature-flag-quizmaker_openai_live)

| ID | Title | Flag / intent | Steps | Expected |
|----|--------|-----------------|-------|----------|
| INT-TEKS-001 | Mock generation | `QUIZMAKER_OPENAI_LIVE` unset / `false` / `0` | Valid `POST /api/mcqs/generate-teks` | **200**; `[Mock]` prefix; 4 choices; no secrets in body |
| INT-TEKS-002 | Invalid body | (same server as mock for automation) | Invalid `POST` | **400**; safe error body |
| INT-TEKS-LIVE-001 | Live generation (**optional** — costs tokens) | Server: `QUIZMAKER_OPENAI_LIVE=true` + valid key; **`npm run verify-openai`** first | Same valid `POST` as mock | **200**; **no** `[Mock]` prefix; no key in response |

**Env files:** `tests/postman/environments/mock-openai.postman_environment.json` (automation default), `live-openai.postman_environment.json` (documents live intent).

**Exit Part C (automation):** Mock + negative green — **met.**

**Optional live TEKS (not a Sprint 2 requirement):** **`npm run test:newman:teks:live`** with server **`QUIZMAKER_OPENAI_LIVE=true`** documents **INT-TEKS-LIVE-001**. Toggle **`.dev.vars`**, restart **`npm run dev`**, run **`npm run verify-openai`** first. Full mock vs live instructions: [`tests/postman/README.md`](../tests/postman/README.md). Future **Playwright** + **GitHub Actions** on a branch is out of scope here.

---

## Sprint 2 exit — full API run (Part D)

```bash
npm run test:newman
```

Runs **auth → mcq → teks (mock)** in sequence. **Part D requires** the TEKS step to use **mock** generation: **`QUIZMAKER_OPENAI_LIVE=false`** (or unset / `0`) in **`.dev.vars`** and a dev server restarted after any toggle — see [`tests/postman/README.md`](../tests/postman/README.md).

### Verification (representative run)

- **43** requests total (15 + 25 + 3), **0** failed, **56** assertions (22 + 26 + 8), exit **0** (~26–33s depending on load); same mock env and `baseUrl` as above.

---

## Commands (from repo root)

App must be up at `baseUrl` (e.g. `npm run dev`). See [`tests/postman/README.md`](../tests/postman/README.md).

```bash
npm run test:newman:auth    # Part A
npm run test:newman:mcq     # Part B — green
npm run test:newman:teks    # Part C — green (mock server)
# Optional live TEKS only — not Sprint 2 required (tokens): see tests/postman/README.md
# npm run test:newman:teks:live
npm run test:newman         # Part D — full suite — green (includes mock TEKS)
```

---

## Review pauses (optional, if the team wants gates)

- Before **`npm run test:newman:teks:live`**: confirm **`verify-openai`**, **`.dev.vars`** live flag, and cost/token expectations ([`tests/postman/README.md`](../tests/postman/README.md)).

---

## When to merge into `kimberly_test_plan.md`

Only **after** review. Promote small, confirmed deltas — not this file in full — so the test plan stays clear of noise. Use the main plan to enforce **documentation, guardrails, and rules** across phases; use this Sprint 2 doc to show **what was done step-by-step** before that promotion.

---

## Document history

| Date | Note |
|------|------|
| 2026-04-07 | Initial Sprint 2 doc |
| 2026-04-07 | Unified Sprint 2: Part A (Auth) = completed sprint work; Parts B–D = remaining goals only; removed out-of-scope next steps |
| 2026-04-08 | Part B (MCQ + attempts) implemented in `postman-mcq-crud-integration.json`; Newman 25 requests / 0 failed; Part B verification subsection |
| 2026-04-08 | Part C TEKS mock + negative (`postman-teks-generate-integration.json`): 3 requests / 8 assertions / exit 0; Part D full `npm run test:newman` green |
| 2026-04-08 | Docs: `tests/postman/README.md` mock vs live toggles; optional `test:newman:teks:live` + `postman-teks-live-optional.json`; Sprint 2 / AGENTS pointers |
| 2026-04-08 | Scope narrative: API-only Sprint 2, feature-flag testing, guardrails + step verification, staging vs `kimberly_test_plan.md`; Part D as exit run; “Completed so far” table |
| 2026-04-08 | `POSTMAN_AND_ENV_COVERAGE.md`: Postman/env inventory, TEKS PRD vs Newman scope, continuous-work pointers |
| 2026-04-08 | `COMPREHENSIVE_API_TEST_DELIVERY.md`; `kimberly_test_plan.md` §13.7.3 + staged status; `npm run test:api-integration` |
