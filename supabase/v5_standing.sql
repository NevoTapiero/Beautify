-- ───────────────────────────────────────────────────────────────────────────
-- V5: standing (recurring) weekly appointments.
-- A client requests a fixed weekly slot (day + time + service); the manager
-- approves it; the system auto-books a rolling 8-week horizon. Either side can
-- cancel. Run this whole file once in the Supabase SQL editor. It is idempotent
-- and non-destructive — safe to re-run.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists standing_requests (
  id          uuid primary key default gen_random_uuid(),
  studio_id   uuid not null references studios(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  service_id  uuid not null references services(id),
  weekday     int  not null,          -- 0=Sunday .. 6=Saturday (matches JS getDay / pg dow)
  "time"      text not null,          -- 'HH:MM'
  status      text not null default 'pending',  -- pending | approved | declined | cancelled
  created_at  timestamptz not null default now()
);

-- Link materialized appointments back to the standing rule that created them.
alter table appointments add column if not exists standing_id uuid references standing_requests(id) on delete set null;

alter table standing_requests enable row level security;
-- All access is via the SECURITY DEFINER functions below, so no table policies
-- are needed (RLS on + no policy = locked to definer functions only).

-- Client creates a request (resolved from her auth session). One active at a time.
create or replace function request_standing(p_studio uuid, p_service uuid, p_weekday int, p_time text)
returns standing_requests language plpgsql security definer as $$
declare v_client clients; v_row standing_requests;
begin
  select * into v_client from clients where studio_id = p_studio and auth_user_id = auth.uid() limit 1;
  if v_client.id is null then raise exception 'not a client of this studio'; end if;
  if exists (select 1 from standing_requests where client_id = v_client.id and status in ('pending','approved')) then
    raise exception 'already has an active standing request';
  end if;
  insert into standing_requests(studio_id, client_id, service_id, weekday, "time", status)
    values (p_studio, v_client.id, p_service, p_weekday, p_time, 'pending')
    returning * into v_row;
  return v_row;
end $$;

-- Create the concrete weekly appointments for the next p_weeks weeks, skipping
-- past times, already-created occurrences, and slots that collide with another
-- (non-cancelled) appointment. Times are anchored to Asia/Jerusalem.
create or replace function materialize_standing(p_id uuid, p_weeks int default 1)
returns void language plpgsql security definer as $$
declare r standing_requests; dur int; d date; ts timestamptz; i int;
begin
  select * into r from standing_requests where id = p_id;
  if r.id is null or r.status <> 'approved' then return; end if;
  select duration into dur from services where id = r.service_id;
  if dur is null then return; end if;
  for i in 0..(p_weeks * 7) loop
    d := current_date + i;
    if extract(dow from d)::int = r.weekday then
      ts := (d::text || ' ' || r."time")::timestamp at time zone 'Asia/Jerusalem';
      if ts < now() then continue; end if;
      if exists (select 1 from appointments where standing_id = r.id and starts_at = ts and status <> 'cancelled') then continue; end if;
      if exists (
        select 1 from appointments a join services s on s.id = a.service_id
        where a.studio_id = r.studio_id and a.status <> 'cancelled'
          and a.starts_at < ts + make_interval(mins => dur)
          and ts < a.starts_at + make_interval(mins => s.duration)
      ) then continue; end if;
      insert into appointments(studio_id, client_id, service_id, starts_at, status, standing_id)
        values (r.studio_id, r.client_id, r.service_id, ts, 'confirmed', r.id);
    end if;
  end loop;
end $$;

-- Manager approves a request, which books the rolling horizon.
create or replace function approve_standing(p_id uuid)
returns void language plpgsql security definer as $$
declare r standing_requests;
begin
  select * into r from standing_requests where id = p_id;
  if r.id is null then raise exception 'not found'; end if;
  if not is_studio_manager(r.studio_id) then raise exception 'not your studio'; end if;
  update standing_requests set status = 'approved' where id = p_id;
  perform materialize_standing(p_id, 1);   -- only the coming week (V6 note 24)
end $$;

-- Manager declines a pending request (no appointments created).
create or replace function decline_standing(p_id uuid)
returns void language plpgsql security definer as $$
declare r standing_requests;
begin
  select * into r from standing_requests where id = p_id;
  if r.id is null then return; end if;
  if not is_studio_manager(r.studio_id) then raise exception 'not your studio'; end if;
  update standing_requests set status = 'declined' where id = p_id;
end $$;

-- Either the owning client or the manager can end a standing slot. Future,
-- not-yet-arrived appointments from it are cancelled; past ones are kept.
create or replace function cancel_standing(p_id uuid)
returns void language plpgsql security definer as $$
declare r standing_requests;
begin
  select * into r from standing_requests where id = p_id;
  if r.id is null then return; end if;
  if not (is_studio_manager(r.studio_id) or client_owns(r.client_id)) then raise exception 'not allowed'; end if;
  update standing_requests set status = 'cancelled' where id = p_id;
  update appointments set status = 'cancelled'
    where standing_id = p_id and status = 'confirmed' and starts_at > now() and arrival_confirmed = false;
end $$;

-- Top up every approved standing slot for a studio (called on manager app load
-- so the horizon keeps rolling forward over time).
create or replace function topup_standing(p_studio uuid)
returns void language plpgsql security definer as $$
declare r standing_requests;
begin
  if not is_studio_manager(p_studio) then return; end if;
  for r in select * from standing_requests where studio_id = p_studio and status = 'approved' loop
    perform materialize_standing(r.id, 1);   -- keep just the coming week booked (V6 note 24)
  end loop;
end $$;

-- Reads.
create or replace function manager_standing(p_studio uuid)
returns table(id uuid, client_id uuid, client_name text, service_id uuid, service_name text, weekday int, "time" text, status text)
language sql security definer stable as $$
  select sr.id, sr.client_id, c.name, sr.service_id, s.name, sr.weekday, sr."time", sr.status
  from standing_requests sr
  join clients  c on c.id = sr.client_id
  join services s on s.id = sr.service_id
  where sr.studio_id = p_studio and sr.status in ('pending','approved')
  order by sr.status, sr.created_at;
$$;

create or replace function my_standing()
returns table(id uuid, service_id uuid, service_name text, weekday int, "time" text, status text)
language sql security definer stable as $$
  select sr.id, sr.service_id, s.name, sr.weekday, sr."time", sr.status
  from standing_requests sr
  join clients  c on c.id = sr.client_id
  join services s on s.id = sr.service_id
  where c.auth_user_id = auth.uid() and sr.status in ('pending','approved')
  order by sr.created_at;
$$;
