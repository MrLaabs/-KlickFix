# FixIQ v4 QA Report

Date: 2026-10-07

## New v4 tests
- Intake validation: PASS
- Full orchestration output: PASS
- Evidence summary generation: PASS
- Safety gate presence: PASS
- Parts verification guard preserved: PASS
- Explanation generation: PASS
- Session creation: PASS
- Immutable answer application: PASS

## Regression
All v1–v3.6 suites are executed by `npm test` before v4 tests.

## Architectural assertions
- Safety remains authoritative.
- Parts compatibility remains separate from diagnosis.
- Calibration remains limited to verified completed outcomes.
- Unknown information is not fabricated.
- External AI is an orchestration adapter, not the source of truth.
