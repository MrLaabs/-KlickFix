# Klick Fix Safety Review — Foundation 0.2.0

Date: 2026-10-13
Scope: targeted review of the orchestration safety path; not a full safety certification.

## Finding addressed

The conversation entry point used `safetyEngine.evaluate()`, but direct calls to the orchestration function (including the current `/diagnose` adapter) relied mainly on safety terms in the diagnostic result. This created an inconsistent path: hazardous language in the original intake could be missed by the orchestration-level gate if it was not reflected in the engine result.

## Change made

- The orchestrator now runs the shared safety keyword screen against intake symptom/description/error-code text as well as the existing diagnostic-result checks.
- If the screen flags a hazard, the orchestration response is marked `blocked`, the safety result is set to `professional_required`, and follow-up questions are suppressed.
- Regression tests cover gas odor, carbon-monoxide alarm, and smoke language on the direct orchestration path.
- The default `npm test` command now also runs the conversation-engine and architecture smoke tests.

## Validation

The complete configured test command passed during preparation of this version using Node.js 22.16.0.

## Remaining risks / required work

- Keyword matching is incomplete and can miss euphemisms, misspellings, non-English text, or hazards not represented in the rules. It can also produce false positives.
- This is not a substitute for independent expert review, emergency instructions, or a comprehensive hazard model.
- Safety checks should eventually be evaluated before diagnostic inference, and every user-visible pathway must preserve the hard-stop behavior.
- Expand and test electrical, gas, fire, carbon-monoxide, water/electricity, refrigerant, chemical, and other relevant hazard scenarios with qualified review.
- Verify the API adapter and future web UI cannot accidentally continue a blocked session.

## Simulated specialist notes (initial)

1. **Product:** a clear stop state must be understandable and prominent.
2. **Architecture:** enforce safety at shared orchestration boundaries, not only one chat entry point.
3. **Implementation:** avoid duplicated independent keyword logic; use the shared safety engine.
4. **Appliance diagnostics:** hazard coverage needs appliance-specific review by qualified technicians.
5. **Data quality:** store rule source, revision, and validation status as the catalog grows.
6. **QA:** test direct API calls as well as conversational calls and normal diagnostic paths.
7. **Safety:** a keyword screen is a partial safeguard, not a guarantee; urgent hazards must stop troubleshooting.
8. **UX/accessibility:** blocked states need plain language, high visibility, and no conflicting repair steps.
9. **Business:** do not market safety performance or diagnostic accuracy beyond what is validated.
10. **Independent critic:** passing tests proves the tested cases only; it does not establish comprehensive coverage.

These are simulated review perspectives, not reviews by ten actual independent professionals.
