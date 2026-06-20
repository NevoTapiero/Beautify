-- ============================================================
-- Beautify — schema v2 patch
-- Adds a safe "is this contact blocked?" check used at registration time,
-- before the visitor is authenticated (so normal RLS can't answer it).
-- Paste into Supabase → SQL Editor → New query → Run. Safe & idempotent.
-- (Does NOT delete anything — unlike schema_v2.sql, this is safe to re-run.)
-- ============================================================

create or replace function is_contact_blocked(p_studio uuid, p_phone text, p_email text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from clients
    where studio_id = p_studio
      and blocked = true
      and (phone = p_phone or (p_email is not null and p_email <> '' and email = p_email))
  );
$$;

-- Allow anyone (even not-yet-signed-in visitors) to call it.
grant execute on function is_contact_blocked(uuid, text, text) to anon, authenticated;

-- Let a client cancel (delete) her OWN pending/rejected uploads (note 19).
-- (The studio still owns approved photos; clients can't delete those.)
drop policy if exists gallery_delete_own on gallery;
create policy gallery_delete_own on gallery for delete
  using (status in ('pending', 'rejected')
         and client_id in (select id from clients where auth_user_id = auth.uid()));
