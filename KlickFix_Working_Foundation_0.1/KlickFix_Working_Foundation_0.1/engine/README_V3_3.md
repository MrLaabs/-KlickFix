# FixIQ Diagnostic Engine v3.3 — Model-Specific Intelligence

v3.3 adds the first model-intelligence layer on top of v3.2's Diagnostic Evidence Graph.

## Added
- Canonical model registry
- Manufacturer, series, model metadata
- Model-number normalization
- Exact, alias, family/series, and unknown matching
- Provenance and verification status
- Hooks for model-specific systems, components, failures, tests, safety requirements, error codes, and compatible parts
- Human-readable model reasoning
- Conservative generic fallback
- Protection against invented model-specific facts

## Critical quality rule
A model being identified is **not** the same as having verified model-specific diagnostic evidence.

Current seed records are `provisional` / `identity_only`. They recognize model context but do **not** alter probabilities. Only verified records with `evidenceStatus: verified` are eligible to influence scoring.

## API
`src/modelRegistry.js`
- `normalizeModelNumber`
- `normalizeManufacturer`
- `normalizeSeries`
- `findModel`
- `buildModelContext`
- `validateModelRegistry`
- `getModelRecords`

`src/v3_3DiagnosticEngine.js`
- `diagnoseV3_3`
- `buildModelContext`
- `validateModelRegistry`

## Versioning
All prior versions remain preserved. v3.3 is additive and uses v3.2 as its baseline.
