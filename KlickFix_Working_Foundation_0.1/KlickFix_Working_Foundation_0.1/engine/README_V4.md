# FixIQ v4 — AI Orchestration Layer

## Purpose
v4 turns the deterministic intelligence built in v1–v3.6 into one controlled diagnostic workflow.

The orchestration layer coordinates intake, adaptive questions, model intelligence, error-code intelligence, evidence-graph reasoning, probability calibration, parts compatibility, safety, and customer-facing explanation.

## Safety hierarchy
1. Safety hard stops
2. Verified diagnostic evidence
3. Model/error-code context
4. Calibrated probability when sufficient verified outcomes exist
5. Provisional evidence-based probability
6. Language-model wording/UX only

An external AI model may help interpret natural language, but it may not override these rules or invent model, error-code, part, or safety facts.

## Main API
- `orchestrate(input)` — full diagnostic orchestration
- `createSession(input)` — starts a session
- `applyAnswer(session, answer)` — safely advances a session without mutating the prior session
- `rankQuestions(result, answers)` — ranks available follow-up questions
- `buildEvidenceSummary(result)` — concise explainable evidence
- `safetyGate(result)` — orchestration-level safety gate
- `getReliabilityReport(records)` — calibration reporting

## Production boundary
This version is the engine/orchestration layer, not the public website. The next production layers are API/backend integration, persistent sessions, authentication, observability, controlled OpenAI adapter integration, OCR, and customer UI.
