# FixIQ Engine v3 QA Report

Date: 2026-10-07

## Results
- v3 targeted tests: PASS
- v2 regression suite: PASS
- v1 diagnostic scenarios: 40/40 PASS
- v2 adaptive scenarios: 85 PASS
- v2 fuzz combinations: 8,265 PASS
- session tests: PASS
- knowledge-base validation: PASS

## New v3 coverage
- Canonical appliance/system/symptom/failure model
- Explainable evidence scoring
- Candidate ranking
- Confidence classification
- Model compatibility hook
- Error-code match/contradiction hook
- Next-best-question scaffold
- Safety stop remains authoritative

## Release status
**v3 architecture is implemented and tested, but not production-calibrated.** Probability values are provisional until verified repair outcomes are collected. Model-specific parts, error codes, and compatibility data remain future layers.
