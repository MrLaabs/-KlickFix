# FixIQ v3.6 QA Report — Real Probability Calibration

## Release

Version: **3.6.0**

## Scope

Added verified-outcome probability calibration without weakening the existing diagnostic, model, error-code, parts, or safety architecture.

## Tests

The full historical regression suite remains in the package and v3.6 adds dedicated calibration tests.

Coverage includes:
- invalid outcome rejection
- duplicate prediction rejection
- verified-outcome filtering
- insufficient-data provisional behavior
- calibration-ready behavior after sufficient verified outcomes
- probability bounds
- Brier score generation
- log-loss generation
- reliability bins
- v3.5 → v3.6 diagnostic integration

## Safety / trust guarantees

- Unverified outcomes do not calibrate probabilities.
- Customer guesses do not calibrate probabilities.
- Duplicate predictions do not count twice.
- Sparse samples remain provisional.
- Calibration never claims a part is compatible.
- Calibration does not override safety hard stops.
- The original evidence-based ranking remains intact.

## Release acceptance

v3.6 is accepted when the full package test command passes, including all v1/v2/v3/v3.1/v3.2/v3.3/v3.4/v3.5 regression suites and the v3.6 suite.
