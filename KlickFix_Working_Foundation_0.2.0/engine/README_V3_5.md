# FixIQ v3.5 — Verified Parts & Compatibility Intelligence

FixIQ v3.5 adds a controlled bridge from diagnosis to replacement-part compatibility.

## Why this matters
The most dangerous product mistake would be telling a homeowner to buy a part simply because it sounds like the likely failure. v3.5 therefore separates:

**Diagnosis:** What is probably wrong?

from

**Compatibility:** Is this exact part actually appropriate for this appliance?

A part can be compatible without being the right repair, and a diagnosis can be plausible without providing enough evidence to recommend a part. FixIQ keeps those decisions separate.

## Main module
`src/partsRegistry.js`

## Engine facade
`src/v3_5DiagnosticEngine.js`

## API concepts
- `findParts(query)`
- `matchPart(part, query)`
- `compatibilityDecision(part, query, diagnosticContext)`
- `buildPartsContext(query, diagnosticContext)`
- `validatePartsRegistry()`
- `diagnoseV3_5(...)`

## Current data policy
The bundled part records are development fixtures. They are deliberately not presented as real purchasable parts. This prevents FixIQ from creating false manufacturer compatibility claims before authoritative data is loaded.

## Next major layer
v3.6 should calibrate diagnostic probabilities using verified real-world repair outcomes, while preserving all v3.5 compatibility safeguards.
