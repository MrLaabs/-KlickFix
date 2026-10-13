# FixIQ Diagnostic Engine v3 — Knowledge Base + Probability Architecture

## What changed
- Preserves the v2 adaptive deterministic engine unchanged.
- Adds a canonical knowledge-base layer for appliance systems, symptoms, and failure modes.
- Adds an explainable probability scoring engine using bounded evidence weights.
- Adds compatibility/error-code hooks for future model-specific knowledge.
- Adds confidence classification and evidence explanations.
- Adds a next-best-question selector scaffold based on competing candidates.
- Keeps safety-stop decisions ahead of probability scoring.

## Important limitation
The percentages are **provisional decision-support scores**, not measured real-world failure rates. Production probabilities must be calibrated from verified repair outcomes and model-specific evidence.

## Architecture
`v2 diagnostic logic -> v3 knowledge candidates -> evidence scoring -> ranking -> confidence -> next-best-question`

## Next v3 work
1. Expand canonical failure catalog across all initial appliance scenarios.
2. Add error-code records and model compatibility records.
3. Add verified part records and supersession/compatibility rules.
4. Add formal information-gain question selection.
5. Add calibrated outcome data and probability validation.


## v3.1 Knowledge Base expansion
The canonical KB now covers 50+ appliance failure modes across refrigerator, washer, dryer, and dishwasher systems, with component, symptom, evidence, diagnostic-test, and safety-risk relationships. Values remain provisional until calibrated against verified repair outcomes.
