-- Closes two RLS gaps found in a security re-audit: the clients_update and
-- appts_update policies allow a client to update ANY column on her own row
-- (RLS is row-level only, not column-level), so a client could, via the
-- anon key directly in devtools:
--   - change her own clients.studio_id to jump into another studio's roster
--   - change her own clients.blocked flag to un-block herself
--   - set her own appointment's status to 'completed'/'no_show' (outcomes
--     that should only ever be decided by the studio, not self-reported)
-- Verified live against the real database before writing this fix.
--
-- Note: appointments.paid IS legitimately client-settable (payAppointment
-- uses the client-role connection by design — an honor-system "I paid"
-- flag, not a real payment gateway) — left untouched here.
--
-- Paste into Supabase → SQL Editor → New query → Run once.

create or replace function clients_self_update_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_studio_manager(OLD.studio_id) then
    return NEW;
  end if;
  if NEW.studio_id is distinct from OLD.studio_id
     or NEW.auth_user_id is distinct from OLD.auth_user_id
     or NEW.blocked is distinct from OLD.blocked then
    raise exception 'not authorized to change this field';
  end if;
  return NEW;
end;
$$;

drop trigger if exists clients_self_update_guard_trg on clients;
create trigger clients_self_update_guard_trg before update on clients
for each row execute function clients_self_update_guard();

create or replace function appts_client_update_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_studio_manager(OLD.studio_id) then
    return NEW;
  end if;
  if NEW.status in ('completed', 'no_show') and OLD.status is distinct from NEW.status then
    raise exception 'not authorized to set this status';
  end if;
  return NEW;
end;
$$;

drop trigger if exists appts_client_update_guard_trg on appointments;
create trigger appts_client_update_guard_trg before update on appointments
for each row execute function appts_client_update_guard();
