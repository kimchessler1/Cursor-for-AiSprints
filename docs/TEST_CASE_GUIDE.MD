# TESTING_GUIDE.md

---
title: Project Testing Guide
version: 0.1
last_updated: 2026-01-22
tiers: [required, recommended]
---

# Purpose & Scope
This guide defines conventions, structure, and strategies for AI-assisted test automation. It applies to Unit, Integration, and UI tests. It is intended to be referenced by both engineers and LLMs when generating or maintaining test cases.

# How the LLM should use this doc
- Map requirements to risk levels and test types.
- Generate test skeletons with metadata headers.
- Obey `REQUIRED` rules; suggest exceptions for `RECOMMENDED` rules with justification.
- Include explicit assumptions and success/failure criteria.

# Rule Tiers
- **REQUIRED**: Must follow; violations require human-approved exceptions.
- **RECOMMENDED**: Should follow unless justified; LLM can propose exceptions.

# Global Conventions
- Folder structure: Unit tests colocated with source files; Integration tests in `/tests/integration/`; UI tests in `/tests/ui/` with feature-based subfolders.  `REQUIRED`
- **Test Organization**: Organize tests by feature/domain when possible. Group related tests together. Use consistent naming patterns within test suites.  `RECOMMENDED`
- **Test Suite Structure**: Structure test suites logically (by feature, by user journey, by risk level). Use test grouping/describe blocks to organize related tests.  `RECOMMENDED`
- File naming: Use meaningful, descriptive names (e.g., `auth-service.test.ts`, `password.test.ts`). Test files should be colocated next to the files they test.
- Header metadata: `@type`, `@module`, `@risk`, `@requirement`, `@assumptions`, `@success_criteria`, `@tags`
- Tagging: `@unit`, `@integration`, `@ui`; risk: `low`, `medium`, `high`
- **Framework-Specific Rules**: Reference framework-specific testing guides (e.g., `PlaywrightTesting.mdc`, `SeleniumTesting.mdc`, `APITesting-Postman.mdc`) for detailed patterns and best practices. Framework guides SHOULD be consulted when writing tests for specific frameworks.  `REQUIRED`
- **Test Documentation**: Document test decisions and patterns.  `RECOMMENDED`
  - Explain why certain patterns are used (e.g., flexible assertions, session management strategy)
  - Document known issues and workarounds
  - Include comments for test setup/teardown logic
  - Mark assumptions explicitly (e.g., `ASSUMPTION: Multiple status codes acceptable due to security check order`)

# Unit Tests
**Folder:** Colocate test files next to the files they test (e.g., `utils/format.test.ts` next to `utils/format.ts`)  `REQUIRED`
**Naming:** `Method_Scenario_ExpectedResult` or `should_<doX>_when_<condition>`; file names should be meaningful and descriptive (e.g., `auth-service.test.ts`)  
**Rules:**
- Isolation: fully isolate; use mocks/stubs.  `REQUIRED`
- Data: use factories/builders; no network or DB.  `REQUIRED`
- Assertion: assert observable output, not internal state.  `REQUIRED`
- Test size: small, single-behavior per test.  `RECOMMENDED`
- Exclusions: do not test integration or UI behavior.  `REQUIRED`
- **Test Independence**: Each test must be independently executable in any order.  `REQUIRED`
  - Clear mocks between tests using `beforeEach(() => { vi.clearAllMocks(); })` or equivalent
  - Do not rely on test execution order
  - Each test should set up its own data requirements
- **Mock Reset Strategy**: Reset mocks between tests to prevent test pollution.  `REQUIRED`
  - Use framework-specific reset functions (e.g., `vi.clearAllMocks()`, `jest.clearAllMocks()`)
  - Reset in `beforeEach` hook, not `afterEach` (ensures clean state before test runs)

# Integration Tests
**Folder:** `/tests/integration/<feature>/` or tool-specific locations (e.g., `/tests/postman/collections/post-build/` for Postman collections)  
**Naming:** Use meaningful, descriptive names that clearly indicate the feature and test type (e.g., "Post-Build Auth Integration Tests", "MCQ CRUD Integration Tests")  
**Rules:**
- Scope: test interactions between two or more components.  `REQUIRED`
- Environment: use staging or controlled; virtualize external services.  `RECOMMENDED`
- Data: seed disposable test data; cleanup after test.  `REQUIRED`
- Assertions: end-to-end outcomes, not internal logic.  `RECOMMENDED`
- Isolation: be explicit about mocks vs real components.  `REQUIRED`
- Exclusions: avoid re-testing UI rendering or unit logic.  `REQUIRED`
- **Collection Independence**: Each test collection should be self-contained and independently executable.  `REQUIRED`
  - Include setup requests/folders within the collection itself
  - Do not depend on external collections or test execution order
  - Each collection should handle its own authentication/setup
- **Variable Scoping**: Use appropriate variable scopes for test data.  `REQUIRED`
  - Collection-scoped variables: Reset between collection runs, use for test-scoped data
  - Environment-scoped variables: Persist across collections, use for shared state (e.g., auth tokens)
  - Document variable scoping decisions in test comments
- **Verify actual implementation**: Before writing test expectations, check the actual API implementation code to understand response structures, field names, and behavior. POST and GET endpoints may use different field names for the same data.  `REQUIRED`
- **Response structure differences**: POST and GET endpoints may return different response structures (e.g., POST returns `{ attempt_id, selected_choice: {...} }` while GET returns `{ attempts: [{ id, selected_choice_id, ... }] }`). Tests must match actual implementation, not assume consistency.  `REQUIRED`

# UI Tests
**Folder:** `/tests/ui/`  
**Naming:** `should_<user_journey>_when_<scenario>`  
**Rules:**
- Locator strategy: stable IDs/data-qa; fallback documented.  `REQUIRED`
- Data: seeded test users/accounts; reset state; no production data.  `REQUIRED`
- Assertions: behavioral outcomes, not internal DOM state.  `REQUIRED`
- Isolation: manage flakiness, use retries sparingly, capture logs/screenshots.  `RECOMMENDED`
- Exclusions: do not assert low-level logic; handled in unit/integration.  `REQUIRED`
- **Session Management Strategy**: Choose appropriate session lifecycle based on test type.  `REQUIRED`
  - **Per-test login** (`beforeEach`): Use for authentication tests, security tests (testing session behavior)
  - **Per-suite login** (`beforeAll`): Use for feature tests that require authentication (performance optimization)
  - Always clear cookies/storage in `beforeEach` for authentication tests
  - Document session management strategy in test file comments
- **Browser State Isolation**: Each test must start with clean browser state.  `REQUIRED`
  - Clear cookies, localStorage, and sessionStorage in `beforeEach` (not `afterEach`)
  - Navigate to real page before clearing storage (cannot access storage on `data:` URLs)
  - Wrap storage clearing in try-catch for graceful error handling

# Accessibility Testing

**Principles**:  `REQUIRED`
- **Accessibility Coverage**: Critical user flows SHOULD include accessibility checks
- **Automated A11y Testing**: Use automated accessibility testing tools (e.g., axe-core) in UI tests
- **Manual Review**: Automated tools complement but don't replace manual accessibility review
- **Keyboard Navigation**: Test keyboard-only navigation for critical workflows

**Integration Patterns**:  `RECOMMENDED`
- **Tool Integration**: Integrate accessibility testing tools into UI test framework
- **Selective Testing**: Run comprehensive accessibility tests on critical pages/flows
- **Baseline Violations**: Document and track known accessibility violations separately from new violations
- **Error Reporting**: Include accessibility violations in test failure reports

**Test Scope**:  `RECOMMENDED`
- **Critical Flows**: Include accessibility checks in smoke/critical workflow tests
- **Form Interactions**: Test form accessibility (labels, error messages, focus management)
- **Navigation**: Test keyboard navigation and focus management
- **Screen Reader**: Consider screen reader testing for critical user journeys

# Visual Testing Guidelines

**When to Use Visual Tests**:  `RECOMMENDED`
- **Brand-Critical Pages**: Use visual regression tests for pages where visual accuracy is critical (homepage, marketing pages)
- **Component Libraries**: Use visual tests for reusable UI components
- **Layout Changes**: Use visual tests to catch unintended layout regressions
- **Cross-Browser Consistency**: Use visual tests to verify consistent rendering across browsers

**When NOT to Use Visual Tests**:  `REQUIRED`
- **Dynamic Content**: Avoid visual tests for content that changes frequently (user-generated content, timestamps)
- **Animations**: Avoid visual tests for animated or transitioning elements
- **Third-Party Content**: Avoid visual tests for embedded third-party content (ads, widgets)
- **High-Maintenance Areas**: Avoid visual tests in areas that change frequently for design iterations

**Visual Test Best Practices**:  `RECOMMENDED`
- **Selective Coverage**: Use visual tests selectively, not for every page
- **Tolerance Configuration**: Configure appropriate tolerance for acceptable visual differences
- **Baseline Management**: Maintain and update visual test baselines carefully
- **Review Process**: Require human review for visual test failures before updating baselines

# Test Performance Guidelines

**Performance Principles**:  `REQUIRED`
- **Fast Feedback**: Tests SHOULD provide fast feedback to developers
- **Efficient Execution**: Tests SHOULD execute efficiently without unnecessary delays
- **Resource Usage**: Tests SHOULD use resources efficiently (avoid memory leaks, clean up properly)

**Optimization Strategies**:  `RECOMMENDED`
- **Parallel Execution**: Design tests to run in parallel safely (no shared state)
- **Selective Execution**: Run only relevant tests during development (e.g., affected tests)
- **Test Data Efficiency**: Use efficient test data setup (fixtures, factories) rather than slow operations
- **Wait Strategies**: Use efficient wait strategies (explicit waits) rather than fixed delays
- **Test Isolation**: Ensure tests don't interfere with each other, enabling parallel execution

**Time Budgets**:  `RECOMMENDED`
- **Unit Tests**: Should complete in milliseconds to seconds
- **Integration Tests**: Should complete in seconds to minutes
- **UI Tests**: Should complete in seconds to minutes per test
- **Test Suite**: Define time budgets for entire test suites and monitor execution time

# Test Data Management

**Principles**:  `REQUIRED`
- **Uniqueness**: Each test should use unique test data to avoid conflicts in parallel execution
- **Idempotency**: Test setup should be idempotent (can run multiple times safely)
- **Identifiability**: Test data should be easily identifiable for cleanup/debugging (e.g., prefixes like "TEST_", timestamps)
- **Disposability**: Test data should be disposable and cleaned up after tests

**Patterns**:
- **Unique Identifiers**: Use timestamps, UUIDs, or random suffixes for test data (e.g., `TestUser_${Date.now()}`)
- **Test Data Factories**: Create reusable factory functions for generating test data with sensible defaults
- **Test Data Cleanup**: Explicitly document cleanup strategy (immediate cleanup, deferred cleanup, or intentional retention for debugging)
- **Parallel Execution**: Ensure test data uniqueness when tests run in parallel (each worker needs unique data)

# Error Handling & Exception Testing

**Principles**:  `REQUIRED`
- **Test Error Paths**: Every feature with error conditions SHOULD have corresponding error tests
- **Error Assertions**: Assert both error messages and error states (UI visibility, API status codes, error types)
- **Error Recovery**: Test recovery paths when applicable (retry mechanisms, fallback behaviors)
- **Exception Handling**: Tests SHOULD verify that exceptions are handled gracefully, not just that they occur

**Patterns**:
- **Negative Test Cases**: Include at least one negative test case per positive scenario
- **Error Message Validation**: Verify error messages are user-friendly and actionable
- **Error State Assertions**: Check that UI reflects error state correctly (disabled buttons, error indicators, etc.)
- **Network Errors**: Test handling of network failures, timeouts, and server errors
- **Validation Errors**: Test client-side and server-side validation error handling
- **Boundary Conditions**: Test edge cases that trigger errors (empty inputs, max length, invalid formats)

# Bug Management During Test Implementation

**CRITICAL RULE**: When tests fail and we identify a bug in feature code, we DO NOT fix the feature code.

## Process

1. **Do NOT fix the feature code** - Our role is to create and validate tests, not to fix bugs
2. **Document the bug** - Add to test plan's Bugs section with:
   - Bug ID (sequential number)
   - Description of the bug
   - Test(s) that detect the bug
   - Expected behavior vs actual behavior
   - Impact/severity
   - Date discovered
   - Root cause analysis (if determined)
   - Affected endpoint/component
   - Recommendations for fix
3. **Do NOT adjust tests** - Leave the test(s) failing until the bug is fixed by the development team
4. **Move on** - Continue with test implementation for other features/endpoints

**Rationale**: Tests serve as bug detectors. If we adjust tests to match buggy behavior, we lose this detection capability. Tests must remain failing until bugs are fixed.

## When Tests Fail

### Step 1: Investigate Root Cause
- Review actual implementation code
- Verify expected vs actual behavior
- Determine if failure is due to:
  - Test issue (incorrect expectations, test bug)
  - Feature bug (implementation doesn't match requirements)

### Step 2: If Test Issue
- Fix the test to match correct behavior
- Update test expectations based on actual implementation
- Verify fix with test run

### Step 3: If Feature Bug
- Document bug in test plan (do NOT fix feature code)
- Leave test failing
- Continue with other test implementation

# Establish Test Guardrails Upfront
- Define structure, conventions, and data strategies before automation.  `REQUIRED`
- Explicitly state exclusions per test type.  `REQUIRED`
- Use micro-sprint planning to enforce guardrails incrementally.  `RECOMMENDED`

# Example Test Header
```yaml
# ---
# test_type: unit
# module: payments
# risk: high
# requirement: REQ-1234
# assumptions:
#   - payment service available
# success_criteria: Payment record created in DB and receipt emailed
# tags: [payments, critical]
# ---
```
# LLM Guide — Generate UI Test Cases

> A practical, step‑by‑step recipe for an LLM to read requirements and produce human‑readable UI test cases (user‑perspective), split into **General UI Functionality** and **Critical Workflows (End‑to‑End / Smoke)**.

---

## Goals of this guide

1. Give an LLM a clear algorithm to review requirements, acceptance criteria, and designs, then produce a prioritized list of test cases written **from an end‑user perspective**.  
2. Ensure each test case contains precise **preconditions**, **data/environment assumptions**, **step‑by‑step actions**, **expected result(s)**, and **clear pass/fail criteria** (including examples of historical failures where useful).  
3. Separate test cases into two buckets: **General UI Functionality** (visual/interaction checks across browsers) and **Critical Workflows** (core business end‑to‑end scenarios that form the smoke suite).

---

## High‑level workflow (what the LLM must do)

1. **Ingest inputs**: requirements, user stories, acceptance criteria, designs (images/wireframes), API contracts, and any known non‑functional constraints (browsers, screen sizes, localization rules).  
2. **Normalize language**: extract actors (user roles), user goals, preconditions, success criteria, and invariants (things that must never change).  
3. **Map acceptance criteria → test objectives**: convert each acceptance criterion into one or more measurable test objectives. If acceptance criteria are missing or ambiguous, flag the specific gaps (don’t invent missing business rules).  
4. **Generate scenarios**: for each objective, produce: positive/«happy path» scenario(s), negative/error path(s), and at least one edge/limit case where applicable.  
5. **Annotate each scenario** with: priority (smoke/critical, high/medium/low), cross‑browser requirement, expected performance thresholds (if given), and automation feasibility notes.  
6. **Group and dedupe**: merge scenarios that duplicate coverage; cluster similar UI checks to avoid noisy duplicates across pages.  
7. **Output**: a human‑readable test case list and a compact machine‑friendly format (JSON or Gherkin) suitable for quick automation conversion.

---

## Test case template (required fields)

Each generated test case must include the following fields and be written in plain language a non‑technical product manager or tester can read and understand.

- **Test Case ID**: `TC-{feature}-{sequential}` (e.g., `TC-Login-001`)  
- **Title (user perspective)**: short sentence describing what the user is doing (e.g., "User logs in with valid credentials").  
- **Type**: `General UI` or `Critical Workflow`  
- **Priority/Tag**: e.g., `smoke`, `regression`, `sanity`, `visual`, `accessibility`  
- **Related requirement / acceptance criterion**: copy or reference the exact acceptance criterion text that this test covers.  
- **Preconditions / Setup**: exactly what state or data must exist before the test runs (accounts, feature flags, environment, cookies/cache state). Be explicit: include API calls, database fixtures, and the exact account role (e.g., `user@example.com, role=standard`) if relevant.  
- **Test data**: sample values or a pointer to fixtures (e.g., `user: user+ui1@example.com, pass: Password1!`).  
- **Steps (end‑user language)**: numbered steps describing what the user does, written as actions (clicks, types, selects), not implementation details. Keep them deterministic.  
- **Expected result(s)**: exact, testable outcomes after each step or at the end of the flow (UI text, element visibility, navigation, server response code if relevant).  
- **Pass/Fail criteria (explicit)**: concrete rules where test is considered failed (e.g., "Fail if confirmation message does not contain reference number or if status code ≠ 200"). Include tolerance for minor rendering differences only when acceptable.  
- **Known/Example failure modes**: historical or likely failures tied to this object (e.g., "form submission silently fails with no message", "button is off‑screen on 320px width").  
- **Cross‑browser / platform notes**: browsers and devices where this must run (e.g., Chrome Win, Safari iOS 16, Firefox Linux).  
- **Accessibility checks**: any A11y expectations (focus order, aria attributes, keyboard operability).  
- **Automation notes**: stable locators to use (`data-testid`, `id`, accessible names), suggested retry/wait strategy, and whether to run headless or with headed browser for visual debugging.  
- **Maintenance guidance**: how often to run (on PR, nightly), who owns it, and any flaky flags.

---

## How to review requirements (LLM checklist)

For each requirement or user story, the LLM should run the following checklist and either produce tests or produce a short list of clarification requests:

1. **Does the story include acceptance criteria?** If yes → proceed. If no → emit a minimal set of candidate acceptance criteria and label them `needs-clarification`.  
2. **Actors & roles identified?** List user roles affected.  
3. **Happy path defined?** If not, synthesize the most-likely happy path and label as `assumption` with the explicit text of the assumption.  
4. **Error states defined?** If not, enumerate plausible error states (validation errors, server errors, network timeouts).  
5. **Data dependencies enumerated?** For each dependency (external service, payment gateway), create a test double strategy (mock, contract test, sandbox).  
6. **UI expectations present?** If designs exist, extract pixel‑agnostic expectations (layout order, required fields, labels, messages).  
7. **Non‑functional constraints captured?** (performance thresholds, browser support, localization).  

> **Important**: when the LLM synthesizes anything (assumptions, missing acceptance criteria), it must highlight those items as `ASSUMPTION` so a human can validate them easily.

---

## Producing General UI Functionality tests

These are tests that verify component behavior, rendering, and interactions across supported browsers. Guidelines:

- Write from the user's perspective and keep each test focused on a single UI control or small set of related controls (e.g., a form or a modal).  
- Include a visual/UX expectation: placement, label, truncated text rules, responsive breakpoint behavior.  
- Use deterministic checks for UI state (isVisible, hasText, isEnabled) rather than pixel matching. Reserve pixel‑diff visual tests for approved screens only (e.g., homepage hero).  
- Include accessibility checks where applicable.  

**Examples of General UI tests the LLM should output** (the full examples are in the canvas document):

- Verify required+optional field markers and inline validation for the checkout address form.  
- Verify table column resize and sort persistence for an account list.  

---

## Producing Critical Workflow (End‑to‑End) tests

Critical workflows are business priorities (signup + purchase, submit claim, publish content). They should be written as complete outcomes rather than component checks: "Given X, when Y, then Z (user achieves outcome)."

Guidelines:

- Keep them robust: prefer asserting final outcomes (order recorded with ID + confirmation) over intermediate UI states unless intermediate states are business‑critical.  
- Minimize brittle assertions: avoid checking temporary messages that are UI‑specific unless they are part of the acceptance criteria.  
- Make data cleanup explicit: the test must either use disposable test accounts or include teardown steps that remove created artifacts.  

**Examples of Critical Workflow tests the LLM should output** (the full examples are in the canvas document):

- End‑to‑end order placement: from product selection → checkout → payment (sandbox) → order confirmation + DB row exists.  
- Password reset: request reset → receive token via test email endpoint → set new password → login with new password.

---

## Fail criteria — concrete examples the LLM must include

Every test must include specific fail criteria. Examples the LLM should add when relevant:

- "Fail if the server returns an HTTP 5xx for any API call that the UI requires to complete the action."  
- "Fail if a success confirmation is not displayed within X seconds (where X is an agreed acceptable limit)."  
- "Fail if text content differs from agreed message catalog entry by more than the allowed variance (e.g., variable tokens are permitted, but core sentence must match)."  
- "Fail if required field does not show inline validation on blur or submit."  

---

## Data‑environment and test data guidelines (assumptions)

- Prefer dedicated test accounts and isolated test tenants.  
- State exact fixture creation commands or API calls where possible; prefer idempotent setup so tests can run in parallel.  
- When relying on third‑party sandboxes, assert that sandbox is available and otherwise fall back to mocks.  
- If tests require precise dates/times, always use a fixed timezone and clock‑freeze strategy in the test environment.

---

## Automation considerations (for the automation engineer)

- **Selectors**: recommend `data-testid` or stable `id` first, then accessible names; avoid brittle XPaths.  
- **Waits**: prefer explicit waits for element states (visible, clickable) and API responses over arbitrary sleeps.  
- **Parallelization**: ensure tests are isolated (unique test data) and use independent fixtures.  
- **Screenshots**: capture on failure and attach DOM snapshot where feasible.  
- **Retry policy**: only for flakiness known and documented; otherwise fix the root cause.  

---

## Prompt templates the LLM should use (examples)

1. **Short prompt to generate test cases from a user story**

```
Input: [User story text]
Designs: [URL or description]
Acceptance criteria: [list]
Browsers: [list]
Output format: JSON array of test cases with fields (ID, Title, Type, Priority, Preconditions, Steps, ExpectedResults, FailCriteria, Selectors, Tags)

Produce: 1) A prioritized list of test cases (brief). 2) For each test case, full human‑readable description using the test case template.
```

2. **Full prompt for a feature that spans pages (E2E)**

```
You are a QA engineer. Read the following feature description + acceptance criteria. Generate 8 candidate test cases, mark 3 as smoke. For each smoke test, provide: Test Case ID, Title (user perspective), Preconditions, Test Data, Steps, Expected Results, Pass/Fail criteria, and Automation notes (preferred locators). Any assumptions you made — mark them ASSUMPTION.
```

---

## Prioritization rules (how LLM chooses smoke vs general)

- Mark `smoke` if the scenario: 1) delivers critical business value (purchase, signup, payment), 2) is a dependency for many other features (auth), or 3) was recently flaky in production.  
- Mark `visual` if the check is rendering/branding critical (landing page hero, marketing banner) and must be validated across viewports.  

---

## Maintenance & versioning guidance

- Include a `lastReviewedDate` and a `source` pointer for every test case pointing to the original requirement or design.  
- When requirements change, update the test case `changeLog` with: `what changed`, `who approved`, and `date`.  
- For tests generated by LLMs, include a `confidence` score (low/medium/high) and a short human verification checklist for a reviewer.

---

## Deliverables the LLM should produce

1. Compact prioritized list (CSV/CSV‑like) of test case IDs + short titles + tags.  
2. Full human‑readable test cases in the template above (MD or JSON).  
3. A separate automated‑friendly export (Gherkin, Playwright snippets, or JSON) for quick automation kick‑off.  
4. A short `ASSUMPTIONS` section listing anything the LLM invented.

---

## Quick heuristics & reminders for the LLM

- Always prefer clarity over cleverness.  
- Don’t invent unknown business rules; mark them ASSUMPTION.  
- Keep steps deterministic and idempotent.  
- Include explicit teardown instructions for tests that create persistent data.  

---

## Appendix: short examples

> See the included example test cases for both a General UI test and a Critical Workflow test in the examples section below. (These are written in the same template.)


*End of document.*


# CI/CD Integration Patterns

**Environment Configuration**:  `REQUIRED`
- Tests must work in both local development and CI environments
- Use environment variables for configuration differences (e.g., `CI=true` for headless mode)
- Ensure all dependencies are properly installed and configured in CI pipeline
- Document environment-specific requirements

**Test Execution Strategy**:  `RECOMMENDED`
- Group tests by type and risk level
- Define time budgets per test type
- Quarantine flaky tests; triage root causes
- Use parallel execution where possible (ensure test isolation)

**Reporting & Debugging**:  `RECOMMENDED`
- Capture screenshots on test failures (UI tests)
- Capture request/response logs (Integration tests)
- Generate test reports in standard formats (JUnit XML, HTML)
- Archive test artifacts for debugging

**Test Debugging Strategies**:  `RECOMMENDED`
- **Failure Artifacts**: Capture comprehensive artifacts on test failure (screenshots, logs, network traces, DOM snapshots)
- **Reproducibility**: Ensure test failures can be reproduced locally
- **Isolation Testing**: Run failing tests in isolation to identify dependencies
- **Logging**: Include meaningful log messages in tests to aid debugging
- **Debug Mode**: Support debug mode for tests (e.g., headed browser, extended timeouts, verbose logging)

# Quality Checks & CI Signals
- Group tests by type and risk.
- Define time budgets per test type.
- Quarantine flaky tests; triage root causes.

# Test Metrics & Monitoring

**Key Metrics to Track**:  `RECOMMENDED`
- **Test Execution Time**: Track test execution time trends to identify performance regressions
- **Test Pass Rate**: Monitor test pass rates to identify flaky tests or systematic issues
- **Test Coverage**: Track code coverage metrics (but don't optimize for coverage alone)
- **Flaky Test Rate**: Track frequency of flaky tests to identify problematic areas
- **Test Maintenance Cost**: Track time spent maintaining tests to identify high-maintenance areas

**Monitoring Practices**:  `RECOMMENDED`
- **CI Integration**: Integrate test metrics into CI/CD dashboards
- **Trend Analysis**: Monitor metrics over time to identify trends and regressions
- **Alerting**: Set up alerts for significant changes in test metrics
- **Reporting**: Generate regular test health reports for team review

# Change Management
- Update this doc when patterns change; version and approve required rule changes.
- Document exceptions explicitly for both REQUIRED and RECOMMENDED rules.

# Test Review Guidelines

**Code Review Checklist**:  `RECOMMENDED`
- **Test Clarity**: Test intent should be clear from test name and structure
- **Test Independence**: Verify test can run in isolation without dependencies
- **Assertion Quality**: Assertions should verify meaningful outcomes, not implementation details
- **Test Data**: Verify test data is appropriate and doesn't rely on external state
- **Error Handling**: Verify error scenarios are tested appropriately
- **Documentation**: Verify test documentation explains non-obvious decisions
- **Performance**: Verify test doesn't include unnecessary waits or delays
- **Maintainability**: Verify test uses stable selectors and follows project patterns

**Review Focus Areas**:  `RECOMMENDED`
- **Test Coverage**: Does the test cover the intended scenario adequately?
- **Test Reliability**: Is the test likely to be flaky or brittle?
- **Test Maintainability**: Will this test be easy to update when code changes?
- **Test Performance**: Does the test run efficiently?
- **Test Documentation**: Are assumptions and decisions clearly documented?

# Test Maintenance Patterns

**Maintenance Principles**:  `REQUIRED`
- **Refactor Tests with Code**: When application code changes, update tests accordingly
- **Remove Obsolete Tests**: Delete tests that no longer verify relevant behavior
- **Update Test Data**: Keep test data current with application changes
- **Monitor Test Health**: Track flaky tests and address root causes

**Common Maintenance Tasks**:  `RECOMMENDED`
- **Selector Updates**: Update selectors when UI changes (prefer stable selectors to minimize updates)
- **Test Data Updates**: Update test data when data models or validation rules change
- **Test Organization**: Reorganize tests when features are refactored or restructured
- **Documentation Updates**: Update test documentation when patterns or assumptions change
- **Performance Optimization**: Optimize slow tests to maintain reasonable test suite execution time

**Flaky Test Management**:  `REQUIRED`
- **Identify Root Causes**: Investigate and document root causes of flaky tests
- **Fix, Don't Retry**: Address root causes rather than increasing retry counts
- **Quarantine**: Temporarily disable or quarantine flaky tests until fixed
- **Monitor**: Track flaky test frequency and patterns over time

# Appendix: Glossary & References
- Oracle → success/failure criteria.
- References: Microsoft, IBM, Selenium, Cypress, Testing Best Practices Guides.

