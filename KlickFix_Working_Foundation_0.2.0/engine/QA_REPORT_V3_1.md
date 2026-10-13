# FixIQ Engine v3.1 QA Report

Date: 2026-10-07

## Result
ALL TESTS PASSED.

- 40/40 original deterministic diagnostic scenarios
- 85/85 adaptive diagnostic scenarios
- 8,265/8,265 fuzzed answer combinations
- Session/safety/max-question regression suite passed
- v3 regression suite passed
- v3.1 knowledge-base expansion suite passed

## Knowledge Base
48 failure modes are currently modeled across:
- Refrigerator
- Washer
- Dryer
- Dishwasher

Each failure mode can carry:
- appliance type
- system
- component
- symptom priors
- positive/negative evidence
- diagnostic tests
- safety-risk classification

## Probability Engine
v3.1 ranks candidates using evidence-adjusted logits and a softmax distribution across candidates. These percentages are explicitly provisional and must not be presented as measured real-world failure rates until calibrated against verified repair outcomes.

## Safety
Existing v2 safety-stop behavior remains intact. Safety classifications are retained in the candidate records for future policy enforcement and UI escalation.

## Important Limitation
This is still not production-ready. Model-specific compatibility, error-code data, verified parts, real repair-outcome calibration, AI orchestration, OCR, backend, UI, payments, and production security remain future work.
