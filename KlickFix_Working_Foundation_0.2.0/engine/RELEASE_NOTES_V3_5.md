# FixIQ v3.5 — Verified Parts & Compatibility Intelligence

## Purpose
v3.5 adds a compatibility guard between diagnostic reasoning and replacement-part recommendations.

## Core rule
A part is **not** presented as the correct replacement merely because its component type appears to match the diagnosis. FixIQ requires explicit compatibility evidence at the strongest available level.

## Compatibility levels
- exact model
- known model alias
- verified model family/series
- appliance-type only (context, never sufficient for a verified recommendation)
- no match

## Part evidence states
- verified
- manufacturer_confirmed
- provisional
- unverified
- incompatible

## Safety against wrong-part recommendations
When compatibility evidence is insufficient, FixIQ returns a clear no-guess decision and directs the workflow toward verification or further diagnosis.

## Supersession architecture
Part records include `supersedes` and `supersededBy` fields for future manufacturer-confirmed replacement chains.

## Diagnostic linkage
Part records can reference failure modes, allowing FixIQ to distinguish:
1. whether a part physically fits/is compatible, and
2. whether the diagnosis actually supports replacing that part.

## Important limitation
The included part records are development fixtures only. They are not a live retail catalog and are intentionally not treated as verified manufacturer compatibility data. Real manufacturer/catalog records will be added only when sourced and verified.

## Regression
- 40/40 original deterministic scenarios
- 85/85 adaptive scenarios
- 8,265/8,265 fuzz combinations
- v3 regression PASS
- v3.1 knowledge-base regression PASS (48 failure modes)
- v3.2 evidence graph PASS (353 nodes, 434 edges)
- 10,000/10,000 v3.2 generated cases
- v3.3 model intelligence PASS
- v3.4 error-code intelligence PASS
- v3.5 parts compatibility PASS
