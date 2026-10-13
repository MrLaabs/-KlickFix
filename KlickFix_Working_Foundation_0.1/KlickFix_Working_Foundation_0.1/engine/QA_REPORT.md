# FixIQ MVP QA Report — v1

## Automated regression test
40 scenarios total:
- Refrigerator: 10
- Washer: 10
- Dryer: 10
- Dishwasher: 10

All 40 scenarios are designed to return a controlled result. The suite checks status, cause, next step, safety guidance, confidence bounds, and that undetermined cases contain follow-up questions.

## Improvements made
- Replaced a brittle TypeScript draft with a clean runnable JavaScript core.
- Added explicit safety-stop behavior for smoke, sparks, and gas smell.
- Added targeted follow-up questions to every intentionally undetermined branch.
- Kept the diagnostic engine deterministic so the same answers produce the same result.
- Separated the diagnostic core from future AI behavior.

## Still required
- Real model-specific data.
- Verified parts catalog.
- Manufacturer/service-manual source validation.
- More complete symptom and error-code coverage.
- Empirical probability calibration from real repair outcomes.
- UI/API/Supabase/OpenAI/OCR/Stripe/Vercel integration.
