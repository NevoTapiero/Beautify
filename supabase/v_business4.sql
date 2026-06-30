-- ───────────────────────────────────────────────────────────────────────────
-- BUSINESS EDITION V4: per-employee notification preferences.
-- Run once in the Supabase SQL editor. Idempotent.
-- ───────────────────────────────────────────────────────────────────────────
alter table employees add column if not exists notify_day_start boolean not null default true;
alter table employees add column if not exists notify_appt      boolean not null default true;
