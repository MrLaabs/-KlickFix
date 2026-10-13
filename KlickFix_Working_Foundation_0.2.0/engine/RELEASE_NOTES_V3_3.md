# FixIQ v3.3 Release Notes — Model-Specific Intelligence

Built on v3.2 without overwriting prior versions.

### Added
- `src/modelRegistry.js`
- `src/v3_3DiagnosticEngine.js`
- `tests/v3_3.test.js`
- `README_V3_3.md`
- `QA_REPORT_V3_3.md`

### Improvements
- exact/alias/family/unknown model matching
- model-number normalization
- provenance and verification status
- model-specific test/safety/error-code/parts hooks
- conservative scoring eligibility
- transparent model reasoning
- generic fallback when evidence is unavailable

### Validation
All prior regression suites pass, including 10,000 v3.2 fuzz cases, plus the v3.3 suite.
