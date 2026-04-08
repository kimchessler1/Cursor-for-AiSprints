# Quizmaker Kimberly Test Plan

## Document metadata

- **Role** — Senior test engineer / test architect
- **Version** — 3.8
- **Last updated** — 2026-04-08
- **Status** — Active (living document — strategy plus [§10.5](#105-living-implementation-status-repository-reality) repository implementation status)

## Table of contents

1. [Purpose and scope](#1-purpose-and-scope)
    - [1.1 What the tests prove · Top program risks (review hub)](#11-what-the-tests-prove--top-program-risks-review-hub)
2. [Requirement IDs and traceability](#2-requirement-ids-and-traceability)
3. [Test strategy (risk-based, test pyramid)](#3-test-strategy-risk-based-test-pyramid)
    - [3.4 Unit test feature map (Phase 1)](#34-unit-test-feature-map-phase-1)
    - [3.5 Phase verification snapshot (session)](#35-phase-verification-snapshot-session)
4. [Conventions and repository structure](#4-conventions-and-repository-structure)
    - [4.1 Created structure (target layout)](#41-created-structure-target-layout)
5. [Tooling by layer](#5-tooling-by-layer)
6. [OpenAI feature flag (`QUIZMAKER_OPENAI_LIVE`)](#6-openai-feature-flag-quizmaker_openai_live)
7. [Requirement → journeys → APIs → tests](#7-requirement--journeys--apis--tests)
8. [Security and compliance (OWASP WSTG)](#8-security-and-compliance-owasp-wstg)
    - [8.0 WSTG scope vs automation layers (reference)](#80-wstg-scope-vs-automation-layers-reference)
9. [Explicit exclusions (this phase)](#9-explicit-exclusions-this-phase)
10. [Assumptions, coverage gaps, and risks](#10-assumptions-coverage-gaps-and-risks)
    - [10.4 Test findings — Phase 3b (planned checkpoint and gap)](#104-test-findings--phase-3b-planned-checkpoint-and-gap)
    - [10.5 Living implementation status (repository reality)](#105-living-implementation-status-repository-reality)
11. [Reporting, local test commands, and bug handling](#11-reporting-local-test-commands-and-bug-handling)
    - [11.1 Backlog — Continuous integration (deferred)](#111-backlog--continuous-integration-deferred)
      - [When this backlog is implemented — reconcile with TEST_CASE_GUIDE.MD](#when-this-backlog-is-implemented--reconcile-with-test_case_guidemd)
12. [Implementation phases (with security in every phase)](#12-implementation-phases-with-security-in-every-phase)
    - [12.1 Written tasks by phase](#121-written-tasks-by-phase)
    - [12.2 How security repeats in each phase (summary)](#122-how-security-repeats-in-each-phase-summary)
    - [12.3 Critical E2E user flows (Phase 3)](#123-critical-e2e-user-flows-phase-3)
13. [Implementation plan (execution)](#13-implementation-plan-execution)
    - [How the test runs went (read this first)](#how-the-test-runs-went-read-this-first)
    - [13.0 Phase checkpoint status (living dashboard)](#130-phase-checkpoint-status-living-dashboard)
    - [13.1 Principles and governance](#131-principles-and-governance)
    - [13.2 Phase 0 — Readiness](#132-phase-0--readiness)
    - [13.3 Phase 1 — Unit tests (Vitest)](#133-phase-1--unit-tests-vitest)
    - [13.4 Phases 2-5](#134-phases-2-5)
    - [13.5 Final verification (before execution)](#135-final-verification-before-execution)
    - [13.6 Phase 5 program closeout — senior QA assurance](#136-phase-5-program-closeout--senior-qa-assurance)
    - [13.7 Integration API test catalog & staged Newman implementation](#137-integration-api-test-catalog--staged-newman-implementation)
      - [13.7.1 What Newman integration proves (and does not)](#1371-what-newman-integration-proves-and-does-not)
      - [13.7.2 How the top 3 program risks shape INT-* design](#1372-how-the-top-3-program-risks-shape-int-design)
      - [13.7.3 Sprint 2 — API integration delivery (completed)](#1373-sprint-2--api-integration-delivery-completed)
14. [Document history](#14-document-history)
15. [Appendices](#15-appendices)

- [Exceptions register](#exceptions-register)

## Exceptions register

**Alignment with** [docs/TEST_CASE_GUIDE.MD](docs/TEST_CASE_GUIDE.MD): this plan follows REQUIRED vs RECOMMENDED rules from that guide. The rows below are **explicit, approved exceptions** where this program defers or narrows a guide expectation. Anything related to **hosted continuous integration** is documented only in [§11.1](#111-backlog--continuous-integration-deferred) until implemented.

| Exception | Guide theme | Where this plan records it |
|-----------|-------------|----------------------------|
| **Test data cleanup deferred** | Test Data Management — disposability / cleanup after tests | [§9.3](#93-test-data-cleanup-deferred); use prefixed data until a later phase. |
| **Hosted CI deferred** | CI/CD Integration Patterns — tests in local and CI environments | Active plan uses local commands only ([§11](#11-reporting-local-test-commands-and-bug-handling)); implementation details and parity work live in [§11.1](#111-backlog--continuous-integration-deferred). |
| **Metadata headers — legacy grandfathering** | Global Conventions — header metadata on tests | **New or materially updated** test files **must** include YAML/comment headers per [§4](#4-conventions-and-repository-structure). Files not yet updated are **grandfathered** (optional until touched). |

## Reference documents

### Basis documents

- **Conventions and structure** — [docs/TEST_CASE_GUIDE.MD](docs/TEST_CASE_GUIDE.MD), [docs/TEST_PLAN_TEMPLATE.md](docs/TEST_PLAN_TEMPLATE.md)
- **Requirements** — [docs/BASIC_AUTHENTICATION.md](docs/BASIC_AUTHENTICATION.md), [docs/MCQ_CRUD.md](docs/MCQ_CRUD.md), [docs/TEKS_ALIGNED_MCQ.md](docs/TEKS_ALIGNED_MCQ.md)
- **Framework rules** — [.cursor/rules/vitest-testing.mdc](.cursor/rules/vitest-testing.mdc) (unit — **active**), [.cursor/rules/APITesting-Postman.mdc](.cursor/rules/APITesting-Postman.mdc), [.cursor/rules/playwright-testing.mdc](.cursor/rules/playwright-testing.mdc) (UI — Phase 3b, future)

### External security reference

- **OWASP WSTG** — [Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/) — scenario IDs use forms such as `WSTG-<category>-<number>`; prefer **versioned** links when citing a specific test ([how to reference WSTG scenarios](https://owasp.org/www-project-web-security-testing-guide/))

## 1. Purpose and scope

This plan defines **how** QuizMaker is tested against documented requirements: naming conventions, folder layout, risk-based prioritization, mapping of **unit** (Vitest), **integration** (Postman + **Newman** CLI — the official Postman CLI; sometimes colloquially confused with “Newton”), and **UI / E2E** (Playwright — Phase 3b, not started), plus **OWASP WSTG**–aligned security checks. **Current implementation focus**: **Phase 1 unit tests** only, **feature-by-feature** per [§3.4](#34-unit-test-feature-map-phase-1).

**In scope**: Behavior described in the three requirement PRDs (auth, MCQ CRUD, TEKS generation), including routes and files **named in those PRDs** and verified in the repo.

**Out of scope for this document**: Performance testing strategy, accessibility testing strategy, and automated test data cleanup (see [§9](#9-explicit-exclusions-this-phase)).

**Implementation status in the repo** (tests wired, build gates, scripts, known friction): [§10.5](#105-living-implementation-status-repository-reality) — updated as the team lands tooling changes.

**Phased execution**: Implementation is broken into **Phases 0–5** in [§12](#12-implementation-phases-with-security-in-every-phase). **Serial execution steps, checkpoints, and review gates** are in [§13](#13-implementation-plan-execution). **Each phase has mandatory security requirements** (table column **Security focus** and numbered lists in [§12.1](#121-written-tasks-by-phase)); **Phase 5** adds a full consolidation pass and does not replace security work in earlier phases ([§3.3](#33-security-as-a-cross-cutting-thread-not-a-one-off)).

### 1.1 What the tests prove · Top program risks (review hub)

Use this subsection when stepping back to ask **what we are doing**, **why a test matters**, and **what still limits confidence**. Detail lives in [§3](#3-test-strategy-risk-based-test-pyramid) (pyramid), [§7](#7-requirement--journeys--apis--tests) (journeys → APIs), [§8](#8-security-and-compliance-owasp-wstg)–[§8.0](#80-wstg-scope-vs-automation-layers-reference) (security layers), [§9](#9-explicit-exclusions-this-phase)–[§10](#10-assumptions-coverage-gaps-and-risks) (exclusions, gaps, risks), and [§13.7](#137-integration-api-test-catalog--staged-newman-implementation) (Newman catalog).

#### What is this test actually proving about the system?

The plan is **not** claiming “the product is secure” or “every user journey works” from a single command. It claims **evidence at each layer**, traceable to **QM-*** requirement IDs and the three PRDs ([§2](#2-requirement-ids-and-traceability)):

| Layer | What passing tests **support** (evidence) | What they **do not** replace |
|-------|-------------------------------------------|------------------------------|
| **Vitest** ([§3.4](#34-unit-test-feature-map-phase-1), [§10.5](#105-living-implementation-status-repository-reality)) | Service/schema logic, mocks: validation, ownership predicates, session helpers, TEKS schema — **fast regression signal on code that is isolated** | HTTP cookies, real D1, browser, TLS, full WSTG breadth ([§8.0](#80-wstg-scope-vs-automation-layers-reference)) |
| **Newman / Postman** ([§5.2](#52-integration--postman--newman), [§13.7](#137-integration-api-test-catalog--staged-newman-implementation)) | **Real** routes: status codes, JSON contracts, session cookie behavior, auth gate on `/api/mcqs`, negative paths — **wiring + API behavior** on a running app | Guaranteed parity with hosted CI, or UI flows (redirects, forms) without Phase **3b** ([§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap)) |
| **Playwright (future 3b)** ([§12.3](#123-critical-e2e-user-flows-phase-3)) | Critical **browser** journeys — smoke | Not a substitute for integration contracts already owned by Newman |
| **Phase 5 manual / WSTG** ([§13.6](#136-phase-5-program-closeout--senior-qa-assurance)) | Consolidated security evidence, human sign-off | **Not** implied by `verify-phase5` automation alone ([§10.5](#105-living-implementation-status-repository-reality)) |

**Bottom line:** Tests prove **documented behavior** of named routes and modules **at the layer under execution**; together they build **confidence** that teachers can register, work with MCQs, and use TEKS generation **as implemented**, while **explicit gaps** (E2E, cleanup, hosted CI, full WSTG) remain visible below.

**Integration (Newman) detail:** The HTTP integration catalog and stages are **risk-shaped from the outset** — what INT-* proves, how **Risks 1–3** constrain scope, and per-stage alignment — in [§13.7](#137-integration-api-test-catalog--staged-newman-implementation) ([§13.7.1](#1371-what-newman-integration-proves-and-does-not), [§13.7.2](#1372-how-the-top-3-program-risks-shape-int-design)).

#### Top 3 program risks (single view — see also [§10.3](#103-risk-assessment-summary))

These are the **main threats to over-trusting green runs**; they are the guardrails to revisit before expanding scope.

| # | Risk | Why it matters (plan anchor) | Directional mitigation |
|---|------|------------------------------|------------------------|
| **1** | **Journey proof is incomplete without browser E2E** | [§10.2](#102-coverage-gaps) / [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap): teachers use the UI; Vitest + Newman do not prove redirects, client validation, or full smoke journeys. | Treat Phase **3b** as the explicit bridge; until then, label UI-dependent claims carefully. |
| **2** | **Automation ≠ full security assurance** | [§8.0](#80-wstg-scope-vs-automation-layers-reference) / [§3.3](#33-security-as-a-cross-cutting-thread-not-a-one-off) / [§13.6](#136-phase-5-program-closeout--senior-qa-assurance): build-time tests and Newman are **not** full OWASP coverage; **critical** tier includes auth bypass and IDOR ([§3.1](#31-risk-tiers-for-prioritization)). | Keep per-phase security tasks; complete Phase **5** evidence and sign-off for program-level security confidence. |
| **3** | **Process and environment dependencies** | [Exceptions register](#exceptions-register) (no automated cleanup, CI deferred); [§10.3](#103-risk-assessment-summary) (Newman cookies, SQLite booleans, live OpenAI); Newman needs a **running** app and correct `QUIZMAKER_OPENAI_LIVE` ([§6](#6-openai-feature-flag-quizmaker_openai_live)). | Prefix test data, document local/team runbooks, reconcile PRD vs code on failures ([§10.2](#102-coverage-gaps)); optional future CI per [§11.1](#111-backlog--continuous-integration-deferred). |

#### Guardrails checklist (confidence before “next stage”)

- [ ] **Traceability**: Change maps to **QM-*** / **INT-*** and a layer (unit vs Newman) — [§2](#2-requirement-ids-and-traceability), [§13.7](#137-integration-api-test-catalog--staged-newman-implementation).
- [ ] **Scope honesty**: Exclusions ([§9](#9-explicit-exclusions-this-phase)) and exceptions ([Exceptions register](#exceptions-register)) are still true; no silent expansion.
- [ ] **Review gate**: Plan → review → approval → implement → test ([§13.1](#131-principles-and-governance)) before merging the next phase.
- [ ] **Failure policy**: Bugs filed per test guide; tests not weakened to match defects ([§11](#11-reporting-local-test-commands-and-bug-handling)).
- [ ] **Integration scope**: New INT-* work matches [§13.7.1](#1371-what-newman-integration-proves-and-does-not) (prove/do-not-prove) and [§13.7.2](#1372-how-the-top-3-program-risks-shape-int-design); no accidental UI or full-security claims.

## 2. Requirement IDs and traceability

The PRDs do not publish formal `REQ-###` IDs. This plan uses prefixed IDs for traceability. Each ID maps to a **section title** and **file** in the source PRD.

### 2.1 Authentication — [docs/BASIC_AUTHENTICATION.md](docs/BASIC_AUTHENTICATION.md)

| ID | PRD section (approx.) | Topic |
|----|------------------------|--------|
| **QM-AUTH-01** | Overview; Business Requirements › User Management | Teachers register and log in; session supports MCQ work |
| **QM-AUTH-02** | Business Requirements › Security Requirements | Password hashing, session cookies, protected routes, validation |
| **QM-AUTH-03** | Technical Requirements › Database Schema › Users Table | `users` table fields and constraints |
| **QM-AUTH-04** | Authentication Flow › Registration / Login / Session | End-to-end auth flows |
| **QM-AUTH-05** | API Endpoints › POST `/api/auth/signup` | Signup contract and status codes |
| **QM-AUTH-06** | API Endpoints › POST `/api/auth/login` | Login contract and status codes |
| **QM-AUTH-07** | Implementation (Phase 2) — API Layer | `POST /api/auth/logout`, `GET /api/auth/me` (files listed in PRD) |
| **QM-AUTH-08** | User Interface › `/signup`, `/login` | Forms, validation, navigation |
| **QM-AUTH-09** | Security Implementation | Password rules, session HMAC, cookie flags, timing-safe compare |
| **QM-AUTH-10** | Route Protection | Protected vs public routes (`/mcqs/*`, `/api/auth/*`, etc.) |
| **QM-AUTH-11** | Core Files — `middleware.ts` | Session validation for protected routes |

**Implementation files (from PRD, verified in repo)**:

- `app/api/auth/signup/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/me/route.ts`
- `middleware.ts`

### 2.2 MCQ CRUD — [docs/MCQ_CRUD.md](docs/MCQ_CRUD.md)

| ID | PRD section (approx.) | Topic |
|----|------------------------|--------|
| **QM-MCQ-01** | Business Requirements › MCQ Management | Create/edit/delete/preview; 2–6 choices; one correct |
| **QM-MCQ-02** | Question Structure | Title, description, question, choices, metadata |
| **QM-MCQ-03** | Database Schema | `mcqs`, `mcq_choices`, `mcq_attempts` |
| **QM-MCQ-04** | UI › `/mcqs`, `/mcqs/create`, `/mcqs/[id]/edit`, `/mcqs/[id]/preview` | Listing, form, preview |
| **QM-MCQ-05** | API › `GET/POST /api/mcqs` | List (pagination, search) and create |
| **QM-MCQ-06** | API › `GET/PUT/DELETE /api/mcqs/[id]` | Read, update, delete |
| **QM-MCQ-07** | API › `POST /api/mcqs/[id]/attempts` | Preview attempt recording |
| **QM-MCQ-08** | Business Logic | Validation rules, ownership, cascade delete |
| **QM-MCQ-09** | Implementation — route files | `app/api/mcqs/route.ts`, `app/api/mcqs/[id]/route.ts`, `app/api/mcqs/[id]/attempts/route.ts` |

### 2.3 TEKS-aligned MCQ generation — [docs/TEKS_ALIGNED_MCQ.md](docs/TEKS_ALIGNED_MCQ.md)

| ID | PRD section (approx.) | Topic |
|----|------------------------|--------|
| **QM-TEKS-01** | Business Requirements › Core Functionality | TEKS-aligned generation; Math/Science 3–6; hierarchy Subject → Grade → Strand → Standard |
| **QM-TEKS-02** | User Experience | Dialog, dropdowns, topic field, loading/errors |
| **QM-TEKS-03** | Frontend | `components/teks-generation-dialog.tsx`, `app/mcqs/create/page.tsx` |
| **QM-TEKS-04** | Backend API | `POST /api/mcqs/generate-teks` — `app/api/mcqs/generate-teks/route.ts` |
| **QM-TEKS-05** | AI Schema | `lib/mcq-generation-schema.ts` (`MCQGenerationSchema`, prompts) |
| **QM-TEKS-06** | Data | `lib/teks.ts` — TEKS data for dropdowns |
| **QM-TEKS-07** | Error Handling / Success Criteria | API and UI errors; structured output |

## 3. Test strategy (risk-based, test pyramid)

### 3.1 Risk tiers (for prioritization)

| Tier | Examples | Primary layers |
|------|----------|----------------|
| **Critical** | Auth bypass, session fixation, IDOR on others’ MCQs, credential exposure | Unit + integration + UI + WSTG-aligned checks |
| **High** | Validation bypass on MCQ/TEKS payloads, broken access on `/api/mcqs/*` | Unit + integration |
| **Medium** | Pagination/search edge cases, boolean SQLite quirks (see MCQ_CRUD PRD), TEKS dialog UX | Integration + UI |
| **Lower** | Cosmetic UI, non-blocking copy | UI selective / manual |

### 3.2 Test pyramid (distribution)

```
        ┌─────────────────────┐
        │ UI / Playwright E2E │  Few — smoke & critical journeys (Phase 3b — future)
        ├─────────────────────┤
        │ Postman + Newman    │  APIs, auth cookies, contracts
        ├─────────────────────┤
        │ Vitest unit         │  Services, validation, mocks
        └─────────────────────┘
```

**Rule**: Highest risk first in automation backlog; do not duplicate the same assertion at every layer unless risk warrants it (e.g. authz checked in integration and spot-checked in UI).

### 3.3 Security as a cross-cutting thread (not a one-off)

**Policy**: **Every phase (0 through 5)** includes **mandatory security requirements**. They are stated in two places: the **Security focus** column in the [§12](#12-implementation-phases-with-security-in-every-phase) overview table, and the **Security requirements (mandatory for this phase)** list under each phase in [§12.1](#121-written-tasks-by-phase). Completing a phase is not done until both functional **Tasks** and that phase’s **security requirements** are satisfied.

Security work is also layered as follows:

1. **Per-phase requirements (Phases 0–5)** — Each phase has its own OWASP-aligned **security requirements** mapped to [§8](#8-security-and-compliance-owasp-wstg) and the [OWASP WSTG](https://owasp.org/www-project-web-security-testing-guide/), scoped to that layer (readiness, unit, integration, UI, stabilization, consolidation).
2. **Phase 5 consolidation** — **Phase 5** adds a **full** WSTG pass, evidence, and sign-off; it **does not replace** security requirements in Phases 0–4.

No phase is “security-free.” Phase 5 deepens and audits what earlier phases started.

### 3.4 Unit test feature map (Phase 1)

**Active focus**: **Unit tests only**, using **Vitest** and [.cursor/rules/vitest-testing.mdc](.cursor/rules/vitest-testing.mdc) — colocated `lib/**/*.test.ts`. **Browser UI automation (Playwright)** is **not** in scope until the team finishes this unit baseline ([§5.3](#53-ui--playwright-phase-3b--not-started), [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap)).

**Rollout policy — one feature at a time**: Implement or extend **one feature row** below per change set (PR / ticket), bring it to **Done**, then take the next **Planned** item. Avoid parallel incomplete unit files for the same feature area.

| Feature area | QM IDs (see [§2](#2-requirement-ids-and-traceability)) | Primary code | Unit test file | Status |
|--------------|--------------------------------------------------------|--------------|----------------|--------|
| Session & crypto helpers | QM-AUTH-09 (extractable logic) | [lib/auth.ts](lib/auth.ts) | [lib/auth.test.ts](lib/auth.test.ts) | Done |
| MCQ service (CRUD, ownership, attempts) | QM-MCQ-05–08 | [lib/services/mcq-service.ts](lib/services/mcq-service.ts) | [lib/services/mcq-service.test.ts](lib/services/mcq-service.test.ts) | Done |
| TEKS / generation schema | QM-TEKS-05, QM-TEKS-07 | [lib/mcq-generation-schema.ts](lib/mcq-generation-schema.ts) | [lib/mcq-generation-schema.test.ts](lib/mcq-generation-schema.test.ts) | Done |
| User service | QM-AUTH-03 (as testable) | [lib/services/user-service.ts](lib/services/user-service.ts) | `lib/services/user-service.test.ts` | Planned |
| TEKS data / catalog helpers | QM-TEKS-06 | [lib/teks.ts](lib/teks.ts) | `lib/teks.test.ts` | Planned |
| Shared utilities | Cross-cutting | [lib/utils.ts](lib/utils.ts) | `lib/utils.test.ts` | Planned — only if non-trivial logic warrants tests |

**Readiness-only (not unit, not Playwright)**: [tests/ui/src/tests/quizmaker-critical-flows.spec.ts](tests/ui/src/tests/quizmaker-critical-flows.spec.ts) — env / `BASE_URL`; included in `npm run test:run` per [vitest.config.ts](vitest.config.ts).

### 3.5 Phase verification snapshot (session)

**Verification session — 2026-04-07** (full `npm run verify-phase1` … `verify-phase5` run for dashboard purposes; Phase 2 Newman with the app reachable at the Postman environment `baseUrl`).

**Tests generated in that session:** **0** new automated cases or files were added during the run; all figures below are **executions** of the existing suite.

**Vitest counts — single full gate (`npm run test:run`, as used inside `verify-phase1` / `verify-phase4` / `verify-phase5`):** **40** tests, **4** files — authoritative inventory for the colocated + UI-readiness patterns in [vitest.config.ts](vitest.config.ts). **`verify-phase3`** runs **3** tests in isolation under `tests/ui/` (those **3** are already included in the **40**).

**Vitest counts — complete phase script process (sequential `verify-phase1` → `verify-phase3` → `verify-phase4` → `verify-phase5`):** Vitest executes **40 + 3 + 40 + 40 = 123** test **invocations** across those steps (the same suites are re-run; **not** 123 unique tests). **Phase 2** (`verify-phase2`) is **Newman** only (HTTP assertions) — **not** part of the 40 or 123 Vitest figures.

| Phase | Command | Layer | Vitest (session) | Notes |
|-------|---------|-------|------------------|-------|
| **1** | `npm run verify-phase1` | Unit gate + lint | **40** tests + `next lint` — Pass | Full `vitest.config.ts` include set |
| **2** | `npm run verify-phase2` | Integration (Newman) | — (not Vitest) — Pass | Requires running app at `baseUrl` ([tests/postman/environments/mock-openai.postman_environment.json](tests/postman/environments/mock-openai.postman_environment.json)) |
| **3** | `npm run verify-phase3` | UI tree (Vitest only) | **3** tests — Pass | `tests/ui` subset |
| **4** | `npm run verify-phase4` | Stabilization | **40** tests + lint — Pass | Same Vitest scope as Phase 1 |
| **5** | `npm run verify-phase5` | Automated prereqs | **40** tests + lint + Postman README — Pass (automated only) | Exit 0 ≠ Phase 5 program closeout; see [§13.6](#136-phase-5-program-closeout--senior-qa-assurance) |

## 4. Conventions and repository structure

Aligned with [docs/TEST_CASE_GUIDE.MD](docs/TEST_CASE_GUIDE.MD):

| Layer | Location | Rules file |
|-------|----------|------------|
| **Unit** | Colocated: `lib/**/*.test.ts` (next to source) | [vitest-testing.mdc](.cursor/rules/vitest-testing.mdc) |
| **Integration** | e.g. `tests/integration/<feature>/`, Postman collections under `tests/postman/` (or team-agreed path) | [APITesting-Postman.mdc](.cursor/rules/APITesting-Postman.mdc) |
| **UI / E2E** | `tests/ui/` (readiness today); Playwright specs when Phase 3b starts — see [playwright-testing.mdc](.cursor/rules/playwright-testing.mdc) | [playwright-testing.mdc](.cursor/rules/playwright-testing.mdc) |

**Metadata (required for new and updated tests)** — Per [docs/TEST_CASE_GUIDE.MD](docs/TEST_CASE_GUIDE.MD) **Global Conventions** and **Example Test Header**, each **new or materially updated** automated test file MUST include a YAML front matter block or equivalent leading comment with at least:

- `@type` (unit | integration | ui)
- `@module`, `@risk`, `@requirement` (use QM-* / E2E-* IDs from [§2](#2-requirement-ids-and-traceability))
- `@assumptions` (where relevant)
- `@success_criteria`, `@tags`

Postman collections: include matching documentation in the collection description, folder descriptions, or `tests/postman/README.md` where file-level headers do not apply.

**Grandfathering**: Existing test files without headers remain valid until edited; then add headers as part of that change (see [Exceptions register](#exceptions-register)).

**Exception (this phase)**: The guide recommends disposable data and cleanup; **this program defers cleanup** — see [§9.3](#93-test-data-cleanup-deferred).

### 4.1 Created structure (target layout)

This is the **intended directory layout** for automated tests and related artifacts. Create missing folders when executing [§12.1](#121-written-tasks-by-phase) (Phases 0–3). **Unit** tests stay next to source; **integration** and **UI** tests live under `tests/`. File names in `tests/postman/` match [Appendix A](#appendix-a--suggested-postman-collection-names-illustrative); the Playwright entry matches [Appendix B](#appendix-b--suggested-playwright-file-illustrative).

```
./                                      # repository root (clone name may differ, e.g. quizmaker-app-QA)
├── lib/
│   └── **/*.test.ts                    # Vitest unit tests (colocated with modules under lib/)
├── tests/
│   ├── integration/                    # optional: shared fixtures, helpers, README
│   │   └── README.md                   # optional: notes for integration setup
│   ├── postman/
│   │   ├── collections/
│   │   │   ├── postman-auth-integration.json
│   │   │   ├── postman-mcq-crud-integration.json
│   │   │   └── postman-teks-generate-integration.json
│   │   └── environments/               # Newman env JSON (see Phase 0 tasks)
│   │       ├── mock-openai.postman_environment.json
│   │       └── live-openai.postman_environment.json
│   └── ui/
│       ├── src/
│       │   ├── base/                   # fixtures / base page (Playwright — Phase 3b)
│       │   ├── pages/                  # Page Object Model classes
│       │   └── tests/
│       │       └── quizmaker-critical-flows.spec.ts
│       ├── config/
│       └── reports/                    # generated UI reports; typically gitignored
├── vitest.config.ts                    # Vitest configuration (repo root)
└── kimberly_test_plan.md               # this test plan (repo root)
```

**Notes**

- **Secrets**: Do not commit real API keys or session tokens inside `environments/` or collections; use placeholders and local or team-agreed secure storage (see **Security requirements (mandatory for this phase)** under Phase 0 in [§12.1](#121-written-tasks-by-phase)).
- **Cookie jars** (Newman): if used, keep outside version control or list in `.gitignore` per [APITesting-Postman.mdc](.cursor/rules/APITesting-Postman.mdc).
- **`tests/integration/`**: Optional unless the team adds non-Postman integration helpers; Postman collections remain the primary HTTP integration surface per this plan.
- **`quizmaker-test-artifacts/`** (if present): Not part of the canonical layout in this plan — may duplicate sample tests or configs; exclude from `tsc` / tooling scope or remove when consolidating ([§10.2](#102-coverage-gaps)).

## 5. Tooling by layer

### 5.1 Unit — Vitest

- Commands: `npm test`, `npm run test:run`, `npm run test:ui` ([package.json](package.json))
- Mock D1 and externals per [vitest-testing.mdc](.cursor/rules/vitest-testing.mdc); `beforeEach(() => vi.clearAllMocks())`
- No real network or D1 in unit tests

### 5.2 Integration — Postman + Newman

- Collections exercise HTTP APIs **independently of UI** ([APITesting-Postman.mdc](.cursor/rules/APITesting-Postman.mdc))
- **Newman CLI**: Install as a project **devDependency** (`newman`; optional `newman-reporter-htmlextra` for HTML reports) and run via **`npx newman`** after `npm install`, or use a globally installed `newman` — see [tests/postman/README.md](tests/postman/README.md). The [package.json](package.json) may list these when Phase 0/2 land; until then, `npx newman` without a local install still works if Newman is available on `PATH`.
- Run: `npx newman run <collection>.json -e <env>.json` (reporters e.g. `junit`, `htmlextra` per guide)
- **Verify actual route implementations** before assertions — POST vs GET response shapes may differ ([APITesting-Postman.mdc](.cursor/rules/APITesting-Postman.mdc))
- **Cookies**: Prefer Postman cookie jar in GUI; in Newman use documented manual `Cookie` header fallback if jar is unreliable
- **Boolean fields**: SQLite may return booleans inconsistently — use flexible assertions in Postman tests

### 5.3 UI — Playwright (Phase 3b — not started)

- **Playwright** for browser E2E when Phase 3b begins — see [.cursor/rules/playwright-testing.mdc](.cursor/rules/playwright-testing.mdc). **Selenium is not used**; Playwright is **not** added to the repo until Phase 3b.
- **Today**: No Playwright dependency in [package.json](package.json); [§3.4](#34-unit-test-feature-map-phase-1) unit work uses **Vitest** only. Playwright will typically use **`@playwright/test`** as a separate runner from Vitest.
- Page Object or fixture patterns; stable locators (`data-testid` / roles). Session: per-test login for auth flows; **`QUIZMAKER_OPENAI_LIVE=false`** for mock TEKS in automation ([§6](#6-openai-feature-flag-quizmaker_openai_live)).

## 6. OpenAI feature flag (`QUIZMAKER_OPENAI_LIVE`)

**Goal**: Limit OpenAI API usage during automated runs while allowing **live** calls during initial manual / exploratory testing.

| Value | Behavior |
|-------|----------|
| `QUIZMAKER_OPENAI_LIVE=true` or `1` | **Live**: `OPENAI_API_KEY` (e.g. from [.dev.vars](.dev.vars) locally, or Cloudflare env in deployment) is used; `POST /api/mcqs/generate-teks` calls OpenAI via existing `generateObject` path. |
| unset, `false`, or `0` | **Mock**: No OpenAI HTTP call; response is built by `buildMockTeksMcqResponse` in [lib/mcq-generation-schema.ts](lib/mcq-generation-schema.ts), then validated with `validateGeneratedMCQ`. |

**Resolution order**: Cloudflare `env.QUIZMAKER_OPENAI_LIVE` when available, else `process.env.QUIZMAKER_OPENAI_LIVE`. **Default if unset: mock (`false`)** — opt in to live API for development by setting the variable explicitly.

**Testing implications**:

- **Initial round (live)**: Set `QUIZMAKER_OPENAI_LIVE=true` in `.dev.vars` for real API verification; run `npm run verify-openai` per [AGENTS.md](AGENTS.md) when debugging AI issues.
- **Ongoing automation**: Set `QUIZMAKER_OPENAI_LIVE=false` (or omit) in Newman and automated test environments so Postman/Playwright do not consume tokens.

Typed in [cloudflare-env.d.ts](cloudflare-env.d.ts) as optional `QUIZMAKER_OPENAI_LIVE`.

## 7. Requirement → journeys → APIs → tests

### 7.1 QM-AUTH-* (Basic authentication)

**Key user journeys**

1. Register → session established → access protected app (e.g. MCQ area).
2. Login → session → protected routes.
3. Logout → session cleared → protected routes reject or redirect.
4. Unauthenticated access to `/api/mcqs` → 401 (per MCQ PRD).

**APIs / data flow**

- `POST /api/auth/signup` — body: `firstName`, `lastName`, `email`, `password` ([BASIC_AUTHENTICATION.md](docs/BASIC_AUTHENTICATION.md) § API Endpoints)
- `POST /api/auth/login` — `email`, `password`
- `POST /api/auth/logout`, `GET /api/auth/me` — per implementation reference
- Session cookie: HTTP-only, secure, SameSite; middleware protects `/mcqs/*` and `/` behavior per PRD

| ID | Unit (Vitest) | Integration (Postman/Newman) | UI (Playwright) |
|----|----------------|-------------------------------|---------------|
| QM-AUTH-05 | Validate signup payload schema / hashing **if** extracted to testable modules (only what exists in code) | Happy path signup; 409 duplicate email; 400 missing fields | Register form validation messages; redirect after success **ASSUMPTION**: redirect target matches app (e.g. `/mcqs`) |
| QM-AUTH-06 | Same for login helpers | Happy login; 401 bad password; 400 missing credentials | Login happy path; invalid credentials message |
| QM-AUTH-07 | N/A unless service extracted | Logout clears session; `me` returns user when logged in, 401 when not | After logout, navigate to `/mcqs` → login or redirect |
| QM-AUTH-10–11 | Middleware helpers unit-tested if isolated | Call protected API without cookie → 401; with cookie → 200 | Unauthenticated visit to `/mcqs` → redirect to `/login` **ASSUMPTION**: exact redirect URL per `middleware.ts` |

### 7.2 QM-MCQ-* (MCQ CRUD)

**Key user journeys**

1. List MCQs with pagination/search → open edit → save.
2. Create MCQ with 2–6 choices, exactly one correct → 201.
3. Delete MCQ with confirmation → 204 and list refresh.
4. Preview MCQ → submit attempt → response shows correctness; attempt persisted.

**APIs / data flow**

- `GET /api/mcqs?page&limit&search&created_by`
- `POST /api/mcqs` — choices array with `choice_text`, `is_correct`, `order_index`
- `GET/PUT/DELETE /api/mcqs/[id]`
- `POST /api/mcqs/[id]/attempts` — `selected_choice_id`; response shape per [MCQ_CRUD.md](docs/MCQ_CRUD.md) (note POST vs GET field naming in integration tests)

| ID | Unit (Vitest) | Integration (Postman/Newman) | UI (Playwright) |
|----|----------------|-------------------------------|---------------|
| QM-MCQ-05–06 | `mcq-service` validation, ownership, D1 mocks ([lib/services/mcq-service.test.ts](lib/services/mcq-service.test.ts) pattern) | CRUD + list + pagination; 401 without auth; 404 wrong id | Create flow; edit; delete confirm; table shows MCQ |
| QM-MCQ-07 | Attempt validation with mocked D1 | POST attempt; verify `is_correct` and structure | Preview page submit; result visible |
| QM-MCQ-08 | Cascade/ownership rules | PUT/DELETE another user’s MCQ → 404/403 per implementation | N/A or spot-check |

### 7.3 QM-TEKS-* (TEKS generation)

**Key user journeys**

1. Open MCQ create → “Generate with TEKS” → fill cascading TEKS fields → generate → form populated.
2. Invalid TEKS payload → 400 with details.
3. With `QUIZMAKER_OPENAI_LIVE=false`, generation returns deterministic mock without OpenAI.

**APIs / data flow**

- `POST /api/mcqs/generate-teks` — body fields per [TEKS_ALIGNED_MCQ.md](docs/TEKS_ALIGNED_MCQ.md) (`subject`, `grade_level`, `strand_name`, `standard_code`, `standard_description`, `topic_specifics`)
- Uses `lib/mcq-generation-schema.ts` for request/response validation

| ID | Unit (Vitest) | Integration (Postman/Newman) | UI (Playwright) |
|----|----------------|-------------------------------|---------------|
| QM-TEKS-04–05 | `TeksGenerationRequestSchema`, `validateGeneratedMCQ`, `buildMockTeksMcqResponse` | Live: `QUIZMAKER_OPENAI_LIVE=true` + valid key (manual smoke); Automation: `QUIZMAKER_OPENAI_LIVE=false`, assert mock prefix `[Mock]` and schema fields | Open dialog, select TEKS path, generate, assert form fields populated (mock mode in automated runs) |
| QM-TEKS-07 | Error path unit tests for validation | 400 on invalid body; 500 paths per implementation | Error toast or message on failure |

## 8. Security and compliance (OWASP WSTG)

Use the [OWASP WSTG](https://owasp.org/www-project-web-security-testing-guide/) as the organizing framework. Prefer **versioned** scenario IDs (e.g. `WSTG-v42-...`) when citing a specific test in audit evidence. Below, **category** names align with WSTG chapters (Authentication, Session Management, Authorization, Input Validation, etc.).

### 8.0 WSTG scope vs automation layers (reference)

**Purpose (living document):** This subsection records **how** the [OWASP WSTG](https://owasp.org/www-project-web-security-testing-guide/) relates to QuizMaker’s **layers** (unit, integration, UI, manual consolidation). It is **reference text only** — it does **not** change requirements on existing tests or product code; it exists so reviewers see **scope boundaries** and **improvement areas** in one place.

**What the WSTG is:** A broad web application security testing resource. Scenarios use identifiers such as `WSTG-<category>-<number>`; OWASP recommends **versioned** references (e.g. `WSTG-v42-...`) when citing specific scenarios so evidence stays stable across guide versions ([how to reference WSTG scenarios](https://owasp.org/www-project-web-security-testing-guide/)). The guide spans many categories (information gathering, configuration, authentication, session management, authorization, input validation, transport, APIs, client-side behavior, business logic, etc.). **Not every scenario is representable as an isolated unit test.**

**What build-time Vitest proves (see [§10.5](#105-living-implementation-status-repository-reality)):** `npm run build` / `preview` / `deploy` run **`npm run test:run`** — the **unit- and readiness-test** slice of security-relevant behavior (e.g. schema rejection, service-layer ownership predicates, session helper behavior) that maps to **parts** of [§8.1](#81-mapping--authentication--session-qm-auth-02-qm-auth-09-qm-auth-10)–[§8.3](#83-mapping--input-validation--injection-qm-auth-02-qm-mcq-08-qm-teks-05). That is **not** a claim of **full** WSTG coverage.

**What other layers cover:** **Integration** ([§12.1](#121-written-tasks-by-phase) Phase 2) — HTTP authn/authz, IDOR, cookies, safe error bodies. **UI / browser** ([§12.1](#121-written-tasks-by-phase) Phase 3b; gap in [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap)) — redirects, HTTPS targets, error UI. **Stabilization** ([§12.1](#121-written-tasks-by-phase) Phase 4) — keep those assertions from regressing. **Phase 5** — full [§8](#8-security-and-compliance-owasp-wstg) walk, versioned `WSTG-*` mapping where feasible, evidence and [§13.6](#136-phase-5-program-closeout--senior-qa-assurance) sign-off.

**Stricter local gate (optional vs build):** `npm run test:ci` / `npm run verify-phase4` add **`next lint`** — still not a substitute for WSTG breadth; see [§10.5](#105-living-implementation-status-repository-reality).

**Areas for improvement (documentation / process — not automatic code or test changes):**

| Area | Note |
|------|------|
| **Versioned WSTG IDs in tickets / evidence** | [§10.2](#102-coverage-gaps) — scenarios not enumerated one-by-one; strengthen over time by attaching explicit `WSTG-v…` IDs to test cases or review notes. |
| **HTTP- and browser-only themes** | Tables in [§8.4](#84-mapping--api--transport) mark **N/A** at unit for TLS, live cookie flags, etc.; improvement is **evidence** from Newman/Playwright/staging, not more unit tests alone. |
| **Phase 3b gap** | [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap) — browser WSTG-aligned checks remain **open** until Playwright smoke exists. |
| **Phase 5 consolidation** | Manual WSTG pass and tests→WSTG matrix still **required** for program-level security sign-off; `verify-phase5` is **prerequisites only** ([§12.1](#121-written-tasks-by-phase) Phase 5, [§13.6](#136-phase-5-program-closeout--senior-qa-assurance)). |
| **External messaging** | Avoid implying **“OWASP compliance”** from **Vitest-on-build alone**; accurate phrasing is **WSTG-aligned controls** across layers plus **Phase 5 traceability**. |

### 8.1 Mapping — authentication & session (QM-AUTH-02, QM-AUTH-09, QM-AUTH-10)

| WSTG theme | Examples (illustrative) | Unit | Integration | UI |
|------------|-------------------------|------|-------------|-----|
| **Authentication testing** | Weak lockout not required by PRD — **ASSUMPTION**: document if absent | Password validation rules in code | Login rate / error handling **if** implemented | Login error does not reveal which field failed **ASSUMPTION** |
| **Session management** | Token structure not exposed to client scripts | Session signing helpers **if** unit-extractable | Cookie flags: `HttpOnly`, `Secure`, `SameSite` on `Set-Cookie` | Session: logout invalidates server session (see Postman guide: server-side logout for “no session” tests) |

### 8.2 Mapping — authorization & access control (QM-MCQ-08, QM-AUTH-10)

| WSTG theme | Examples | Unit | Integration | UI |
|------------|----------|------|-------------|-----|
| **Authorization / IDOR** | User A cannot read/write User B’s MCQ | Ownership checks in service | `GET/PUT/DELETE` with A’s cookie on B’s id | Attempt to open edit URL for another user’s MCQ |

### 8.3 Mapping — input validation & injection (QM-AUTH-02, QM-MCQ-08, QM-TEKS-05)

| WSTG theme | Examples | Unit | Integration | UI |
|------------|----------|------|-------------|-----|
| **Input validation** | Oversized strings, wrong types | Zod/schema rejection | 400 with safe body | Client shows validation |
| **SQLi** (D1 prepared statements) | Malicious `search` or `id` | N/A at SQL string level if only prepared APIs used | Fuzz query params; expect no 500 / no data leak | N/A |

### 8.4 Mapping — API & transport

| WSTG theme | Examples | Unit | Integration | UI |
|------------|----------|------|-------------|-----|
| **TLS / channel** | HTTPS in staging/prod | N/A | Newman against HTTPS base URL | Playwright against HTTPS |
| **Error handling / information disclosure** | Generic 500 messages | N/A | No stack traces or secrets in JSON | No sensitive details in UI alerts |

### 8.5 OpenAI / secrets (QM-TEKS-04)

- **ASSUMPTION**: Responses must not echo `OPENAI_API_KEY`; integration tests assert response bodies contain no key material.
- Mock mode (`QUIZMAKER_OPENAI_LIVE=false`) removes external attack surface for bulk automation.

## 9. Explicit exclusions (this phase)

### 9.1 Performance test strategy

**Excluded.** Will be added in a later phase (load, budgets, profiling).

### 9.2 Accessibility test strategy

**Excluded** as a **named strategy** in this document. Note: [playwright-testing.mdc](.cursor/rules/playwright-testing.mdc) mentions axe-core optionally; no commitment to A11y scope in **this** plan until the follow-up phase.

### 9.3 Test data cleanup — deferred

[docs/TEST_CASE_GUIDE.MD](docs/TEST_CASE_GUIDE.MD) marks disposable data and cleanup as **REQUIRED** for integration tests in general. **This project phase**: **no automated cleanup** — test accounts and MCQ rows may persist after runs. Track test data with identifiable prefixes when creating via API/UI to simplify **future** teardown. Revisit in a later phase.

## 10. Assumptions, coverage gaps, and risks

### 10.1 Documented assumptions

| # | Assumption |
|---|------------|
| A1 | Redirect URLs after login/signup match current `middleware.ts` / app routes (verify in implementation). |
| A2 | Error messages for auth do not distinguish “unknown email” vs “bad password” unless PRD explicitly requires it. |
| A3 | Newman CLI is the intended “Postman CLI” (not a separate “Newton” product). |
| A4 | Future Playwright layout follows [.cursor/rules/playwright-testing.mdc](.cursor/rules/playwright-testing.mdc) (Page Objects / fixtures, `tests/ui/` or agreed `tests/e2e/`). **Unit tests** use **Vitest** ([§3.4](#34-unit-test-feature-map-phase-1)); Playwright typically uses **`@playwright/test`** — see [§5.3](#53-ui--playwright-phase-3b--not-started). |

### 10.2 Coverage gaps

| Gap | Risk | Mitigation |
|-----|------|------------|
| No E2E suite yet | High regression risk on journeys | Phase Playwright smoke after integration baselines; **Phase 3b** gap tracked in [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap) |
| PRD vs code drift | Medium | Re-read route handlers when integration tests fail |
| OWASP scenarios not enumerated one-by-one | Medium | Map each release to explicit WSTG IDs in test case tickets |
| No cleanup | Medium data clutter | Future phase; use prefixed test data |
| `quizmaker-test-artifacts/` duplicate or stray test files | Low–medium (noisy `tsc`, duplicate maintenance) | Exclude in `tsconfig`; delete or merge into canonical `lib/**/*.test.ts` and `tests/` |

### 10.3 Risk assessment (summary)

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Newman cookie jar differs from Postman GUI | Auth integration flaky | Medium | Manual cookie injection per APITesting-Postman.mdc |
| SQLite boolean representation | Wrong assertions | Medium | Flexible boolean checks in Postman and Vitest |
| Accidental live OpenAI in automated runs | Cost / rate limits | Low | Default mock; set `QUIZMAKER_OPENAI_LIVE=false` in automation env (see [§11.1](#111-backlog--continuous-integration-deferred) if future pipeline work adds hosted runners) |
| IDOR on MCQs | High | Low | Priority integration + UI spot tests |

### 10.4 Test findings — Phase 3b (planned checkpoint and gap)

**Status:** **OPEN** — Playwright **smoke** automation for [§12.3](#123-critical-e2e-user-flows-phase-3) is **not** implemented yet. Phase **3a** (readiness Vitest under `tests/ui/`) can pass independently; Phase **3b** remains a **documented gap** until Playwright-backed browser flows exist.

#### Where the gap is

| Area | Finding |
|------|---------|
| **Repository** | No Playwright / `@playwright/test` in [package.json](package.json) yet; [tests/ui/README.md](tests/ui/README.md) documents future browser automation. |
| **Entry file** | [Appendix B](#appendix-b--suggested-playwright-file-illustrative) / `tests/ui/src/tests/quizmaker-critical-flows.spec.ts` holds **readiness** tests only (`BASE_URL` / env), not **E2E-AUTH-01**, **E2E-MCQ-01**, **E2E-MCQ-03**, **E2E-TEKS-01** in a real browser. |
| **Requirements** | Browser-level coverage for **QM-AUTH-08**, **QM-MCQ-04**, **QM-TEKS-02–03** ([§12.1](#121-written-tasks-by-phase) Phase 3 **3b**) is **not** automated. |
| **Security themes** | [§12.1](#121-written-tasks-by-phase) Phase 3 **Security requirements** that need a browser (logout redirect, HTTPS targets, error UI) are **pending** validation via **3b**. |

#### Planned checkpoint (until Playwright smoke exists)

Use this as the **explicit hold** on Phase 3b sign-off; do not treat Phase 3 as fully complete until the gap is closed or formally accepted.

- [ ] **Dependency & layout**: Add Playwright (`@playwright/test`) per [.cursor/rules/playwright-testing.mdc](.cursor/rules/playwright-testing.mdc); fixtures + Page Objects under `tests/ui/` (or `tests/e2e/`) as in [§4.1](#41-created-structure-target-layout).
- [ ] **Smoke automation**: Implement minimum smoke set — **E2E-AUTH-01**, **E2E-MCQ-01**, **E2E-MCQ-03**, **E2E-TEKS-01** — with **`QUIZMAKER_OPENAI_LIVE=false`** (mock) unless a run explicitly targets live OpenAI ([§6](#6-openai-feature-flag-quizmaker_openai_live)).
- [ ] **Command**: Document `npm run verify-phase3` extension or a dedicated script for browser runs; `HEADLESS` / `BASE_URL` documented in [tests/ui/README.md](tests/ui/README.md).
- [ ] **Evidence**: Green run on a team-agreed base URL (local or staging) recorded in review notes.

#### Where the gap will be reviewed once implemented

| When | Where to close / approve |
|------|---------------------------|
| **Implementation complete** | [§13.4](#134-phases-2-5) Phase 3 — **Checkpoint (3b)** and **Security checkpoint** (browser logout, HTTPS policy, error UI). |
| **Plan alignment** | [§12.1](#121-written-tasks-by-phase) Phase 3 — **Checkpoints** for **Phase 3b**; update this **§10.4** row to **CLOSED** or move to document history. |
| **Definition of done** | [§13.5](#135-final-verification-before-execution) **Part B** (B6 Playwright) and **Part C** (C4b). |
| **Traceability** | [§12.3](#123-critical-e2e-user-flows-phase-3) flow IDs marked covered in test code or review appendix. |
| **Repo docs** | [tests/ui/README.md](tests/ui/README.md) — replace “not installed” with run instructions and ownership. |

**Note:** Phase 4 ([§12.1](#121-written-tasks-by-phase) Phase 4) does **not** require Phase 3b to be finished; stabilization gates remain `npm run verify-phase4` for local quality only.

### 10.5 Living implementation status (repository reality)

This subsection is the **living record** of test tooling and build integration **as implemented in the repository**, plus **issues encountered** during test-program work. It complements strategy sections ([§3](#3-test-strategy-risk-based-test-pyramid), [§12](#12-implementation-phases-with-security-in-every-phase)) with factual status. **Update this subsection** when scripts, test counts, or gates change.

#### Vitest inventory (current)

| Suite / area | Path (representative) | Role |
|--------------|------------------------|------|
| MCQ service | `lib/services/mcq-service.test.ts` | CRUD, ownership, attempts; `@/lib/d1-client` mocked |
| TEKS / generation schema | `lib/mcq-generation-schema.test.ts` | Zod validation, mock TEKS response shape |
| Auth session helpers | `lib/auth.test.ts` | `signSession` / `verifySession` (including negative cases) |
| UI readiness | `tests/ui/src/tests/quizmaker-critical-flows.spec.ts` | Env / `BASE_URL` checks — **not** browser Playwright E2E |

**Runner config**: [vitest.config.ts](vitest.config.ts) — `include`: `lib/**/*.test.ts`, `tests/ui/**/*.test.ts`, `tests/ui/**/*.spec.ts`; `quizmaker-test-artifacts/**` excluded.

**Last verified scale** (representative run): **40** tests across **4** files; **`npm run test:run`** is the unit gate.

#### Build, preview, and deploy — unit tests at build time

[package.json](package.json) wires **Vitest** into production and Cloudflare paths so a failing unit suite **blocks** the bundle:

| npm script | Sequence (simplified) | ESLint in path? |
|------------|-------------------------|-----------------|
| **`npm run build`** | `npm run test:run` → `next build` | **No** |
| **`npm run preview`** | `npm run test:run` → `opennextjs-cloudflare build` → `opennextjs-cloudflare preview` | **No** |
| **`npm run deploy`** | `npm run test:run` → `opennextjs-cloudflare build` → `opennextjs-cloudflare deploy` | **No** |

**Stricter local quality** (tests + lint): **`npm run test:ci`** or **`npm run verify-phase4`** — use these for parity with full static analysis; they are **not** identical to `npm run build` because `build` does not run `next lint`.

**Not gated by `build` / `preview` / `deploy`**: Postman/Newman (needs a **running** app and base URL — see [tests/postman/README.md](tests/postman/README.md)), Playwright **Phase 3b** flows ([§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap)), and **Phase 5** manual WSTG / signed evidence ([§13.6](#136-phase-5-program-closeout--senior-qa-assurance)).

#### Phase verification scripts (package.json)

| Script | Automation scope |
|--------|-------------------|
| `verify-phase1` … `verify-phase3` | Per-phase scaffolding / Vitest checks (`scripts/` — e.g. [verify-phase1.mjs](scripts/verify-phase1.mjs)) |
| `verify-phase4` | `npm run test:run` + `npm run lint` — Phase 4 stabilization gate |
| `verify-phase5` | `verify-phase4` + presence of Postman maintainer README; prints manual §13.6 checklist — **not** WSTG sign-off |
| `test:newman` / `test:newman:*` | Newman collections — **manual** invocation against a live base URL |
| `verify-openai` | OpenAI API key check (no completion tokens) |

#### Phase 5 human closeout artifacts

| Artifact | Purpose |
|----------|---------|
| [docs/PHASE5_MANUAL_SIGNOFF.template.md](docs/PHASE5_MANUAL_SIGNOFF.template.md) | Checklist, §13.5 Parts A–E tables, **human signature** block |
| [§13.6](#136-phase-5-program-closeout--senior-qa-assurance) | Procedure for senior QA assurance at Phase 5 closeout |

#### Issues and friction log (test-program construction)

These items were **observed during** test tooling and integration work; they are **not** necessarily product defects. Use for onboarding and troubleshooting.

| Topic | What we saw | How to proceed |
|-------|-------------|----------------|
| Newman without reachable app | Requests fail with connection refused (`ECONNREFUSED`) | Start the app (`npm run dev` or `npm run preview`) and set `baseUrl` in Newman env to match |
| TEKS Newman: mock vs live OpenAI | Assertions (e.g. mock title prefix) fail when `QUIZMAKER_OPENAI_LIVE` / env does not match collection intent | Use [tests/postman/environments/mock-openai.postman_environment.json](tests/postman/environments/mock-openai.postman_environment.json) for stable mock TEKS; align flag with [§6](#6-openai-feature-flag-quizmaker_openai_live) |
| ESLint in sandboxed / restricted environments | `next lint` may error with filesystem `EPERM` | Run `npm run lint` or `npm run test:ci` in a full local environment (not a minimal sandbox) |
| npm “Unknown env config `devdir`” | Warning from npm / user `npmrc` | Informational; no change to test outcome |
| Vitest `lib/auth.test.ts` stderr | `InvalidCharacterError` / session verification log on **malformed** token test | Expected behavior for negative test; suite passes |
| Cloudflare **preview** URL | Wrangler local preview typically **`http://localhost:8787`** after `npm run preview` | Port may vary if occupied — read terminal output |

#### Summary status (phases vs plan)

| Phase / theme | Implementation status in repo |
|---------------|-------------------------------|
| Phase 0–1 | Vitest suites + config; colocated tests under `lib/` |
| Phase 2 | Postman collections + Newman envs under `tests/postman/` — run separately from `build` |
| Phase 3a | UI readiness Vitest under `tests/ui/` |
| Phase 3b | **OPEN** — Playwright smoke not implemented ([§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap)) |
| Phase 4 | `verify-phase4` / `test:ci`; **`build` / `preview` / `deploy` include `test:run`** |
| Phase 5 | Scripts + template + §13.6; **manual** WSTG/evidence/sign-off still required for program closeout |
| Hosted CI | **Deferred** ([§11.1](#111-backlog--continuous-integration-deferred)); optional `.github/workflows` is team discretion |

**Checkpoint outcomes** (✅ Pass · ✅ Partial · ❌ Not passed): [§13 — How the test runs went](#how-the-test-runs-went-read-this-first), [§13.0](#130-phase-checkpoint-status-living-dashboard), and **Status (verified)** under each phase in [§13.2](#132-phase-0--readiness)–[§13.4](#134-phases-2-5).

## 11. Reporting, local test commands, and bug handling

This section describes **commands and practices** for the current test suite. **Automated connection to a hosted continuous integration service** is **out of scope** for this plan until the team pulls work from [§11.1](#111-backlog--continuous-integration-deferred).

- **Lint**: `npm run lint`
- **Unit**: `npm run test:run`
- **Integration**: Newman with JUnit export per [APITesting-Postman.mdc](.cursor/rules/APITesting-Postman.mdc) (run locally or against an agreed base URL)
- **UI**: Playwright with `HEADLESS=true` for unattended local or team runs per Playwright guide

**Bugs found by tests** (feature defects): follow [docs/TEST_PLAN_TEMPLATE.md](docs/TEST_PLAN_TEMPLATE.md) / TEST_CASE_GUIDE — document in test plan **Bugs** section; do not “fix” by weakening tests; do not change product code in QA-only workstreams without agreement.

### Test commands quick reference

- **`npm run lint`** — ESLint
- **`npm run test:run`** — Vitest (unit + configured tests under `tests/ui/` per `vitest.config.ts`)
- **`npm run build`** — **`npm run test:run` then `next build`** — unit tests must pass before the Next.js production build ([§10.5](#105-living-implementation-status-repository-reality))
- **`npm run preview`** — **`npm run test:run` then OpenNext Cloudflare build + local preview** (typical URL `http://localhost:8787`) — same unit gate before worker bundle
- **`npm run deploy`** — **`npm run test:run` then OpenNext build + Cloudflare deploy** — same unit gate before deploy
- **`npm test`** / **`npm run test:ui`** — Vitest watch / UI mode (local)
- **`npm run verify-phase4`** — Local Phase 4 checkpoint: `npm run test:run` then `npm run lint` (see [§12.1](#121-written-tasks-by-phase) Phase 4 and [§13.4](#134-phases-2-5))
- **`npm run verify-phase5`** — **Automated prerequisites only** for Phase 5: runs `verify-phase4` and verifies [tests/postman/README.md](tests/postman/README.md) exists (cookie/Newman maintainer docs). **Human closeout** (WSTG, evidence, §13.5 assurance, signatures) is [§13.6](#136-phase-5-program-closeout--senior-qa-assurance) + [docs/PHASE5_MANUAL_SIGNOFF.template.md](docs/PHASE5_MANUAL_SIGNOFF.template.md). Does **not** perform a WSTG walk or replace signed evidence — see [§12.1](#121-written-tasks-by-phase) Phase 5 and [§13.4](#134-phases-2-5) Phase 5. On failure, script stderr identifies the Phase 4-equivalent gate vs documentation check.
- **`npm run verify-openai`** — Confirms `OPENAI_API_KEY` from `.dev.vars` (no completion tokens); use when working on TEKS/OpenAI ([AGENTS.md](AGENTS.md))
- **`npx newman run <collection>.json -e <env>.json`** — Integration/API tests (see [§5.2](#52-integration--postman--newman), [tests/postman/README.md](tests/postman/README.md))

### 11.1 Backlog — Continuous integration (deferred)

**Status**: Backlogged — **no** committed plan in this document for wiring GitHub Actions, other hosted runners, or PR gates for this repo.

The following items are **preserved for future review** when the team chooses to implement continuous integration (e.g. on PR merge, scheduled runs, or deployment branches):

| Topic | Notes for a future design review |
|-------|----------------------------------|
| **Quality job on push/PR** | Run `npm ci`, `npm run test:run`, `npm run lint` on agreed branches; align Node version and lockfile policy with [package.json](package.json). |
| **Optional Newman against a deployed URL** | Requires a non-secret variable for base URL, test-account secrets, mock TEKS (`QUIZMAKER_OPENAI_LIVE=false`), and session/cookie strategy (see Postman README). |
| **Artifact uploads** | JUnit XML from Newman or other reporters; retention policy. |
| **Parity with local** | Whether `npm run verify-phase4` (or `npm run test:ci` if present in [package.json](package.json)) should mirror the hosted job exactly. |
| **UI automation in hosted runners** | Browsers, `HEADLESS`, Playwright install, and secrets for test users. |
| **Smoke vs full regression** | Split jobs, tag filters (e.g. Vitest version capabilities), or path-based subsets. |
| **Secrets injection** | Repository/org secrets vs variables; no credentials in committed JSON. |
| **Flake policy** | Retries, required checks, and merge blocking rules. |

**Related repo assets (informational, not part of this plan’s commitment)**: A workflow file may exist under `.github/workflows/`; the team decides when it is enabled, required, and maintained. Postman docs may still describe optional staging URLs — treat those as implementation notes, not obligations of this test plan until CI is adopted.

#### When this backlog is implemented — reconcile with TEST_CASE_GUIDE.MD

When moving from backlog to **active** plan text (hosted runners, PR gates, or required checks):

1. **Merge** [docs/TEST_CASE_GUIDE.MD](docs/TEST_CASE_GUIDE.MD) **CI/CD Integration Patterns** and **Quality Checks & CI Signals** with the table above: environment variables for local vs CI (`CI=true`, headless UI), dependency install policy, reporting artifacts, reproducibility, and metrics as the team adopts them.
2. **Parity**: Document explicitly whether `npm run verify-phase4` (or a renamed script) is the **local mirror** of the hosted quality job; align Node version and `npm ci` with [package.json](package.json).
3. **Update this document**: Add a version history row; move or summarize implemented rows from §11.1 into [§11](#11-reporting-local-test-commands-and-bug-handling) only after review — keep the **body** of the test plan free of stale CI detail by editing the backlog section into a short “implemented on (date)” pointer if desired.
4. **Observability / log noise** (verbose test `console.log`, lint/tooling messages during `next lint`): **not** part of CI adoption by default; track under separate test-hygiene work if the team prioritizes quieter logs. **No** change to Phase 4 scripts is implied by backlog implementation.

**Starting point**: Use the table in §11.1 as the checklist when the team is ready; the active plan remains CI-free until you promote items per step 3.

## 12. Implementation phases (with security in every phase)

Phases are ordered for **risk-based** delivery: establish tooling and contracts early, then unit depth, then HTTP integration, then browser E2E, then a **consolidated security** pass.

**Mandatory security in every phase (Phases 0–5)**:

- The **Security focus** column in the table below states the **security requirements theme** for each phase (OWASP / [§8](#8-security-and-compliance-owasp-wstg)).
- [§12.1](#121-written-tasks-by-phase) lists **concrete Security requirements (mandatory for this phase)** for Phases 0–5. A phase is **complete** only when both its **Tasks** and its **Security requirements** are done.
- **Phase 5** is still mandatory for security: it performs the **full** consolidation and evidence pass; it does **not** make Phases 0–4 optional for security.

| Phase | Name | Primary goal | Main requirements (see [§2](#2-requirement-ids-and-traceability)) | Security focus — **mandatory themes** for this phase (OWASP / [§8](#8-security-and-compliance-owasp-wstg)) |
|-------|------|----------------|---------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| **0** | **Readiness** | Environments, secrets layout, branch strategy for test artifacts | All (prep) | **Secrets & config**: no API keys or session material in committed Postman collections; `.gitignore` for cookie jars; document `QUIZMAKER_OPENAI_LIVE` and Newman env files ([§6](#6-openai-feature-flag-quizmaker_openai_live)). |
| **1** | **Unit (Vitest)** | Fast feedback on validation, services, schema; mocks only | QM-AUTH-*, QM-MCQ-*, QM-TEKS-* (logic layer) | **Input validation** (schema rejection), **authz logic** in services (ownership), **no live secrets** in tests; password/session helpers tested where extractable (QM-AUTH-09). |
| **2** | **Integration (Postman + Newman)** | HTTP contracts, cookies, status codes, IDOR | QM-AUTH-05–07, QM-MCQ-05–07, QM-TEKS-04–07 | **Authentication & session** (cookie flags, `Set-Cookie`), **authorization / IDOR** (cross-user IDs), **information disclosure** (no stack traces or keys in JSON), **injection** fuzz on query/body; TLS for non-local targets. |
| **3** | **UI / E2E (Playwright)** | Critical user journeys in a real browser | QM-AUTH-08, QM-MCQ-04, QM-TEKS-02–03 | **Session management** in UI (logout, protected routes), **client-side** error handling without leaking secrets, **transport** (HTTPS in staging/prod); align with [playwright-testing.mdc](.cursor/rules/playwright-testing.mdc) session strategy. |
| **4** | **Stabilization** | Flake reduction, tagging (`@smoke`), local quality gate (`npm run test:run`, `npm run lint`) | Cross-cutting | **Regression of security cases**: keep Phase 2–3 security assertions meaningful as suites evolve; Newman cookie fallbacks documented. |
| **5** | **Security consolidation** | Dedicated WSTG pass, evidence, sign-off | All, emphasis QM-AUTH-02, QM-AUTH-10, QM-MCQ-08, QM-TEKS-04 | **Full [§8](#8-security-and-compliance-owasp-wstg) sweep**: enumerate versioned `WSTG-*` scenarios where feasible; manual/exploratory for gaps; document residual risk in [§10](#10-assumptions-coverage-gaps-and-risks). |

### 12.1 Written tasks by phase

Each phase below has **Tasks** and **Security requirements (mandatory for this phase)**. The security requirements are **OWASP-aligned** (see [§8](#8-security-and-compliance-owasp-wstg)); completing the phase requires both lists.

#### Phase 0 — Readiness

**Tasks**

1. Agree on Postman/Newman folder layout (e.g. `tests/postman/`) and naming for collections.
2. Create Newman environment files with **variables only** (base URL, test user email/password placeholders, `QUIZMAKER_OPENAI_LIVE`) — store secrets in local env or team secure storage, not in committed JSON.
3. Add Newman environments for **`mock-openai`** and **`live-openai`** (or equivalent) per [§6](#6-openai-feature-flag-quizmaker_openai_live).
4. Document the Newman command(s) and reporters (`junit`, `htmlextra` per [APITesting-Postman.mdc](.cursor/rules/APITesting-Postman.mdc)).
5. Document `npm run verify-openai` from [AGENTS.md](AGENTS.md) for live OpenAI smoke work.
6. Add or verify `.gitignore` rules for cookie jars and exported env files that may contain session data.

**Security requirements (mandatory for this phase)**

1. Confirm no `OPENAI_API_KEY`, session cookies, or passwords are committed inside collections or repos.
2. Agree who owns rotation of test credentials and where they live (local vs team vault).
3. Review Postman sharing/export settings so secrets are not leaked in team exports.

#### Phase 1 — Unit (Vitest)

**Tasks**

1. Colocate `*.test.ts` next to sources per [§4](#4-conventions-and-repository-structure).
2. Cover auth-, MCQ-, and TEKS-related validation and services per [§7](#7-requirement--journeys--apis--tests) (minimum: MCQ service patterns, schema helpers, mocks for D1).
3. Use `beforeEach(() => vi.clearAllMocks())` and avoid real network/D1 per [vitest-testing.mdc](.cursor/rules/vitest-testing.mdc).
4. Add negative tests: invalid payloads, wrong choice counts, missing ownership where applicable.

**Security requirements (mandatory for this phase)**

1. Unit-test schema rejection for oversized or malformed input (TEKS request body, MCQ choices).
2. Unit-test ownership / authorization predicates in the service layer (no IDOR at logic level).
3. Ensure test code does not embed real API keys or production credentials.

#### Phase 2 — Integration (Postman + Newman)

**Tasks**

1. Build Postman collections for **auth** → **MCQ CRUD** → **generate-teks** (order respects session dependencies per [APITesting-Postman.mdc](.cursor/rules/APITesting-Postman.mdc)).
2. Assert status codes and response shapes **from actual route code** (POST vs GET field names may differ).
3. Implement cookie handling: Postman GUI jar first; Newman manual `Cookie` header fallback if needed.
4. Run collections against **`QUIZMAKER_OPENAI_LIVE=false`** for automation; optional manual run with live OpenAI.

**Security requirements (mandatory for this phase)**

1. Verify **401/403** on protected routes without a valid session; verify auth runs before “not found” where applicable.
2. Test **IDOR**: authenticated user A cannot read/update/delete user B’s MCQ (`id` in path).
3. Assert response bodies do not contain stack traces, `OPENAI_API_KEY`, or session secrets.
4. Optionally fuzz query/body parameters for injection-style inputs; expect safe 4xx/empty results, not 500 with data leak.

#### Phase 3 — UI / E2E (Playwright)

Phase 3 has **two separable tracks**: **3a — Readiness** (Vitest, no browser) and **3b — Playwright smoke** (real browser). Sign-off may record each independently; **full Phase 3** completion requires **both** unless the team explicitly documents a gap.

**Tasks — Phase 3a (readiness; Vitest only)**

1. Scaffold `tests/ui/` per [§4.1](#41-created-structure-target-layout) (config, env helpers, e.g. `BASE_URL` validation).
2. Add or maintain Vitest specs that validate **environment / URL configuration only** (no browser); these run under `npm run test:run` per `vitest.config.ts`.

**Tasks — Phase 3b (Playwright; browser)**

1. Implement the single Playwright entry point described in [Appendix B](#appendix-b--suggested-playwright-file-illustrative) (driver factory, Page Objects).
2. Automate flow IDs in **[§12.3](#123-critical-e2e-user-flows-phase-3)** (at minimum the **smoke** set: **E2E-AUTH-01**, **E2E-MCQ-01**, **E2E-MCQ-03**, **E2E-TEKS-01** with mock OpenAI).
3. Use Page Object Model and stable locators per [playwright-testing.mdc](.cursor/rules/playwright-testing.mdc).
4. Set `HEADLESS=true` / `CI=true` for unattended automated runs where applicable; document local headed debugging.

**Checkpoints (record separately)**

- [ ] **Phase 3a**: Readiness / env Vitest tests pass locally.
- [ ] **Phase 3b** (**planned checkpoint until Playwright smoke exists**): Playwright smoke suite passes on a team-agreed base URL. While **3b** is **not** implemented, the gap and review locations are recorded in [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap); sign-off may note **3a only** with **3b** explicitly **OPEN**.

**Security requirements (mandatory for this phase)**

1. After **logout**, confirm protected pages or deep links redirect to login (or return 401 for API-backed UI).
2. Run against **HTTPS** for staging/production targets (not only `http://localhost` if policy requires).
3. Confirm error UI does not expose internal IDs, stack text, or secrets from failed TEKS generation.

#### Phase 4 — Stabilization

**Tasks**

1. Establish a **repeatable local checkpoint**: `npm run test:run` and `npm run lint` (or `npm run verify-phase4`, which runs both in sequence). Hosted CI is deferred — see [§11.1](#111-backlog--continuous-integration-deferred).
2. Tag tests with `@smoke` vs full regression per team policy (see [§11.1](#111-backlog--continuous-integration-deferred) for future hosted-runner tag filtering).
3. Triage flakes: explicit waits, session setup, data prefixes (no automated cleanup in this program phase — [§9.3](#93-test-data-cleanup-deferred)).

**Security requirements (mandatory for this phase)**

1. Treat failing **security assertions** from Phases 2–3 as release blockers when severity is critical (auth bypass, IDOR), per team release policy.
2. Keep Newman cookie workaround documented in repo (README or collection README) for maintainers.

#### Phase 5 — Security consolidation

**Optional automated prerequisite** (local): `npm run verify-phase5` confirms the Phase 4 local gate plus Postman maintainer documentation ([§12.1](#121-written-tasks-by-phase) Phase 4 security item: cookie workaround documented). Exit 0 **does not** mean WSTG or evidence work is complete.

**Tasks**

1. Walk [§8](#8-security-and-compliance-owasp-wstg) against the running app; record **versioned** `WSTG-*` scenario IDs where possible.
2. Update [§10](#10-assumptions-coverage-gaps-and-risks) with any new gaps or accepted risks.
3. Optional: peer or security review of integration + UI evidence.

**Security requirements (mandatory for this phase)**

1. Complete the WSTG pass (auth, session, authorization, input validation, transport, error disclosure, OpenAI path per [§8.5](#85-openai--secrets-qm-teks-04)).
2. Produce a short evidence list (which tests map to which WSTG themes) for audit readiness.

### 12.2 How security repeats in each phase (summary)

Each row below maps to **mandatory security requirements** in Phases 1–3 and **Phase 5**; Phases 0 and 4 use the table in [§12](#12-implementation-phases-with-security-in-every-phase) and [§12.1](#121-written-tasks-by-phase).

| Layer / phase | Example security outcomes (requirements addressed in that phase) |
|-------|---------------------------|
| **Phase 0** | Secrets hygiene, `.gitignore`, no credential leakage in tooling (see §12.1 Phase 0). |
| **Phase 1 (Unit)** | Reject malicious/oversized input; enforce “one correct choice”; ownership predicates. |
| **Phase 2 (Integration)** | HTTP-level authn/authz; cookies; no secret echo; safe error bodies. |
| **Phase 3 (UI)** | Browser session behavior; no sensitive data in visible error copy; HTTPS. |
| **Phase 4 (Stabilization)** | Security regression discipline for prior phases; documented cookie workaround. |
| **Phase 5** | End-to-end WSTG traceability and audit evidence. |

### 12.3 Critical E2E user flows (Phase 3)

These are **major workflows** teachers use in the browser (**Phase 3b — Playwright** targets). **Phase 3a** (readiness) only proves config/env; it does **not** substitute for the flows below. They align with [docs/BASIC_AUTHENTICATION.md](docs/BASIC_AUTHENTICATION.md) (session and dashboard), [docs/MCQ_CRUD.md](docs/MCQ_CRUD.md) (standard MCQs), and [docs/TEKS_ALIGNED_MCQ.md](docs/TEKS_ALIGNED_MCQ.md) (TEKS-aligned generation). Use **`QUIZMAKER_OPENAI_LIVE=false`** (mock) for repeatable automation unless a run explicitly validates live OpenAI ([§6](#6-openai-feature-flag-quizmaker_openai_live)).

**Preconditions (typical)**: Valid teacher credentials; MCQ management under `/mcqs/*` after authentication. Prefer **E2E-AUTH-01** to establish a session before other flows, or perform an equivalent login inside a longer scenario.

#### Teacher authentication and dashboard

| Flow ID | Summary | Steps (high level) | Maps to |
|---------|---------|-------------------|---------|
| **E2E-AUTH-01** | **Teacher login to dashboard (MCQ home)** | Open `/login` → enter valid email/password → submit → land on **MCQ management** (e.g. `/mcqs` listing — **ASSUMPTION**: match current app redirect after login per `middleware` / app routes) | QM-AUTH-06, QM-AUTH-08, QM-AUTH-10 |

#### Standard (manual) MCQ flows

| Flow ID | Summary | Steps (high level) | Maps to |
|---------|---------|-------------------|---------|
| **E2E-MCQ-01** | **Create and save a standard MCQ** | From dashboard (`/mcqs`) → Create → fill title, question, 2–6 choices, mark one correct → save → return to list and **see the new MCQ** | QM-MCQ-04 (create UI), QM-MCQ-05 |
| **E2E-MCQ-02** | **Edit an existing MCQ** | From list → Edit → change title/question/choices → save → list or detail reflects changes | QM-MCQ-04, QM-MCQ-06 |
| **E2E-MCQ-03** | **Preview and submit an attempt** | Open Preview → select one choice → submit → **see correct/incorrect result** (and that the flow completes without error) | QM-MCQ-04 (preview), QM-MCQ-07 |
| **E2E-MCQ-04** | **Delete an MCQ** | From list actions → Delete → confirm → MCQ **no longer in list** | QM-MCQ-04, QM-MCQ-06, QM-MCQ-08 |
| **E2E-MCQ-05** | **Find MCQs in the list** | Use **search** (and pagination if many rows) → table shows matching items | QM-MCQ-04 (listing UX), QM-MCQ-05 (`search` query) |

#### Texas TEKS–aligned MCQ flows

| Flow ID | Summary | Steps (high level) | Maps to |
|---------|---------|-------------------|---------|
| **E2E-TEKS-01** | **Generate a TEKS-aligned MCQ and save** | `/mcqs/create` → **Generate with TEKS** → dialog: Subject → Grade → Strand → **Standard** → topic/specifics → Generate → form **pre-filled** → review → **Save** → MCQ appears in list | QM-TEKS-02–04, QM-MCQ-05 |
| **E2E-TEKS-02** | **Edit AI-filled content before publishing** | After generation, **change** title/question/choices → save → verify edits persisted (teacher control over AI output) | QM-TEKS-02, TEKS PRD “preview / edit” intent |
| **E2E-TEKS-03** | **Handle generation failure gracefully** | Force or simulate invalid/unavailable generation (e.g. validation error, API error with mock off not required if only mock automation) → user sees **clear error**; can still create manually | QM-TEKS-07 |

#### Smoke vs regression

- **Smoke (minimum)**: **E2E-AUTH-01**, **E2E-MCQ-01**, **E2E-MCQ-03**, **E2E-TEKS-01** (with mock OpenAI) — login to dashboard, create/list, preview/attempt, and TEKS generation path.
- **Regression**: Full set of flow IDs in this section on cadence agreed by the team.

## 13. Implementation plan (execution)

This section turns [§12](#12-implementation-phases-with-security-in-every-phase) into a **serial, reviewable rollout**: small phases, explicit checkpoints, and **no phase assuming a later phase is complete**. **Finish one layer cleanly** before starting the next (readiness → unit → integration → UI → stabilization → security consolidation).

**Execution cycle (every phase)**: **Plan** (scope for this phase only) → **Implement** → **Run checks** (checkpoint) → **Review** (peer or QA) → **Approve** (explicit sign-off) → **Merge** → then open the next phase.

**Bug policy** (aligned with [§11](#11-reporting-local-test-commands-and-bug-handling)): Failing tests that indicate a **product** bug are documented; tests are not weakened to match wrong behavior unless the **expectation** was wrong.

---

### How the test runs went (read this first)

**Icons** (scannable outcomes):

| Icon | Meaning |
|:----:|---------|
| ✅ **Pass** | Gate fully satisfied for the stated command or review. |
| ✅ **Partial** | Some checkpoints satisfied; others pending, waived, or manual (still tracked with a green check because work is **partially** on track). |
| ❌ **Not passed** | Required gate failed, or scope not implemented / not yet run. |

**At-a-glance — last known run**

| Phase | Scope | Result | What was run / evidence |
|:-----:|-------|:------:|-------------------------|
| **0** | Readiness / Postman layout | ✅ Pass | `tests/postman/` tree, envs, [tests/postman/README.md](tests/postman/README.md); no secrets in committed JSON |
| **1** | Vitest + UI readiness specs | ✅ Pass | `npm run test:run` — **40** tests, **4** files ([§10.5](#105-living-implementation-status-repository-reality)); `npm run lint` clean via `test:ci` / `verify-phase4` |
| **2** | Postman + Newman (HTTP) | ✅ Pass\* | `npm run test:newman` (or per-collection) **Pass** vs running app + [mock-openai.postman_environment.json](tests/postman/environments/mock-openai.postman_environment.json) — \***requires** `baseUrl` reachable ([§11](#11-reporting-local-test-commands-and-bug-handling)) |
| **3a** | UI readiness (Vitest only) | ✅ Pass | Included in `npm run test:run` (`tests/ui/` env/readiness) |
| **3b** | Playwright E2E smoke | ❌ Not passed | Playwright smoke **not** in repo — [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap) |
| **4** | Stabilization (quality gate) | ✅ Pass | `npm run verify-phase4` → `test:run` + `lint` |
| **5** | Security consolidation | ✅ Partial | ✅ Pass: automated `npm run verify-phase5` (prereq). ❌ Not passed: WSTG walk, evidence appendix, [§13.6](#136-phase-5-program-closeout--senior-qa-assurance) human sign-off |

---

### 13.0 Phase checkpoint status (living dashboard)

**Purpose**: One-page view of **Pass / Partial / Not passed** per phase from **commands actually run** (update when verification is re-run or scope changes). Per-checkpoint detail is under [§13.2](#132-phase-0--readiness)–[§13.4](#134-phases-2-5).

**Summary (same as table above, sortable reference)**

| Phase | Scope | Overall | How verified (last known) |
|-------|--------|---------|---------------------------|
| **0** | Readiness / Postman layout | ✅ **Pass** | `tests/postman/` tree, envs, README; no secrets in committed JSON |
| **1** | Vitest unit + UI readiness | ✅ **Pass** | `npm run test:run` — **40** tests, **4** files; `npm run lint` with `test:ci` / `verify-phase4` |
| **2** | Postman + Newman (HTTP) | ✅ **Pass**\* | `test:newman` **Pass** with **running app** + mock env — \*see [§11](#11-reporting-local-test-commands-and-bug-handling) |
| **3a** | UI readiness (Vitest only) | ✅ **Pass** | In `npm run test:run` (`tests/ui/`) |
| **3b** | Playwright E2E smoke | ❌ **Not passed** | [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap) |
| **4** | Stabilization | ✅ **Pass** | `npm run verify-phase4` = `test:run` + `lint` |
| **5** | Security consolidation | ✅ **Partial** | Prereq: ✅ `verify-phase5`. Manual WSTG / evidence / §13.6: ❌ **Not passed** yet |

### 13.1 Principles and governance

| Step | Owner | Output |
|------|--------|--------|
| Plan | QA / tech lead | Phase scope + to-dos only for this phase |
| Implement | Engineering | PR with tests/docs |
| Checkpoint | Reviewer | Commands green; checklist ticked |
| Review | QA + peer | Comments resolved |
| Approve | Product owner or QA lead | Written approval to start next phase |

**Scope discipline**

- Phase 0: tooling and secrets hygiene only — **no** product test logic beyond verifying commands run.
- Phase 1: **`lib/**/*.test.ts`** only — mocks for D1/external APIs; **no** HTTP server, **no** browser.
- Phase 2: HTTP only — depends on deployed or local base URL; **does not** assume Playwright exists.
- Phase 3: UI/E2E — **does not** duplicate unit or Postman assertions beyond user-visible outcomes.
- Phase 4: local quality gate and tags — **no** new test logic unless fixing flakes (hosted CI deferred: [§11.1](#111-backlog--continuous-integration-deferred)).
- Phase 5: evidence and WSTG mapping — **no** new automated tests unless gaps found in review.

### 13.2 Phase 0 — Readiness

**Scope**: Repository layout, Newman/Postman scaffolding, env templates, `.gitignore`. **No** product test logic beyond verifying commands run.

**Serial to-dos**

1. Create `tests/postman/collections/` and `tests/postman/environments/` (per [§4.1](#41-created-structure-target-layout)).
2. Add **placeholder** Newman environment JSON files: variable names only (`baseUrl`, `QUIZMAKER_OPENAI_LIVE`, test user placeholders); **no** real secrets in git.
3. Add `tests/postman/README.md`: folder purpose, how to run Newman (command template), where secrets live (local / team storage), link to [§6](#6-openai-feature-flag-quizmaker_openai_live).
4. Extend `.gitignore` for cookie jars / exported env files if used.
5. Run **`npm run verify-openai`** once locally (document expectation: succeeds when key valid) — **does not** gate Phase 1; documents process only.

**Checkpoint (testable)**  
- [ ] `tests/postman/` tree exists; env files parse; README is accurate; `git status` shows no secrets.

**Security checkpoint (Phase 0)**  
- [ ] No `OPENAI_API_KEY` or passwords in committed JSON; Postman export policy noted.

**Review / approval** — QA + one engineer confirm structure and secret hygiene → **Phase 0 signed off**.

**Status (verified — [§13.0](#130-phase-checkpoint-status-living-dashboard))**

| Checkpoint | Outcome | Notes |
|------------|---------|--------|
| `tests/postman/` tree; env files parse; README accurate | ✅ **Pass** | Cookie/Newman maintainer docs present for Phase 4/5 scripts |
| No `OPENAI_API_KEY` or passwords in committed JSON | ✅ **Pass** | Re-verify on any new committed env/collection export |

**Out of scope for Phase 0**: Unit tests, Postman requests with assertions, Playwright, hosted continuous integration (see [§11.1](#111-backlog--continuous-integration-deferred)).

### 13.3 Phase 1 — Unit tests (Vitest)

**Scope**: Only **`lib/**/*.test.ts`**, mocks for D1/external APIs. Aligns with QM-MCQ-*, QM-TEKS-* (schema/logic), and QM-AUTH-* **only where logic lives in testable modules** (e.g. `lib/auth.ts`, `lib/services/user-service.ts`). **Do not** invent tests for code that is not extractable or not present.

#### Phase 1A — Harness and static guarantees

**Serial to-dos**

1. Confirm `vitest.config.ts` matches repo (include `lib/**`, exclude artifacts such as `quizmaker-test-artifacts/` if they break `tsc`).
2. Add a **single** “sanity” test only if needed (e.g. pure helpers in `lib/utils.ts`) — **skip** if nothing to test (no placeholder `expect(true)`).
3. Document in PR: `npm run test:run` is the standard command for unit tests.

**Checkpoint** — [ ] `npm run test:run` exits 0 with only intentional tests.

**Security checkpoint** — [ ] No secrets in test files.

#### Phase 1B — TEKS / MCQ generation schema (QM-TEKS-05, QM-TEKS-07)

**Serial to-dos**

1. `lib/mcq-generation-schema.test.ts`: `TeksGenerationRequestSchema` — valid minimal body; reject missing/empty fields; reject oversize strings per schema limits.
2. Same file: `validateGeneratedMCQ` / `validateTeksRequest` — at least one happy path and one failure path each.
3. `buildMockTeksMcqResponse` — deterministic output passes `validateGeneratedMCQ` (mock path per [§6](#6-openai-feature-flag-quizmaker_openai_live)).

**Checkpoint** — [ ] All tests use **no** network; pure Zod/helpers only.

**Security checkpoint** — [ ] Explicit tests for **oversized / malformed** input rejection.

**Review / approval** → merge → **1C**.

#### Phase 1C — MCQ service (QM-MCQ-05–08)

**Serial to-dos**

1. Extend or refine `lib/services/mcq-service.test.ts` per [§7](#7-requirement--journeys--apis--tests): list/create/update/delete/attempt paths **as implemented** in `mcq-service.ts`.
2. Mock `@/lib/d1-client` (or project alias) per [vitest-testing.mdc](.cursor/rules/vitest-testing.mdc); `beforeEach(() => vi.clearAllMocks())`.
3. **Ownership / not-found**: user A vs B’s `mcq_id` (QM-MCQ-08) at service layer **if** enforced in service (assert against actual code).

**Checkpoint** — [ ] `npm run test:run` green; coverage matches implemented methods only.

**Security checkpoint** — [ ] Ownership / IDOR predicates covered at **unit** level where the service encodes them.

**Review / approval** → merge → **1D**.

#### Phase 1D — Auth helpers (QM-AUTH-09 partial), only if testable in `lib/`

**Serial to-dos**

1. Inventory `lib/auth.ts` and `lib/services/user-service.ts` (and related): identify **pure** or mockable units (hash compare, validation helpers).
2. Add `*.test.ts` **only** for functions that can be unit-tested without Next.js request context.
3. If critical logic lives only in route handlers, **document gap** in review (deferred to Phase 2 integration) — **do not** fake unit tests.

**Checkpoint** — [ ] Tests reflect real exports; no tests for non-existent helpers.

**Security checkpoint** — [ ] No real password material in tests; use fixtures.

**Review / approval** → merge → **1E**.

#### Phase 1E — Phase 1 closure

**Serial to-dos**

1. Run full `npm run test:run` + `npm run lint`.
2. QA checklist: Phase 1 **Tasks** + **Security requirements** from [§12.1](#121-written-tasks-by-phase) Phase 1 satisfied or gaps explicitly listed for Phase 2.
3. Short **Phase 1 summary** (one page): files added, requirement IDs covered, known gaps.

**Checkpoint** — [ ] Phase 1 sign-off document / ticket comment.

**Status (verified — [§13.0](#130-phase-checkpoint-status-living-dashboard))**

| Sub-phase | Checkpoint | Outcome | Notes |
|-----------|------------|---------|--------|
| **1A** | `npm run test:run` intentional tests only | ✅ **Pass** | [vitest.config.ts](vitest.config.ts) aligned; artifacts excluded |
| **1B** | Schema / TEKS tests; no network | ✅ **Pass** | `lib/mcq-generation-schema.test.ts` |
| **1C** | MCQ service; mocked D1 | ✅ **Pass** | `lib/services/mcq-service.test.ts` |
| **1D** | Auth helpers unit coverage | ✅ **Pass** | `lib/auth.test.ts` |
| **1E** | `test:run` + `lint` + QA checklist + summary | ✅ **Partial** | Commands ✅ **Pass**; optional formal “sign-off document / ticket” may still be open — track per team |
| **UI specs** | Readiness under `tests/ui/` | ✅ **Pass** | Same `test:run` bundle ([§10.5](#105-living-implementation-status-repository-reality)) |

**No overlap**: Phase 1 does **not** add Postman or Playwright.

### 13.4 Phases 2-5

#### Phase 2 — Integration (Postman + Newman)

**Scope**: HTTP only; depends on **deployed or local base URL**, not on Phase 3 UI. Uses Phase 0 folders and env templates.

**Serial to-dos**

1. **Auth collection**: signup/login/logout/me — capture session; document cookie/Newman limitation (manual `Cookie` if needed).
2. **MCQ collection**: depends on auth — list, CRUD, attempts; assert status codes and **actual** JSON shapes from routes.
3. **TEKS collection**: `POST /api/mcqs/generate-teks` with `QUIZMAKER_OPENAI_LIVE=false` (mock).
4. Newman runs documented in README with reporters; optional full dry-run locally before sign-off.

**Checkpoint** — [ ] `npx newman run …` green against target env (mock OpenAI).

**Security checkpoint** — [ ] 401/403/IDOR/no secret leakage tests per [§12.1](#121-written-tasks-by-phase) Phase 2.

**Review / approval** → Phase 2 signed off. **Does not assume** Playwright exists.

**Status (verified — [§13.0](#130-phase-checkpoint-status-living-dashboard))**

| Checkpoint | Outcome | Notes |
|------------|---------|--------|
| Newman green (mock OpenAI) | ✅ **Pass**\* | \*Run with **app listening** on `baseUrl` and [mock-openai.postman_environment.json](tests/postman/environments/mock-openai.postman_environment.json); `ECONNREFUSED` if server down |
| Security assertions (401/403/IDOR/leakage) | ✅ **Pass** | Collections assert expected HTTP behavior — re-run after API changes |

#### Phase 3 — UI / E2E (Playwright)

**Scope**: Single entry file per [Appendix B](#appendix-b--suggested-playwright-file-illustrative); smoke flows [§12.3](#123-critical-e2e-user-flows-phase-3) for **Phase 3b** only. **Phase 3a** is readiness-only ([§12.1](#121-written-tasks-by-phase) Phase 3).

**Serial to-dos — Phase 3a (readiness)**

1. Scaffold `tests/ui/` per [§4.1](#41-created-structure-target-layout) (config, env helpers).
2. Vitest specs for **BASE_URL** / environment validation only (included in `npm run test:run`).

**Checkpoint (3a)** — [ ] `npm run test:run` green including UI readiness tests.

**Serial to-dos — Phase 3b (Playwright smoke)**

1. Add driver factory, Page Objects, and one spec file per [Appendix B](#appendix-b--suggested-playwright-file-illustrative).
2. Implement **E2E-AUTH-01** + smoke set (**E2E-MCQ-01**, **E2E-MCQ-03**, **E2E-TEKS-01**) with mock OpenAI.
3. Document run command and env (base URL, test user).

**Checkpoint (3b)** — **Planned** until Playwright smoke exists ([§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap)).

- [ ] Playwright smoke suite **green** on a team-agreed base URL (local or staging), **or**
- [ ] Gap **acknowledged**: **3a** signed off; **3b** remains **OPEN** with target review in [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap) when implemented.

**Security checkpoint** — [ ] Logout / HTTPS / error UI checks per [§12.1](#121-written-tasks-by-phase) Phase 3 (applies to **3b**; **3a** has no browser surface). If **3b** is not yet implemented, record as **pending** in [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap).

**Review / approval** → Phase 3 signed off when agreed **3a** and **3b** checkpoints are satisfied **or** **3b** gap is documented per [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap).

**Status (verified — [§13.0](#130-phase-checkpoint-status-living-dashboard))**

| Track | Checkpoint | Outcome | Notes |
|-------|------------|---------|--------|
| **3a** | `npm run test:run` includes UI readiness | ✅ **Pass** | Env/`BASE_URL` specs — not browser E2E |
| **3b** | Playwright smoke (**E2E-*** flows) | ❌ **Not passed** | No `@playwright/test` / browser smoke in repo per [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap) |
| **Security (3b)** | Logout / HTTPS / error UI | ❌ **Not passed** | Pending **3b** implementation |

#### Phase 4 — Stabilization (local quality gate & tags)

**Serial to-dos**

1. Confirm repeatable local checkpoint: `npm run verify-phase4` (or `npm run test:run` then `npm run lint`). Hosted CI and Newman-on-deploy are **out of scope** for this plan until [§11.1](#111-backlog--continuous-integration-deferred) is picked up.
2. Tag smoke vs full in UI/Newman as agreed (same tagging limitations as [§12.1](#121-written-tasks-by-phase) Phase 4 until tooling upgrades).
3. Document flake triage; align with team policy on when critical security failures block release.

**Checkpoint** — [ ] `npm run verify-phase4` (or equivalent) exits 0 on a clean checkout.

**Review / approval** → Phase 4 signed off.

**Status (verified — [§13.0](#130-phase-checkpoint-status-living-dashboard))**

| Checkpoint | Outcome | Notes |
|------------|---------|--------|
| `npm run verify-phase4` | ✅ **Pass** | `test:run` + `lint`; also enforced before `next build` via `npm run build` ([§10.5](#105-living-implementation-status-repository-reality)) |
| Smoke / tag policy documented | ✅ **Partial** | Tagging as agreed — confirm in team workflow |

#### Phase 5 — Security consolidation

**Manual sign-off placeholder (human-required)** — Phase 5 **does not complete** on automation alone. Use the checklist and assurance steps in [§13.6](#136-phase-5-program-closeout--senior-qa-assurance) and the template [docs/PHASE5_MANUAL_SIGNOFF.template.md](docs/PHASE5_MANUAL_SIGNOFF.template.md) (copy to your evidence system; complete signatures). **`npm run verify-phase5` must not be interpreted as Phase 5 sign-off.**

**Serial to-dos**

1. Map existing tests to [§8](#8-security-and-compliance-owasp-wstg) / WSTG themes; list versioned `WSTG-*` where possible.
2. Update the risk/gap list in [§10](#10-assumptions-coverage-gaps-and-risks) for anything not automatable.
3. Optional peer/security review meeting.

**Checkpoint (automated prerequisite, optional)** — [ ] `npm run verify-phase5` exits 0 — confirms `verify-phase4` and Postman README only; **not** a substitute for the manual checkpoint below.

**Checkpoint** — [ ] Signed evidence appendix (can live outside repo or in `docs/` later).

**Checkpoint (human)** — [ ] [§13.6](#136-phase-5-program-closeout--senior-qa-assurance) assurance (§13.5 Parts A–E applied at closeout) + sign-off block completed per template.

**Review / approval** → Program test rollout complete for agreed scope **only after** human checkpoint above (not after `verify-phase5` alone).

**Status (verified — [§13.0](#130-phase-checkpoint-status-living-dashboard))**

| Checkpoint | Outcome | Notes |
|------------|---------|--------|
| `npm run verify-phase5` (automated prereq) | ✅ **Pass** | Requires `verify-phase4` + [tests/postman/README.md](tests/postman/README.md) |
| Signed evidence appendix | ❌ **Not passed** | Human / audit artifact — may live outside repo |
| [§13.6](#136-phase-5-program-closeout--senior-qa-assurance) + template signatures | ❌ **Not passed** | WSTG mapping and §13.5 Parts A–E at closeout per [docs/PHASE5_MANUAL_SIGNOFF.template.md](docs/PHASE5_MANUAL_SIGNOFF.template.md) |
| §12.1 Phase 5 tasks (WSTG walk, §10 updates) | ❌ **Not passed** | Manual security consolidation |

### 13.5 Final verification (before execution)

Use before treating the implementation plan as approved for execution.

#### Part A — Plan integrity (content review)

| # | Verification | Green check when… |
|---|----------------|-------------------|
| A1 | **Phase coverage** | Phases 0–5 map to readiness → unit → Postman → Playwright → stabilization → security consolidation. |
| A2 | **No forward dependencies** | Gaps **explicitly deferred** with a target phase. |
| A3 | **Serial to-dos** | Each phase has ordered steps; no unlisted prerequisite. |
| A4 | **Checkpoints** | Every phase has a **testable** checkpoint. |
| A5 | **Security requirements** | Each phase matches [§12.1](#121-written-tasks-by-phase). |
| A6 | **Scope boundaries** | Phase 0 vs 1 vs 2 vs 3 boundaries respected. |
| A7 | **Traceability** | QM-* / E2E-* consistent with [§7](#7-requirement--journeys--apis--tests) and [§12.3](#123-critical-e2e-user-flows-phase-3). |
| A8 | **Governance** | Plan → review → approval cycle explicit ([§13](#13-implementation-plan-execution) intro). |

#### Part B — Alignment with repository reality

| # | Verification | Green check when… |
|---|----------------|-------------------|
| B1 | **Vitest** | `vitest.config.ts` / `npm run test:run` matches Phase 1. |
| B2 | **Colocation** | Unit tests under `lib/` per project rules. |
| B3 | **Mocks** | No accidental live D1/API calls in Phase 1. |
| B4 | **OpenAI flag** | Mock path documented for TEKS integration. |
| B5 | **Postman layout** | Matches `tests/postman/` structure. |
| B6 | **Playwright** | Matches [§12.3](#123-critical-e2e-user-flows-phase-3) and [Appendix B](#appendix-b--suggested-playwright-file-illustrative). |
| B7 | **Secrets** | No keys committed; secure storage path agreed for non-local runs. |

#### Part C — Read-through (definition of done per layer)

| # | Layer | Green check when… |
|---|--------|-------------------|
| C1 | Readiness | Phase 0 to-dos executable standalone. |
| C2 | Unit | Phase 1A–1E clear; 1E closure explicit. |
| C3 | Integration | Auth → MCQ → TEKS order clear; mock OpenAI explicit. |
| C4a | UI — readiness (Phase 3a) | `tests/ui/` scaffold + Vitest env/readiness specs pass under `npm run test:run`. |
| C4b | UI — Playwright (Phase 3b) | **Pending** until closed in [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap). When implemented: smoke flow IDs in [§12.3](#123-critical-e2e-user-flows-phase-3) automated in browser; Phase 4 not required to “finish” Phase 3b. |
| C5 | Stabilization (Phase 4) | Local `npm run test:run` + `npm run lint`; Newman remains manual/team-run until [§11.1](#111-backlog--continuous-integration-deferred). |
| C6 | Security | Phase 5 is evidence/mapping, not only new automation. |

#### Part D — Document merge mechanics

| # | To-do | Green check when… |
|---|--------|-------------------|
| D1 | Section title + version bump | Metadata and TOC match. |
| D2 | Version + TOC | Metadata version bumped for material edits; TOC matches structure. |

#### Part E — Final green-light

- [ ] Parts A–D satisfied or plan text updated.

### 13.6 Phase 5 program closeout — senior QA assurance

Use this section when **closing Phase 5 (security consolidation)** after manual WSTG work, evidence, and optional peer review. It is **not** a substitute for [§13.5](#135-final-verification-before-execution), which validates the **plan** before phased execution begins. At Phase 5 **end**, senior QA applies the **same Part A–E structure** to **live evidence and repository state** so sign-off is traceable and defensible.

**Artifact**: Complete [docs/PHASE5_MANUAL_SIGNOFF.template.md](docs/PHASE5_MANUAL_SIGNOFF.template.md) (or an equivalent controlled record) and retain the **human signature** section. Automated `npm run verify-phase5` may be referenced in the template’s prerequisite table only; it does **not** satisfy this section.

#### End path (mandatory order)

1. **Unblock automation**: Resolve any `verify-phase5` / `verify-phase4` failures using [§11](#11-reporting-local-test-commands-and-bug-handling) bug policy; re-run until prerequisites are green **or** document an explicit, approved waiver (rare; not a silent skip).
2. **Complete [§12.1](#121-written-tasks-by-phase) Phase 5 — Tasks and Security requirements** (WSTG walk with versioned IDs where possible; §10 updates; tests→WSTG evidence list; OpenAI path [§8.5](#85-openai--secrets-qm-teks-04)).
3. **Produce the signed evidence appendix** ([§13.4](#134-phases-2-5) Phase 5 checkpoint). Acknowledge [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap) if Phase 3b remains open.
4. **Run assurance §13.5 Parts A–E against current state** — Record Pass / N/A / Gap in [docs/PHASE5_MANUAL_SIGNOFF.template.md](docs/PHASE5_MANUAL_SIGNOFF.template.md) (section 5, row-by-row tables) using the narrative prompts in **§13.6** below; do not mark Pass without evidence you would stake a review on.
5. **Human sign-off** — Named senior QA (or delegate per governance) signs the template attestation. **Phase 5 is complete** only after this step; **exit code 0 from `verify-phase5` is insufficient.**

#### Part A — Plan integrity (re-confirm at closeout)

| Step | Action for senior QA |
|------|------------------------|
| A1–A4 | Confirm phased structure, dependencies, and checkpoints still match executed work; update [§10](#10-assumptions-coverage-gaps-and-risks) if reality drifted. |
| A5 | Verify [§12.1](#121-written-tasks-by-phase) security requirements for Phases 0–5 are satisfied **or** explicitly accepted as residual risk with owner. |
| A6–A7 | Re-check scope boundaries and QM-* / E2E-* traceability for artifacts you are signing off. |
| A8 | Confirm review/approval cadence ([§13.1](#131-principles-and-governance)) was followed for prior phases or document exceptions. |

#### Part B — Alignment with repository reality

| Step | Action for senior QA |
|------|------------------------|
| B1–B3 | Spot-check: `vitest.config.ts`, `npm run test:run`, colocation under `lib/`, mocks not hitting live D1/API in unit layer. |
| B4–B5 | Confirm OpenAI/mock TEKS documentation and `tests/postman/` layout match [§6](#6-openai-feature-flag-quizmaker_openai_live) and Phase 2 expectations. |
| B6 | Align Playwright / E2E claims with [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap) — do not claim 3b smoke where the gap is still open. |
| B7 | Confirm no secrets in repo; cookie jars / env files per [.gitignore](.gitignore) and Phase 0 rules. |

#### Part C — Definition of done per layer (evidence-based)

Walk [§13.5](#135-final-verification-before-execution) Part C rows C1–C6 using **artifacts** (logs, Newman exports, PR links, test files), not memory. C6 (security) must show **Phase 5 mapping/evidence**, not only that automation exists.

#### Part D — Document merge mechanics

Confirm `kimberly_test_plan.md` metadata, TOC, and [§14 document history](#14-document-history) narrative reflect material updates from this program; D2 is satisfied when the **Version** matches the signed record or the closeout notes reference the same plan revision.

#### Part E — Final green-light (Phase 5)

- [ ] Parts A–D of **this §13.6** satisfied **or** discrepancies documented with owner and date.
- [ ] **Human sign-off** on [docs/PHASE5_MANUAL_SIGNOFF.template.md](docs/PHASE5_MANUAL_SIGNOFF.template.md) (or equivalent controlled document).

**Integrity expectation**: Sign only after you have reasonable assurance that the checklist and §13.5-aligned tables are accurate; escalate conflicting evidence before signing.

### 13.7 Integration API test catalog & staged Newman implementation

This subsection is the **integration (HTTP) test design**. It is written as if the questions in [§1.1](#11-what-the-tests-prove--top-program-risks-review-hub) — **“What is this test actually proving about the system?”** and the **top 3 program risks** — were fixed **before** any INT-* IDs or Postman folders existed. **Vitest** and **browser UI** automation are out of scope here; they complement Newman per [§1.1](#11-what-the-tests-prove--top-program-risks-review-hub) and [§3.2](#32-test-pyramid-distribution).

Conventions: [docs/TEST_CASE_GUIDE.MD](docs/TEST_CASE_GUIDE.MD); verify **actual** route behavior; [§5.2](#52-integration--postman--newman).

#### 13.7.1 What Newman integration proves (and does not)

**What is this test actually proving?** — Each **INT-*** case proves **observable HTTP behavior** of named routes under a **running** app: request/response contracts, status codes, JSON shapes, session **cookie** continuity within a Newman run, and selected **negative** paths. Evidence is traceable to **QM-*** API rows in [§2](#2-requirement-ids-and-traceability).

| Newman integration **does** support | Newman integration **does not** prove (by design) |
|-------------------------------------|--------------------------------------------------|
| Server-side API contracts and error bodies for auth, MCQ, TEKS routes | **Full teacher journeys** in the browser (forms, redirects, middleware UX) — **Risk 1**; see Phase **3b** ([§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap)) |
| Authn/authz at the **HTTP** layer (e.g. 401 without cookie, 404 on cross-user MCQ) as a **partial** input to security confidence | **Full** OWASP / WSTG assurance or org-wide “secure” sign-off — **Risk 2**; Phase **5** + human evidence ([§13.6](#136-phase-5-program-closeout--senior-qa-assurance), [§8.0](#80-wstg-scope-vs-automation-layers-reference)) |
| Repeatable checks when env is documented (`baseUrl`, mock TEKS, unique data) | **Hosted CI parity**, disposable DB state, or freedom from cookie/tooling quirks — **Risk 3**; see [Exceptions register](#exceptions-register), [§10.3](#103-risk-assessment-summary) |

**Bottom line for integration:** INT-* answers **“Did these APIs behave as implemented for these inputs on this run?”** — not **“Is the product done?”** or **“Is security closed?”**

#### 13.7.2 How the top 3 program risks shape INT-* design

The integration catalog is **prioritized and bounded** so it **mitigates what HTTP can mitigate** without pretending to close gaps that belong to other layers.

| Top risk ([§1.1](#11-what-the-tests-prove--top-program-risks-review-hub)) | Design consequence for INT-* | Examples in this catalog |
|---------------------------------------------------------------------------|------------------------------|---------------------------|
| **1 — E2E / browser smoke incomplete** | Newman covers **API legs** of journeys (signup → session → protected `GET /api/mcqs`, MCQ CRUD, TEKS POST). Collections **do not** claim **QM-AUTH-08**, **QM-MCQ-04**, **QM-TEKS-02–03** (UI); reviewers should treat those as **Phase 3b** / manual until closed ([§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap)). | INT-AUTH-* establishes session **without** asserting `/login` redirect; INT-MCQ-* avoids UI table assertions |
| **2 — Automation ≠ full security assurance** | INT-* **emphasizes** high-tier signals from [§3.1](#31-risk-tiers-for-prioritization): auth gate, **IDOR-style** ownership (404 on other user’s MCQ), no credential/hash leakage in JSON. **Does not** replace WSTG breadth or Phase **5** sign-off. | INT-AUTH-011/012 (401 gates); INT-MCQ-008/010 (cross-user); patterns aligned with [§8.4](#84-mapping--api--transport) (e.g. no stack traces in bodies) |
| **3 — Process / environment brittleness** | Stages **0–4** bake in **runbooks**: `baseUrl`, **`QUIZMAKER_OPENAI_LIVE=false`** for default TEKS automation ([§6](#6-openai-feature-flag-quizmaker_openai_live)), **prefixed / unique** identities ([§9.3](#93-test-data-cleanup-deferred)), **flexible** boolean checks ([§5.2](#52-integration--postman--newman)), cookie strategy per [.cursor/rules/APITesting-Postman.mdc](.cursor/rules/APITesting-Postman.mdc). Stage **5** makes INT↔QM traceability explicit so drift is caught. | Stage 0 README/env; Stage 3 mock TEKS only for bulk runs; Stage 4 reporter paths |

#### 13.7.3 Sprint 2 — API integration delivery (completed)

**Working folder:** [`kimberly_Sprint2/`](kimberly_Sprint2/) (staging narrative; this plan remains the strategy source of truth).

| Topic | Record |
|-------|--------|
| **Full API suite** | `npm run test:newman` / `npm run verify-phase2` — **43** requests, **56** assertions (auth → mcq → mock teks); requires running app at Postman `baseUrl`. |
| **PRD HTTP coverage** | [`postman-auth-integration.json`](tests/postman/collections/postman-auth-integration.json), [`postman-mcq-crud-integration.json`](tests/postman/collections/postman-mcq-crud-integration.json), [`postman-teks-generate-integration.json`](tests/postman/collections/postman-teks-generate-integration.json) mapped to [BASIC_AUTHENTICATION](docs/BASIC_AUTHENTICATION.md), [MCQ_CRUD](docs/MCQ_CRUD.md), [TEKS_ALIGNED_MCQ](docs/TEKS_ALIGNED_MCQ.md) API behaviors (UI still [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap)). |
| **OpenAI feature flag** | `QUIZMAKER_OPENAI_LIVE` per [§6](#6-openai-feature-flag-quizmaker_openai_live); optional live collection + [`tests/postman/README.md`](tests/postman/README.md). |
| **OWASP-oriented API signals** | Auth **401**, cross-user MCQ **404**, validation **400**, selected **no stack / no secret** assertions — complements [§8](#8-security-and-compliance-owasp-wstg); not Phase **5** WSTG sign-off. |
| **Build vs Newman** | `npm run build` = Vitest + `next build` — Newman **not** embedded ([§10.5](#105-living-implementation-status-repository-reality)). |
| **Delivery artifact** | [`kimberly_Sprint2/COMPREHENSIVE_API_TEST_DELIVERY.md`](kimberly_Sprint2/COMPREHENSIVE_API_TEST_DELIVERY.md) |

#### Contract note (PRD vs implementation)

- [docs/BASIC_AUTHENTICATION.md](docs/BASIC_AUTHENTICATION.md) describes signup success as **200**; the implementation returns **201** with `{ user: { … } }` ([`app/api/auth/signup/route.ts`](app/api/auth/signup/route.ts)). Integration assertions follow **implementation**.

#### Integration test IDs (summary)

| ID | Area | Endpoint(s) | Expected focus | Risk note (intent) |
|----|------|-------------|----------------|---------------------|
| INT-AUTH-001 | Auth | `POST /api/auth/signup` | 201, user body, session cookie | **2** — session issued; **3** — unique email per run |
| INT-AUTH-002 | Auth | `POST /api/auth/login` | 200, user body, session | **2** — credential path |
| INT-AUTH-003 | Auth | `GET /api/auth/me` | 200 when session present | **2** — session resolution |
| INT-AUTH-004 | Auth | `POST /api/auth/logout` then `GET /api/auth/me` | 200 message; then 401 | **2** — session invalidation at API |
| INT-AUTH-005–008 | Auth | Signup negatives | 400 (missing / invalid email / short password); 409 duplicate | **2** — validation surface |
| INT-AUTH-009–010 | Auth | Login negatives | 400 missing; 401 invalid | **2** — generic invalid creds |
| INT-AUTH-011–012 | Auth + gate | `GET /api/auth/me`, `GET /api/mcqs` without cookie | 401 | **2** — **auth gate** (not browser redirect — **1**) |
| INT-MCQ-001–014 | MCQ | `GET/POST /api/mcqs`, `GET/PUT/DELETE /api/mcqs/[id]` | CRUD, pagination, validation, ownership 404 | **1** — API journey; **2** — **IDOR**-style ownership |
| INT-ATT-001–005 | Attempts | `POST/GET /api/mcqs/[id]/attempts` | 200 shapes; 400/401/404 negatives | **1** — preview **API**; **2** — choice validity |
| INT-TEKS-001–002 | TEKS | `POST /api/mcqs/generate-teks` | Mock success (`[Mock]`); 400 validation | **3** — mock default; **2** — validation automation |
| INT-TEKS-LIVE-001 | TEKS (optional) | Same endpoint | Live OpenAI — no `[Mock]` prefix | **3** — tokens; manual / `test:newman:teks:live` |

Full procedural specs (preconditions, steps, expected results) are defined in the **review-approved** design; automation implements assertions in Postman test scripts.

#### Staged implementation (serial: plan → review → approval → implement → test)

Each stage has a **testable exit** and aligns with the **risk framing** in [§13.7.2](#1372-how-the-top-3-program-risks-shape-int-design).

| Stage | Scope | Deliverable (end state) | Risk alignment |
|-------|--------|-------------------------|----------------|
| **0** | Readiness | `baseUrl` + env docs; Newman runnable; no secrets in repo | **3** — reproducible runs; no keys in JSON |
| **1** | Auth | [`tests/postman/collections/postman-auth-integration.json`](tests/postman/collections/postman-auth-integration.json) — INT-AUTH-001–012 | **2** gate + session; **1** does not claim UI ([§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap)) |
| **2** | MCQ + attempts | [`postman-mcq-crud-integration.json`](tests/postman/collections/postman-mcq-crud-integration.json) — INT-MCQ-*, INT-ATT-* | **2** ownership; **3** flexible booleans / prefixed data |
| **3** | TEKS | [`postman-teks-generate-integration.json`](tests/postman/collections/postman-teks-generate-integration.json) — INT-TEKS-* (mock `QUIZMAKER_OPENAI_LIVE`) | **3** mock-by-default; live only manual / explicit env |
| **4** | Runner | `npm run test:newman` / [`scripts/run-newman-ci.mjs`](scripts/run-newman-ci.mjs) — all collections; reporters documented | **3** — one command + artifacts; still needs running app |
| **5** | Traceability | QM-* ↔ INT-* matrix; PRD/implementation notes; maintenance owner | **2** — explicit limits; **3** — drift control |

Stages **must not overlap responsibilities**: each stage has a single reviewable artifact and a testable exit (Newman green against a running app where applicable).

#### Stage 0 — to-dos (checklist)

- [x] Confirm [`tests/postman/environments/mock-openai.postman_environment.json`](tests/postman/environments/mock-openai.postman_environment.json) has `baseUrl` and `QUIZMAKER_OPENAI_LIVE=false` for TEKS consumers.
- [x] [`tests/postman/README.md`](tests/postman/README.md) documents: start app (`npm run dev`), run Newman, cookie/session hygiene.
- [x] No real passwords or API keys in committed JSON.

#### Stage 1 — to-dos (Auth collection)

- [x] Folders: unauthenticated checks → validation → signup/login happy & negative → session lifecycle.
- [x] Collection self-contained (unique signup email via prerequest script); Newman cookie jar works for the run.
- [x] Assertions: status codes, `error` strings where applicable, `user` shape, `Set-Cookie` includes `quizmaker-session` on successful signup/login.
- [x] `npm run test:newman:auth` documented in [`tests/postman/collections/README.md`](tests/postman/collections/README.md).

##### Stage 1 — verification record (2026-04-07)

- **Newman**: `npm run test:newman:auth` — **15** requests, **0** failed, **22** assertions (local run with `npm run dev` and `mock-openai` env).
- **Coverage**: INT-AUTH-001–012 implemented as named requests in [`postman-auth-integration.json`](tests/postman/collections/postman-auth-integration.json).

#### Stage 2 — to-dos (MCQ collection)

- [x] Own signup block; create → list → get → put → attempts → delete; second user for 404 ownership.
- [x] Flexible `is_correct` assertion where SQLite types vary ([§5.2](#52-integration--postman--newman)).

#### Stage 3 — to-dos (TEKS collection)

- [x] Mock-only path; assert `[Mock]` title prefix and four choices.

#### Stage 4 — to-dos (runner)

- [x] `test:newman` runs auth → mcq → teks; JUnit export path optional per [tests/postman/README.md](tests/postman/README.md).

#### Stage 5 — to-dos (documentation)

- [x] INT-* ↔ QM-* matrix in team wiki or appendix; note signup **201** vs older PRD text — **partial**: [§13.7.3](#1373-sprint-2--api-integration-delivery-completed) + [`kimberly_Sprint2/COMPREHENSIVE_API_TEST_DELIVERY.md`](kimberly_Sprint2/COMPREHENSIVE_API_TEST_DELIVERY.md); wiki optional.

#### Implementation status (living)

| Stage | Status | Artifact / notes |
|-------|--------|-------------------|
| 0 | Baseline complete | Env + README ([§10.5](#105-living-implementation-status-repository-reality)); Stage 0 checklist signed off in §13.7 (2026-04-07) |
| 1 | **Implemented · verified** | Auth collection INT-AUTH-001–012; Newman green — §13.7 Stage 1 verification record (2026-04-07) |
| 2 | **Implemented · verified** | [`postman-mcq-crud-integration.json`](tests/postman/collections/postman-mcq-crud-integration.json); INT-MCQ / INT-ATT — Sprint 2 ([§13.7.3](#1373-sprint-2--api-integration-delivery-completed)) |
| 3 | **Implemented · verified** | [`postman-teks-generate-integration.json`](tests/postman/collections/postman-teks-generate-integration.json); mock TEKS; optional live: [`postman-teks-live-optional.json`](tests/postman/collections/postman-teks-live-optional.json) |
| 4 | **Implemented · verified** | `npm run test:newman`, `verify-phase2`, [`run-newman-ci.mjs`](scripts/run-newman-ci.mjs); CI job `newman-staging` when `NEWMAN_BASE_URL` set |
| 5 | **Partial** | Sprint 2 delivery docs; full wiki matrix optional — Phase **5** program sign-off remains separate ([§13.6](#136-phase-5-program-closeout--senior-qa-assurance)) |

## 14. Document history

This plan is updated **incrementally** as a living document. **Version** in [Document metadata](#document-metadata) is the authoritative label when material edits land. There is **no per-edit dated changelog** here—**v3.8** adds [§13.7.3](#1373-sprint-2--api-integration-delivery-completed) (Sprint 2 API integration delivery record, [`kimberly_Sprint2/COMPREHENSIVE_API_TEST_DELIVERY.md`](kimberly_Sprint2/COMPREHENSIVE_API_TEST_DELIVERY.md)) and updates §13.7 staged implementation status (Stages 2–4 verified). Major themes already woven into the body include: [§1.1](#11-what-the-tests-prove--top-program-risks-review-hub) “what tests prove” + top program risks hub (v3.6); [§13.7](#137-integration-api-test-catalog--staged-newman-implementation) integration catalog **risk-shaped** with §13.7.1–§13.7.2 and INT-* **risk note** column (v3.7); staged Newman stages (v3.5); phased rollout (0–5) with security in every phase; **Phase 1 unit feature map** ([§3.4](#34-unit-test-feature-map-phase-1)); **[§3.5](#35-phase-verification-snapshot-session)** session table (Vitest vs Newman counts, re-run totals); **[§8.0](#80-wstg-scope-vs-automation-layers-reference)** WSTG scope vs layers (reference, improvement callouts); Vitest, Postman/Newman, and planned Playwright ([§12.3](#123-critical-e2e-user-flows-phase-3)); `QUIZMAKER_OPENAI_LIVE` and mock TEKS; deferred hosted CI ([§11.1](#111-backlog--continuous-integration-deferred)); [exceptions](#exceptions-register) vs [TEST_CASE_GUIDE.MD](docs/TEST_CASE_GUIDE.MD); Phase 3a/3b and [§10.4](#104-test-findings--phase-3b-planned-checkpoint-and-gap); Phase 4 `verify-phase4` / build-time tests; Phase 5 scripts, [PHASE5_MANUAL_SIGNOFF.template.md](docs/PHASE5_MANUAL_SIGNOFF.template.md), and [§13.6](#136-phase-5-program-closeout--senior-qa-assurance); [§10.5](#105-living-implementation-status-repository-reality) repository status; and [§13](#13-implementation-plan-execution) checkpoint outcomes (✅ Pass / ✅ Partial / ❌ Not passed).

## 15. Appendices

### Appendix A — Suggested Postman collection names (illustrative)

- `postman-auth-integration.json` — QM-AUTH-05–07  
- `postman-mcq-crud-integration.json` — QM-MCQ-05–07  
- `postman-teks-generate-integration.json` — QM-TEKS-04 (two environments: `live-openai`, `mock-openai`)

### Appendix B — Suggested Playwright file (illustrative)

When **Phase 3b** starts, use **one** Playwright entry (or a single orchestrated file) so flows are not split across unrelated suites. Organize with `test.describe` / tags (e.g. `@smoke`) per flow ID in [§12.3](#123-critical-e2e-user-flows-phase-3).

- **Today (Phase 3a)**: **`tests/ui/src/tests/quizmaker-critical-flows.spec.ts`** — Vitest **readiness** only (`BASE_URL` / env); not browser E2E.
- **Future (Phase 3b)**: Add Playwright specs (e.g. `tests/e2e/*.spec.ts` or under `tests/ui/`) for **E2E-AUTH-01**, **E2E-MCQ-01**–**E2E-MCQ-05**, **E2E-TEKS-01**–**E2E-TEKS-03**; QM-AUTH-*, QM-MCQ-04–07, QM-TEKS-02–04; mock OpenAI per [§6](#6-openai-feature-flag-quizmaker_openai_live) unless a run explicitly targets live API.
