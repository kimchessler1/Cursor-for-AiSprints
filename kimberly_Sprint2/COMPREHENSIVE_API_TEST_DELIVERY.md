# Sprint 2 — Comprehensive API test delivery

**Purpose:** Single delivery artifact for **Sprint 2** — what was built, how it maps to PRDs, **OWASP-aligned** API signals, the **OpenAI feature flag**, and how this relates to **`npm run build`**.  
**Companion:** [`POSTMAN_AND_ENV_COVERAGE.md`](POSTMAN_AND_ENV_COVERAGE.md) (env + TEKS PRD gaps), [`README.md`](README.md) (parts A–D).

---

## 1. Executive summary

| Item | Detail |
|------|--------|
| **Deliverable** | Four Postman collections + two committed environment files; Newman scripts in [`package.json`](../package.json); docs under [`tests/postman/`](../tests/postman/). |
| **PRD alignment** | [`docs/BASIC_AUTHENTICATION.md`](../docs/BASIC_AUTHENTICATION.md), [`docs/MCQ_CRUD.md`](../docs/MCQ_CRUD.md), [`docs/TEKS_ALIGNED_MCQ.md`](../docs/TEKS_ALIGNED_MCQ.md) — **HTTP/API** behaviors (not full UI). |
| **Verification** | **`npm run test:newman`** (43 requests, 56 assertions) — **exit 0** when app is up and TEKS is **mock** (`QUIZMAKER_OPENAI_LIVE` false/unset on server). |
| **OpenAI feature flag** | **`QUIZMAKER_OPENAI_LIVE`** — mock (default automation) vs live; see [§3](#3-openai-feature-flag-quizmaker_openai_live) and [`tests/postman/README.md`](../tests/postman/README.md). |
| **OWASP** | Newman tests provide **targeted API security signals** (auth gate, IDOR-style ownership, validation, error disclosure) — **not** full OWASP/WSTG program sign-off; see [§4](#4-owasp--api-security-alignment). |
| **`npm run build`** | Runs **Vitest** then **Next.js compile** — **does not** run Newman (no HTTP server in that step). See [§5](#5-build-pipeline-vs-api-contract-suite). |

---

## 2. All Postman collections — tests, meaning, status

**Environment (default automation):** [`tests/postman/environments/mock-openai.postman_environment.json`](../tests/postman/environments/mock-openai.postman_environment.json) — `baseUrl`, `QUIZMAKER_OPENAI_LIVE=false` (documentation); **server** `.dev.vars` governs mock vs live.

| Collection | npm command | Requests (typ.) | Assertions (typ.) | What it proves | PRD mapping | Status |
|------------|-------------|-----------------|-------------------|----------------|-------------|--------|
| [`postman-auth-integration.json`](../tests/postman/collections/postman-auth-integration.json) | `test:newman:auth` | 15 | 22 | Signup/login/logout/me, validation **400**s, duplicate **409**, session cookie on success, **401** without cookie on `/api/auth/me` and **`GET /api/mcqs`**, no password in JSON | **BASIC_AUTHENTICATION** — API session model, status codes, generic errors | **Pass** (Newman exit 0) |
| [`postman-mcq-crud-integration.json`](../tests/postman/collections/postman-mcq-crud-integration.json) | `test:newman:mcq` | 25 | 26 | **401** unauthenticated MCQ routes; full CRUD + list/search/pagination; attempts correct/wrong + list; validation **400**s; **404** unknown MCQ; **404** PUT/DELETE **other user’s** MCQ (ownership); delete **204**; get after delete **404** | **MCQ_CRUD** + attempts — ownership, pagination, validation | **Pass** (exit 0) |
| [`postman-teks-generate-integration.json`](../tests/postman/collections/postman-teks-generate-integration.json) | `test:newman:teks` | 3 | 8 | **200** mock TEKS (`[Mock]` title, **4** choices); no API key / `sk-` in body; invalid body **400**; no stack trace in error | **TEKS_ALIGNED_MCQ** — `POST /api/mcqs/generate-teks` contract (API slice; UI not in scope) | **Pass** (exit 0, **mock** server) |
| [`postman-teks-live-optional.json`](../tests/postman/collections/postman-teks-live-optional.json) | `test:newman:teks:live` | 3 | 8 | **200** live TEKS — title **not** `[Mock]`, 4 choices, secrets checks; **400** invalid body | **TEKS** live path — **INT-TEKS-LIVE-001**; optional (**tokens**) | **Pass** when server **live** + `verify-openai` |

**Full suite (Sprint 2 Part D):** `npm run test:newman` = auth → mcq → teks (**mock**).  
**Checkpoint script:** `npm run verify-phase2` — same as `test:newman` (requires running app).

---

## 3. OpenAI feature flag (`QUIZMAKER_OPENAI_LIVE`)

| Server value | `POST /api/mcqs/generate-teks` behavior | Automation |
|--------------|----------------------------------------|------------|
| Unset / `false` / `0` | **Mock** — deterministic `[Mock]` titles, no completion tokens | `test:newman:teks`, `test:newman`, `test:newman:ci` (default) |
| `true` / `1` | **Live** OpenAI — real model output | `test:newman:teks:live` only; run **`npm run verify-openai`** first; restart **`npm run dev`** after changing `.dev.vars` |

Implementation: [`app/api/mcqs/generate-teks/route.ts`](../app/api/mcqs/generate-teks/route.ts). Policy: [`kimberly_test_plan.md`](../kimberly_test_plan.md) §6.

---

## 4. OWASP / API security alignment

Newman integration is **risk-shaped** per [`kimberly_test_plan.md`](../kimberly_test_plan.md) §1.1, §8, §13.7 — it **does not** replace Phase **5** WSTG sign-off or a full penetration test. Below maps **API test artifacts** to common **OWASP API Security** themes (informative).

| Theme | How Sprint 2 tests contribute | Representative INT-* / requests |
|-------|--------------------------------|----------------------------------|
| **Broken object / access control** | Cross-user MCQ **PUT/DELETE** return **404** (no data leak to wrong owner) | INT-MCQ-008, INT-MCQ-010 |
| **Broken authentication** | Protected APIs **401** without session; login/signup negative paths | INT-AUTH-011, INT-AUTH-012, INT-MCQ-011, INT-AUTH-005–010 |
| **Broken authentication (session)** | Session established on signup/login; **401** after logout | INT-AUTH-001–004 |
| **Security misconfiguration / error handling** | **400** validation responses; assertions **no stack trace** in body (TEKS invalid) | TEKS invalid POST; auth/MCQ validation requests |
| **Sensitive data exposure** | No password material in signup response; TEKS response **no** `OPENAI_API_KEY`, **no** `sk-*` pattern | Auth signup; TEKS mock/live |
| **Injection (surface)** | Structured JSON validation — rejects bad MCQ shapes | INT-MCQ-012, INT-ATT-003 |

**Out of scope for Newman:** TLS certificate pinning, rate limiting, full SSRF assessment of upstream OpenAI, exhaustive BOLA on every field — track under Phase **5** / manual WSTG where applicable.

---

## 5. Build pipeline vs API contract suite

| Command | What runs | Needs HTTP server? |
|---------|-----------|-------------------|
| **`npm run build`** | `npm run test:run` (Vitest) → **`next build`** | **No** — unit tests are mocked |
| **`npm run test:ci`** / **`verify-phase4`** | Vitest + ESLint | **No** |
| **`npm run test:newman`** / **`verify-phase2`** | Newman — full API suite | **Yes** — `baseUrl` (e.g. `npm run dev`) |
| **`npm run test:newman:ci`** | Newman vs **`NEWMAN_BASE_URL`** | **Yes** — deployed/staging app (CI job when var set) |

**Conclusion:** The **compile/build** step validates **units + bundle**; the **API integration contract** is a **separate gate** (local: `verify-phase2`; hosted: optional `newman-staging` job). This matches [`kimberly_test_plan.md`](../kimberly_test_plan.md) §10.5 — Newman is not inside `next build`.

---

## 6. Results status (representative)

| Gate | Expected | Notes |
|------|----------|--------|
| `npm run test:newman` | Exit **0** | 43 requests, 56 assertions — **auth + mcq + mock teks** |
| `npm run verify-phase2` | Same as above | Alias wrapper |
| `npm run test:newman:teks:live` | Exit **0** only with **live** server | Optional; costs tokens |

Re-run before release if APIs or collections changed.

---

## 7. Next step — main test plan

After team review, promote **small deltas** into [`kimberly_test_plan.md`](../kimberly_test_plan.md) (§13.7 implementation status, §6 cross-links) — see **`#### 13.7.3`** in the plan for the Sprint 2 record.
