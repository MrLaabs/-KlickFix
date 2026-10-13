# FixIQ QA Report — v3.3 Model-Specific Intelligence

Version: **3.3.0**  
Baseline: **v3.2.0 Diagnostic Evidence Graph**

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
| model registry validation | PASS — 6 seed records |

## v3.3 coverage
1. Model-number normalization
2. Exact matching
3. Alias architecture
4. Family/series matching
5. Unknown-model fallback
6. Manufacturer filtering
7. Provisional identity handling
8. Protection against unverified scoring influence
9. Human-readable model reasoning
10. Parts/error-code integration hooks
11. Safety/test/failure-mode extension points
12. Preservation of generic diagnostic behavior

## Quality gate
If FixIQ does not have verified model-specific evidence, it must identify the model without pretending to know more than it actually knows.

## Limitation
Seed records are development fixtures from known FixIQ model identifiers and are marked provisional. They do not change diagnostic probabilities.

## Next target
v3.4 — **Error-Code Intelligence Layer**.
