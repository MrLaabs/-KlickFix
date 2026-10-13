-- FixIQ production schema blueprint (Supabase/PostgreSQL)
create extension if not exists pgcrypto;
create table if not exists diagnostic_sessions(id uuid primary key default gen_random_uuid(), user_id uuid, appliance_type text not null, manufacturer text, model_number text, started_at timestamptz default now(), ended_at timestamptz, status text default 'active');
create table if not exists observations(id uuid primary key default gen_random_uuid(), session_id uuid references diagnostic_sessions(id) on delete cascade, key text not null, value text, source text not null, created_at timestamptz default now());
create table if not exists diagnoses(id uuid primary key default gen_random_uuid(), session_id uuid references diagnostic_sessions(id) on delete cascade, failure_mode_id text not null, probability numeric, confidence numeric, evidence jsonb default '[]', contradictions jsonb default '[]', created_at timestamptz default now());
create table if not exists diagnostic_outcomes(id uuid primary key default gen_random_uuid(), session_id uuid references diagnostic_sessions(id), diagnosis_id uuid references diagnoses(id), outcome_status text not null, verified boolean default false, repair_action text, part_number text, fixed_appliance boolean, verification_source text, created_at timestamptz default now());
create table if not exists knowledge_provenance(id uuid primary key default gen_random_uuid(), entity_type text not null, entity_id text not null, source text not null, verification_status text not null, source_url text, reviewed_at timestamptz);
create index if not exists idx_observations_session on observations(session_id);
create index if not exists idx_diagnoses_session on diagnoses(session_id);
create index if not exists idx_outcomes_verified on diagnostic_outcomes(verified, outcome_status);
