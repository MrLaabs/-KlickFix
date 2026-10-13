# FixIQ QA Report — v3.4 Error-Code Intelligence

Version: **3.4.0**  
Baseline: **v3.3.0 Model-Specific Intelligence**

| Suite | Result |
|---|---:|
| v1 deterministic regression | 40/40 PASS |
| v2 adaptive regression | 85/85 PASS |
| v2 fuzz regression | 8,265/8,265 PASS |
| session/safety/max-question regression | PASS |
| v3 knowledge/probability regression | PASS |
| v3.1 master KB regression | PASS — 48 failure modes |
| v3.2 evidence graph regression | PASS — 353 nodes / 434 edges |
| v3.2 generated fuzz | 10,000/10,000 PASS |
| v3.3 model intelligence tests | PASS |
| v3.4 error-code intelligence tests | PASS |
| error-code registry validation | PASS — 2 seed records |

## v3.4 coverage
1. Error-code normalization
2. Exact model error-code matching
3. Manufacturer/appliance filtering
4. Unknown-code fallback
5. Provisional-code handling
6. Scoring eligibility gate
7. Error-code context in diagnostic output
8. System/component/failure-mode hint architecture
9. Diagnostic-test hooks
10. Safety-requirement hooks
11. Human-readable explanation
12. Protection against error-code-only diagnosis
13. Preservation of generic behavior

## Quality gate
No error code may override contradictory symptom/test evidence. No unverified code mapping may change diagnostic probabilities.

## Current limitation
Seed error-code records are provisional case identifiers. They are not treated as authoritative manufacturer mappings. Verified manufacturer documentation and/or verified repair outcomes are required before scoring modifiers are activated.
