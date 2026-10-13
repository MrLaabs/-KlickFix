# FixIQ v3.6 — Real Probability Calibration

## Purpose

v3.6 adds a statistically disciplined learning layer to FixIQ. The engine can compare its previous diagnostic probabilities with **verified repair outcomes** and gradually calibrate future probability estimates.

### Critical rule

> A probability is not called calibrated merely because FixIQ produced a percentage.

Before enough verified outcomes exist, FixIQ labels the result **provisional**. This prevents false precision and prevents a small or unreliable dataset from teaching the engine bad habits.

## Learning loop

```text
Customer symptoms
      ↓
FixIQ diagnosis
      ↓
Probability + evidence
      ↓
Recommended test / repair
      ↓
Repair completed
      ↓
Verified outcome
      ↓
Calibration dataset
      ↓
Reliability + error metrics
      ↓
Future probability adjustment
```

## What counts as a verified outcome?

A calibration record must contain:
- unique prediction ID
- failure-mode ID
- the probability FixIQ actually produced
- confirmed/rejected outcome
- `verificationStatus: verified`
- `repairStatus: completed`
- a non-customer-guess outcome source

Duplicate prediction IDs are rejected. Incomplete, unverified, or customer-guess outcomes are excluded from calibration.

## Calibration method

v3.6 uses three layers:

1. **Reliability bins** — predictions are grouped into probability ranges and compared with observed repair outcomes.
2. **Bayesian smoothing** — small samples are shrunk toward a conservative prior instead of being allowed to swing wildly.
3. **Sample-weighted adjustment** — empirical evidence gradually influences the original evidence-based probability as the verified sample grows.

Default readiness thresholds:
- at least 30 verified outcomes for a failure mode
- at least 10 outcomes in the relevant probability bin

These are engineering safeguards, not claims about the amount of data ultimately needed for every appliance family.

## Metrics

v3.6 reports:
- Brier score
- log loss
- observed confirmation rate
- smoothed global rate
- reliability bins
- per-failure-mode sample counts

Lower Brier score and lower log loss are generally better.

## Important separation

v3.6 does **not** replace the diagnostic engine's evidence ranking with historical frequency alone.

The existing diagnostic engine remains responsible for reasoning from:
- symptoms
- answers
- model evidence
- error-code evidence
- compatibility evidence
- contradictions
- safety conditions

Calibration adjusts the interpretation of probability using verified outcomes.

## Production direction

When Supabase is added, outcome records should be stored as immutable audit events with:
- prediction ID
- session ID
- appliance/model identity
- diagnosis version
- knowledge-base version
- model/error-code/parts registry versions
- prediction timestamp
- outcome timestamp
- verified outcome source
- repair/test evidence
- final repair result

This version intentionally keeps the calibration layer storage-agnostic so it can be connected to Supabase without redesigning the reasoning engine.
