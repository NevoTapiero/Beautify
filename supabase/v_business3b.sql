-- ───────────────────────────────────────────────────────────────────────────
-- BUSINESS EDITION V2 — Phase 3b: employee schedule-change approvals + employee
-- notifications. Run once in the Supabase SQL editor. Idempotent.
-- ───────────────────────────────────────────────────────────────────────────

-- An employee's proposed schedule change, awaiting manager approval.
-- (The locked device runs as the manager auth, so RLS is manager-scoped; the
-- employee/manager distinction is a UI workflow, not a security boundary.)
create table if not exists schedule_requests (
  id          uuid primary key default gen_random_uuid(),
  studio_id   uuid not null references studios(id) on delete cascade,
  employee_id uuid references employees(id) on delete cascade,
  kind        text not null,                 -- weekly | day | break | closeday
  payload     jsonb not null default '{}',
  label       text,                          -- human-readable summary
  status      text not null default 'pending',  -- pending | approved | declined
  created_at  timestamptz not null default now()
);
alter table schedule_requests enable row level security;
drop policy if exists schedule_requests_all on schedule_requests;
create policy schedule_requests_all on schedule_requests for all
  using (is_studio_manager(studio_id)) with check (is_studio_manager(studio_id));

-- Notifications can target an employee (not only a client).
alter table notifications alter column client_id drop not null;
alter table notifications add column if not exists employee_id uuid references employees(id) on delete cascade;
