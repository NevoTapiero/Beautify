-- ───────────────────────────────────────────────────────────────────────────
-- BUSINESS EDITION V2 — Phase 2: per-cosmetician schedules.
-- Each cosmetician (owner = employee_id NULL, or an employee) has her own
-- working hours, per-date overrides, and breaks. Run once. Idempotent.
-- ───────────────────────────────────────────────────────────────────────────

-- Add employee_id to the schedule tables (NULL = the owner / studio herself).
alter table work_hours     add column if not exists employee_id uuid references employees(id) on delete cascade;
alter table work_overrides add column if not exists employee_id uuid references employees(id) on delete cascade;
alter table breaks         add column if not exists employee_id uuid references employees(id) on delete cascade;

-- Replace the old (studio_id, weekday/date) primary keys with uniqueness that
-- also includes the cosmetician. NULLS NOT DISTINCT (PG15+) keeps the owner to
-- a single row per weekday/date.
alter table work_hours     drop constraint if exists work_hours_pkey;
alter table work_overrides drop constraint if exists work_overrides_pkey;
create unique index if not exists work_hours_uniq     on work_hours     (studio_id, weekday, employee_id) nulls not distinct;
create unique index if not exists work_overrides_uniq on work_overrides (studio_id, date,    employee_id) nulls not distinct;

-- Availability now reads the chosen cosmetician's own hours + breaks.
create or replace function available_slots(p_studio uuid, p_date date, p_duration int, p_employee uuid default null)
returns setof text language plpgsql security definer stable
set timezone = 'Asia/Jerusalem' as $$
declare
  v_wd int := extract(dow from p_date);
  v_open time; v_close time; v_is_open boolean;
  v_slot timestamptz; v_window_end timestamptz; v_cand_end timestamptz;
  v_dur interval := make_interval(mins => p_duration);
begin
  select is_open, start_time, end_time into v_is_open, v_open, v_close
    from work_overrides where studio_id = p_studio and date = p_date
      and employee_id is not distinct from p_employee;
  if not found then
    select is_open, start_time, end_time into v_is_open, v_open, v_close
      from work_hours where studio_id = p_studio and weekday = v_wd
        and employee_id is not distinct from p_employee;
  end if;
  if not found or not coalesce(v_is_open, false) then return; end if;

  v_slot := (p_date + v_open)::timestamptz;
  v_window_end := (p_date + v_close)::timestamptz;

  while v_slot + v_dur <= v_window_end loop
    v_cand_end := v_slot + v_dur;
    if v_slot > now()
       and not exists (
         select 1 from appointments a join services s on s.id = a.service_id
         where a.studio_id = p_studio and a.status <> 'cancelled'
           and (p_employee is null or a.employee_id = p_employee)
           and tstzrange(a.starts_at, a.starts_at + make_interval(mins => s.duration))
               && tstzrange(v_slot, v_cand_end))
       and not exists (
         select 1 from breaks b where b.studio_id = p_studio
           and b.employee_id is not distinct from p_employee
           and tstzrange(b.starts_at, b.ends_at) && tstzrange(v_slot, v_cand_end))
    then
      return next to_char(v_slot, 'HH24:MI');
    end if;
    v_slot := v_slot + interval '15 minutes';
  end loop;
end $$;
