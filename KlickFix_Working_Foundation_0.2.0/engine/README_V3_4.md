# FixIQ Diagnostic Engine v3.4 — Error-Code Intelligence

v3.4 adds an error-code intelligence layer on top of v3.3 Model-Specific Intelligence.

## Core principle
**An error code is evidence, not a diagnosis.**

FixIQ first normalizes the code, determines whether it belongs to the appliance/model context, checks provenance and verification status, and only then decides whether the code is allowed to influence diagnostic scoring.

## Added
- Canonical error-code registry
- Error-code normalization (`E-25`, `E25`, etc.)
- Manufacturer/appliance/model matching
- Exact-model matching architecture
- Error-code provenance and verification status
- System/component/failure-mode hint hooks
- Diagnostic-test hooks
- Safety-requirement hooks
- Conservative unknown-code fallback
- Human-readable error-code reasoning
- Explicit protection against treating an error code as proof of a failed part
- Scoring gate: only verified evidence may alter probabilities

## Current seed policy
The initial records preserve known FixIQ case identifiers such as `E25` and `D5 EL 05`, but they are **provisional / identity-only**. They therefore do not change probabilities yet.

This is intentional. FixIQ must not turn an unverified internet claim or a user's remembered code meaning into a false diagnosis.

## API
`src/errorCodeRegistry.js`
- `normalizeErrorCode`
- `findErrorCodes`
- `buildErrorCodeContext`
- `validateErrorCodeRegistry`
- `getErrorCodeRecords`

`src/v3_4DiagnosticEngine.js`
- `diagnoseV3_4`
- `buildErrorCodeContext`
- `validateErrorCodeRegistry`
- `normalizeErrorCode`

## Reasoning behavior
A future verified record can provide:

`Error Code → System → Component → Failure Mode → Test`

But the final diagnosis still has to agree with the user's symptoms and observed evidence.

For example, an error code associated with a drain system should increase attention to the drain system, but FixIQ should still ask whether water remains, whether the pump runs, whether the drain path is restricted, and whether the pump receives power before recommending a replacement.

## Versioning
All prior versions remain preserved. v3.4 is additive and uses v3.3 as its baseline.
