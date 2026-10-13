# FixIQ Diagnostic Engine v3.2 — Diagnostic Evidence Graph

## What changed

v3.2 connects FixIQ's knowledge-base records into a diagnostic evidence graph instead of treating each failure mode as an isolated record.

The graph connects:

- symptoms → candidate failures
- observations → supporting/contradicting failures
- failures → components
- failures → systems
- failures → diagnostic tests
- failures → related causal/contributing failures

### Why this matters

A symptom such as **no heat** can point to several components. A failed thermal cutoff may be a real failed part, but it can also be a downstream result of restricted airflow. v3.2 therefore adds a second reasoning layer:

1. identify the likely failed component;
2. inspect connected evidence;
3. check whether a related condition could have caused or contributed to the finding;
4. recommend investigating the related condition before declaring the part the root cause.

This is an important step toward FixIQ behaving like a diagnostic technician rather than a parts-guessing chatbot.

## Important scoring rule

The graph does **not** replace the deterministic safety engine. Safety stops remain authoritative.

Graph causal adjustments are deliberately small and explainable. They are decision-support adjustments, not claimed real-world probabilities. Real probability calibration still requires verified repair outcomes.

## v3.2 assets

- `src/evidenceGraph.js` — graph construction, causal relationships, graph validation, graph-aware adjustment helpers
- `src/evidenceGraph.snapshot.json` — inspectable graph snapshot
- `src/v3_2DiagnosticEngine.js` — v3.2 public diagnostic facade
- `tests/v3_2.test.js` — graph and causal-reasoning regression tests
- `tests/v3_2_fuzz.test.js` — 10,000 generated v3.2 diagnostic cases
- `QA_REPORT_V3_2.md` — release QA report

## Validation target

The v3.2 release must preserve all earlier deterministic/adaptive behavior while adding the graph layer. The full package test command therefore runs the v1/v2/v3/v3.1 regression tests plus v3.2 tests.
