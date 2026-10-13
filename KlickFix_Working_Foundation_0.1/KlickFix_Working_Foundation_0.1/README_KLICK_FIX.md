# Klick Fix — Recovered Diagnostic Engine Foundation

**Status:** recovered source snapshot; automated tests passed in the provided environment on 2026-10-13. Not a complete production application.

## What is included
- The source tree recovered from `FixIQ_Master_Engine_v6_All_Layers(1).zip`.
- Diagnostic engine layers through v4 orchestration, including historical v1–v3.6 layers.
- Test suite and architecture / QA notes from the archive.
- A master checklist distinguishing implemented engine work from production integrations still missing.

## Run tests
Requirements: Node.js (tested with Node 22.16.0; no third-party dependencies are declared in package.json).

1. Install Node.js if it is not already installed.
2. Open a terminal in the `engine` folder.
3. Run `npm test`.

The recovered archive's test command passed all included suites in the inspection environment. Results are recorded in `MASTER_CHECKLIST.md`. Passing tests verify the included tests only; they do not prove real-world diagnostic accuracy or production readiness.

## Important limitations
- This is a framework-neutral diagnostic engine, not a finished web application.
- The included part records are development fixtures, not a verified live parts catalog.
- Probability outputs are provisional unless supported by sufficient verified repair-outcome data.
- Model and error-code seed data must not be treated as authoritative manufacturer evidence.
- Supabase, OpenAI, OCR, Stripe, Vercel, user accounts, production security, and live content sources are not connected by this archive.
- Keep all original FixIQ archives unchanged as historical backups.

## Naming note
The project is now called **Klick Fix**. Historical internal filenames and module names still say `FixIQ`; these have been preserved for traceability and should be renamed systematically only after the baseline is reviewed.
