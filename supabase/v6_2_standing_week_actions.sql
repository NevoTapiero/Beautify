-- ───────────────────────────────────────────────────────────────────────────
-- V6.2: standing appointments no longer show as a regular appointment card.
-- Adds a "skip this week" action that cancels the current week's occurrence
-- and creates next week's, instead of the client using the normal cancel
-- button (which caused it to reappear on the next refresh). Run once.
-- ───────────────────────────────────────────────────────────────────────────

create or replace function standing_skip_week(p_id uuid)
returns void language plpgsql security definer as $$
declare r standing_requests; occ appointments; dur int; d date; ts timestamptz;
begin
  select * into r from standing_requests where id = p_id;
  if r.id is null then raise exception 'not found'; end if;
  if not (is_studio_manager(r.studio_id) or client_owns(r.client_id)) then raise exception 'not allowed'; end if;

  -- Cancel this week's occurrence (if any), and start searching the week after it.
  select * into occ from appointments
    where standing_id = p_id and status <> 'cancelled' and starts_at >= now()
    order by starts_at limit 1;
  if occ.id is not null then
    update appointments set status = 'cancelled' where id = occ.id;
    d := ((occ.starts_at at time zone 'Asia/Jerusalem')::date) + 7;
  else
    d := current_date + 7;
  end if;

  select duration into dur from services where id = r.service_id;
  if dur is null then return; end if;

  while extract(dow from d)::int <> r.weekday loop
    d := d + 1;
  end loop;
  ts := (d::text || ' ' || r."time")::timestamp at time zone 'Asia/Jerusalem';

  if exists (
    select 1 from appointments a join services s on s.id = a.service_id
    where a.studio_id = r.studio_id and a.status <> 'cancelled'
      and a.starts_at < ts + make_interval(mins => dur)
      and ts < a.starts_at + make_interval(mins => s.duration)
  ) then return; end if;

  insert into appointments(studio_id, client_id, service_id, starts_at, status, standing_id)
    values (r.studio_id, r.client_id, r.service_id, ts, 'confirmed', p_id);
end $$;
