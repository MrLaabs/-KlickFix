# Klick Fix

Klick Fix is an appliance-diagnostic project for homeowners and appliance technicians. The goal is to ask useful follow-up questions, rank possible causes from evidence, explain results in plain language, and put safety first.

## Status

This is a **development foundation**, not a finished or production-ready commercial application. It includes a framework-neutral diagnostic engine, API adapter, database blueprint, knowledge-data fixtures, and automated tests. A customer-facing Next.js website, production integrations, authoritative complete knowledge catalog, and deployment are not finished.

## Project map

- `engine/src/` — diagnostic, evidence, safety, orchestration, and registry logic
- `engine/api/` — framework-neutral API handler adapter
- `engine/data/` — current appliance catalog and calibration policy fixtures
- `engine/db/` — database schema blueprint
- `engine/tests/` — automated tests
- `MASTER_BUILD_PLAN.md` — phased implementation plan
- `MASTER_CHECKLIST.md` — recovered baseline and completeness checklist
- `SAFETY_REVIEW_0.2.0.md` — first targeted safety review and changes

## Run tests

Install a current supported Node.js release. Open a terminal in the `engine` folder and run:

```bash
npm test
```

The suite was run successfully during preparation of this version using Node.js 22.16.0. Passing automated tests do not establish real-world diagnostic accuracy or replace expert review.

## Important accuracy and safety limits

- Scores are provisional unless supported by enough verified repair outcomes.
- Seeded model, error-code, and parts data are not a complete authoritative live catalog.
- A keyword safety screen can miss hazards and is not a substitute for professional emergency guidance or comprehensive safety validation.
- Never commit API keys, passwords, or other secrets.
