-- ───────────────────────────────────────────────────────────────────────────
-- BUSINESS EDITION V1
-- Adds a per-studio "business mode" plus employees, invoices, and
-- employee-aware booking. Run once in the Supabase SQL editor. Idempotent.
-- ───────────────────────────────────────────────────────────────────────────

-- 1) Business mode switch on the studio.
alter table studios add column if not exists business_mode boolean not null default false;

-- 2) Employees (registered businesses can have staff).
create table if not exists employees (
  id          uuid primary key default gen_random_uuid(),
  studio_id   uuid not null references studios(id) on delete cascade,
  name        text not null,
  title       text,
  color       text not null default '#D9738F',
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
alter table employees enable row level security;
drop policy if exists employees_read  on employees;
drop policy if exists employees_write on employees;
create policy employees_read  on employees for select using (true);
create policy employees_write on employees for all
  using (is_studio_manager(studio_id)) with check (is_studio_manager(studio_id));

-- Appointments can be assigned to a specific employee.
alter table appointments add column if not exists employee_id uuid references employees(id) on delete set null;

-- 3) Invoices (issued per appointment). Real tax-authority invoices need an
--    external provider; this stores/numbers them in-app as the foundation.
create table if not exists invoices (
  id             uuid primary key default gen_random_uuid(),
  studio_id      uuid not null references studios(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  client_id      uuid references clients(id) on delete set null,
  number         int not null,
  amount         int not null default 0,
  client_name    text,
  service_name   text,
  status         text not null default 'issued',
  issued_at      timestamptz not null default now()
);
alter table invoices enable row level security;
drop policy if exists invoices_read  on invoices;
create policy invoices_read on invoices for select using (is_studio_manager(studio_id));

-- Issue an invoice for an appointment (sequential number per studio). Returns
-- the existing one if already issued, so it's safe to call twice.
create or replace function issue_invoice(p_appointment uuid)
returns invoices language plpgsql security definer as $$
declare a appointments; v_row invoices; v_price int; v_cname text; v_sname text; v_num int;
begin
  select * into a from appointments where id = p_appointment;
  if a.id is null then raise exception 'appointment not found'; end if;
  if not is_studio_manager(a.studio_id) then raise exception 'not your studio'; end if;

  select * into v_row from invoices where appointment_id = p_appointment limit 1;
  if v_row.id is not null then return v_row; end if;

  select price, name into v_price, v_sname from services where id = a.service_id;
  select name into v_cname from clients where id = a.client_id;
  select coalesce(max(number), 0) + 1 into v_num from invoices where studio_id = a.studio_id;

  insert into invoices(studio_id, appointment_id, client_id, number, amount, client_name, service_name, status)
    values (a.studio_id, p_appointment, a.client_id, v_num, coalesce(v_price, 0), v_cname, v_sname, 'issued')
    returning * into v_row;
  return v_row;
end $$;

-- 4) Employee-aware availability. When p_employee is given, only THAT
--    employee's appointments block a slot (others can serve in parallel);
--    when null it behaves studio-wide as before. Breaks are always studio-wide.
drop function if exists available_slots(uuid, date, int);
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
    from work_overrides where studio_id = p_studio and date = p_date;
  if not found then
    select is_open, start_time, end_time into v_is_open, v_open, v_close
      from work_hours where studio_id = p_studio and weekday = v_wd;
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
           and tstzrange(b.starts_at, b.ends_at) && tstzrange(v_slot, v_cand_end))
    then
      return next to_char(v_slot, 'HH24:MI');
    end if;
    v_slot := v_slot + interval '15 minutes';
  end loop;
end $$;
