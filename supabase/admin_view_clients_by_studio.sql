-- Read-only: every client across every studio, grouped by salon.
-- Run in Supabase → SQL Editor. Safe, no writes.
select
  s.name  as studio_name,
  s.slug  as studio_slug,
  c.name  as client_name,
  c.phone,
  c.email,
  c.blocked,
  c.auth_email_migrated_at is not null as email_login_migrated,
  c.created_at
from clients c
join studios s on s.id = c.studio_id
order by s.name, c.created_at;
