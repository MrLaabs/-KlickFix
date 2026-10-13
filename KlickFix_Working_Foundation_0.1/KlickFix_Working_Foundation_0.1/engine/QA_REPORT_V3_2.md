# FixIQ v3.2 QA Report — Diagnostic Evidence Graph

## Release

- Engine: FixIQ Diagnostic Engine v3.2.0
- Knowledge Base: v3.1.0
- Graph: 3.2.0
- Scope: evidence graph + causal reasoning layer

## Test results

- Original deterministic scenarios: **40/40 PASS**
- Adaptive diagnostic scenarios: **85/85 PASS**
- Fuzzed legacy/adaptive combinations: **8,265/8,265 PASS**
- v3 regression suite: **PASS**
- v3.1 knowledge-base suite: **48 failure modes — PASS**
- v3.2 graph suite: **PASS**
- v3.2 generated cases: **10,000/10,000 PASS**
- Evidence graph integrity: **PASS**
- Graph nodes: **353**
- Graph edges: **434**

## v3.2 behavior verified

1. Safety-stop behavior remains inherited from the v3.1 deterministic/adaptive engine.
2. Candidate diagnoses are connected to graph evidence.
3. Causal/contributing relationships can be surfaced for the top candidate.
4. Graph-aware causal adjustments are applied only to explicitly modeled causal relationships.
5. A downstream finding can trigger a root-cause warning instead of being treated as the entire repair explanation.
6. Unknown/unsupported answers do not crash the graph layer.
7. Existing v3.1 behavior remains regression-tested.

## Design limitations intentionally preserved

- Graph relationships are expert-authored rules, not learned causal probabilities.
- Probability values remain provisional decision-support scores.
- Model-specific compatibility is still a future layer.
- Error-code intelligence is still a future layer.
- Verified parts data is still a future layer.
- Real-world calibration requires confirmed repair outcomes.

## Release decision

**PASS — suitable as the next internal development baseline.**

This release should not yet be described as a production appliance diagnosis system. The evidence graph is a foundation for the next model-specific, error-code, parts, and outcome-calibration layers.
