-- Password reset needs a real, deliverable email on the account. Managers
-- already log in with their real email, so this only concerns clients, who
-- log in by phone — under the hood their Supabase Auth account used an
-- internal placeholder email (phonedigits@clients.beautify.app), which
-- can't receive a reset link. New signups now use her real email as the
-- login identity directly; this migration adds the lookup function
-- (phone -> real email) the app needs to sign her in and to request a
-- reset, plus a flag so we know whether a given legacy account has been
-- moved onto her real email yet.
-- Paste into Supabase → SQL Editor → New query → Run once.

alter table clients add column if not exists auth_email_migrated_at timestamptz;

create or replace function client_login_info_for_phone(p_studio_id uuid, p_phone text)
returns table(email text, migrated boolean)
language sql security definer set search_path = public
as $$
  select email, auth_email_migrated_at is not null
  from clients
  where studio_id = p_studio_id
    and regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
    and email is not null and email <> ''
  limit 1;
$$;

grant execute on function client_login_info_for_phone(uuid, text) to anon, authenticated;
