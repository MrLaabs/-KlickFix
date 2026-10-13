# FixIQ v3.4 Release Notes — Error-Code Intelligence

Built on v3.3 without overwriting prior versions.

### Added
- `src/errorCodeRegistry.js`
- `src/v3_4DiagnosticEngine.js`
- `tests/v3_4.test.js`
- `README_V3_4.md`
- `QA_REPORT_V3_4.md`

### Improvements
- normalized error-code matching
- exact model context
- manufacturer/appliance filtering
- provenance and verification gates
- system/component/failure/test hooks
- safety hooks
- unknown-code fallback
- transparent error-code reasoning
- protection against error-code-as-diagnosis behavior

### Validation
All previous regression suites pass, including 10,000 v3.2 generated cases, plus the v3.4 suite.
