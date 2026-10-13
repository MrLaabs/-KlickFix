# FixIQ v3.5 QA Report

## Release
`3.5.0`

## Scope
Verified Parts & Compatibility Intelligence.

## Results
| Suite | Result |
|---|---:|
| Original diagnostic | 40/40 PASS |
| Adaptive | 85/85 PASS |
| Fuzz | 8,265/8,265 PASS |
| v3 | PASS |
| v3.1 | PASS — 48 failure modes |
| v3.2 evidence graph | PASS — 353 nodes / 434 edges |
| v3.2 generated cases | 10,000/10,000 PASS |
| v3.3 model intelligence | PASS |
| v3.4 error-code intelligence | PASS |
| v3.5 parts compatibility | PASS |

## Critical safeguards tested
- unknown model cannot produce a verified part recommendation
- appliance-type-only match cannot produce a verified part recommendation
- provisional fixture parts cannot be presented as verified replacements
- explicitly incompatible parts cannot be recommended
- diagnostic engine remains functional when no part can be verified
- part compatibility is kept separate from diagnostic certainty

## Release decision
**PASS — ready as an internal architecture milestone.**

This is not a production parts catalog. Production recommendations require verified manufacturer/catalog evidence and provenance.
