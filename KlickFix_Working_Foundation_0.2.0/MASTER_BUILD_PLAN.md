# Klick Fix Master Build Plan

Updated: 2026-10-13

## Product target

Build a safety-first appliance diagnostic assistant for homeowners and appliance technicians. It should ask focused follow-up questions, track answers and evidence, rank possible causes, explain uncertainty in plain language, and recommend professional help when appropriate.

## Phase 0 — Preserve and review the recovered engine
- [x] Recover the prior engine archive and preserve original ZIP backups.
- [x] Run the recovered test suite successfully in the inspection environment.
- [x] Upload the recovered foundation to GitHub.
- [x] Review the orchestration and direct-diagnosis safety path.
- [x] Add a regression test for gas, smoke, and carbon-monoxide warning inputs on the direct orchestration path.
- [x] Include conversation/architecture checks in the standard `npm test` command.
- [ ] Re-run tests from a clean local clone after this update is committed.
- [ ] Independently review all safety-critical behavior.
- [ ] Correct the existing repository's duplicated folder nesting after a clean root-level baseline is verified.

## Phase 1 — Define the first complete user journey
1. User selects appliance type.
2. User enters brand/model if known and describes the symptom.
3. App asks one focused follow-up question at a time.
4. Engine tracks answers/evidence and checks safety conditions.
5. Results show ranked causes, evidence, uncertainty, and safe next steps.
6. App tells the user when to stop and seek qualified help.

- [ ] Review this journey through ten simulated specialist perspectives: product management, software architecture, implementation, appliance diagnostics, data quality, QA, safety, UX/accessibility, business, and independent critique.
- [ ] Set acceptance criteria and failure cases before expanding the UI.
- [ ] Separate homeowner-facing steps from technician-only checks involving electricity, gas, refrigerants, fire, or other hazards.

## Phase 2 — Build the first web MVP
- [ ] Create a Next.js + React + Tailwind app shell.
- [ ] Implement appliance selection and symptom intake.
- [ ] Connect the existing engine through a defined API adapter.
- [ ] Add adaptive questions, answer editing, progress, and session handling.
- [ ] Display ranked results with evidence and plain-language explanations.
- [ ] Add responsive, accessible layouts and clear safety stops.
- [ ] Test the main journey end-to-end.

## Phase 3 — Improve coverage and evidence quality
- [ ] Inventory coverage and identify appliance gaps.
- [ ] Prioritize one appliance family for a complete end-to-end release slice.
- [ ] Source model-specific information, error codes, and parts data from authoritative references.
- [ ] Track source, date, model scope, and confidence for knowledge records.
- [ ] Validate recommendations against verified repair outcomes.
- [ ] Calibrate probability estimates only when sufficient verified outcome data exists.

## Phase 4 — Production services and operations
- [ ] Decide and document database schema and Supabase integration.
- [ ] Add accounts only when needed for saved user history.
- [ ] Add server-side AI integration, secret handling, input validation, and rate limits.
- [ ] Evaluate model-label photo/OCR.
- [ ] Add logging, monitoring, privacy/consent controls, backups, and security review.
- [ ] Configure deployment and domain.
- [ ] Evaluate payments after core diagnostic value and pricing are tested.

## Release gates

Do not call the app production-ready until critical safety behavior is independently reviewed, clean installs/tests are repeatable, user inputs and secrets are protected, uncertainty is communicated, supported appliance scope is explicit, and end-to-end/accessibility checks pass.

## Operating rules

Preserve original backups. Make small reviewable changes. Do not invent manufacturer specifications, error-code meanings, part compatibility, or real-world failure probabilities. Passing software tests is not the same as validated real-world diagnostic accuracy.
