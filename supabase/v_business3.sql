-- ───────────────────────────────────────────────────────────────────────────
-- BUSINESS EDITION V3: employees can have their own profile photo.
-- Run once in the Supabase SQL editor. Idempotent.
-- ───────────────────────────────────────────────────────────────────────────
alter table employees add column if not exists avatar_url text;
