# FixIQ Adaptive Diagnostic Engine v2

## What changed
- Added an adaptive question layer so an incomplete answer becomes the next useful question instead of a dead end.
- Added symptom aliases and plain-language inputs.
- Added safety-first stops for gas smell, smoke, sparks, water/electrical hazards, and severe burning conditions.
- Expanded the four launch appliances: refrigerator, washer, dryer, dishwasher.
- Added more fault families: leaks, ice makers, frost, freezing food, washer fill/overfill/vibration/agitation, dryer tumble/burning smell, dishwasher fill/drying/odor/noise.
- Added explicit "I don't know" handling.
- Added a final-answer guard: every supported path returns either a likely cause, a safety stop, or a concrete next observation/test.

## Important product rule
FixIQ should never promise that every appliance can be diagnosed to a failed part from symptoms alone. The stronger promise is:

**No dead ends. No invented certainty. Every answer ends with the best-supported cause or the safest next test/question.**

The deterministic engine is the source of diagnostic logic. An AI layer can translate the questions and explanations into friendly language, but it must not invent test results or skip required evidence.

## Files
- `src/adaptiveDiagnosticEngine.js` — adaptive diagnostic core
- `tests/adaptiveEngine.test.js` — regression/edge-case tests
- `src/diagnosticEngine.js` — original v1 engine retained for comparison
