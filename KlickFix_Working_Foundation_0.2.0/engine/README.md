# FixIQ Diagnostic Engine

This package contains the versioned FixIQ diagnostic engine. Version 3 adds the canonical knowledge-base and probability architecture while preserving the v2 adaptive core.

Run tests with:

    npm test

V3 entry point:

    const { diagnoseV3 } = require('./src/v3DiagnosticEngine');

V2 remains available for regression and comparison.
