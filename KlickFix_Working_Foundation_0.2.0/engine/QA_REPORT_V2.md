# FixIQ Diagnostic Engine v2 — QA Report

## Test results
- Original regression scenarios: **40/40 PASS**
- Adaptive targeted scenarios: **85 PASS**
- Fuzzed answer combinations: **8,265 PASS**
- Session/state tests: **PASS**
- Total automated scenarios executed in this pass: **8,390+**

## What v2 adds
1. Adaptive questioning rather than a single static questionnaire.
2. Plain-language symptom aliases (for example "not heating" → "no heat").
3. Explicit handling of "I don't know" / "not sure" answers.
4. Safety gate before normal diagnosis.
5. More symptom families for refrigerator, washer, dryer, and dishwasher.
6. Leak-source localization.
7. A session layer that remembers answers and history.
8. Contradiction warnings for observations that should be rechecked.
9. A maximum-question guard so the conversation cannot loop forever.
10. A terminal result contract: likely cause, safety stop, or concrete next test/escalation.

## Product rule
The engine should never manufacture certainty just to make a customer feel like they received an answer. The correct FixIQ behavior is:

**No dead ends. No invented test results. No blind parts cannon.**

When evidence is insufficient, FixIQ gives the user the most useful next observation/test and explains why that test matters.

## Remaining work before production
- Manufacturer/model-specific service data.
- Verified error-code library.
- Verified parts catalog with fitment and supersession data.
- Actual measured diagnostic outcome data for probability calibration.
- Source citations/service-manual references per rule.
- AI conversation layer with strict structured-output validation.
- Web/mobile UI and Supabase session persistence.
- OCR/model-number pipeline.
- Technician mode with meter-test workflows and advanced measurements.
- Production security, logging, rate limits, and monitoring.

## Important limitation
The fuzz tests prove the encoded decision tree is internally robust across the tested combinations. They do **not** prove that every physical appliance failure in the real world is represented. Real-world completeness requires manufacturer/model coverage and outcome data.
