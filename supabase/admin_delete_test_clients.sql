-- Cleans up the throwaway test clients created while building/testing the
-- app this session (names all start with "בדיקת"/"בדיקה" — Hebrew for
-- "test"). Does NOT touch any other client, including תמר אדווה
-- (0506590083), who is a real client — just a legacy pre-email-login
-- account with a data quirk (see note at the bottom).

-- STEP 1 — preview what will be deleted. Read this list before running step 2.
select s.name as studio_name, c.name, c.phone, c.email, c.created_at
from clients c join studios s on s.id = c.studio_id
where c.name like 'בדיקת%' or c.name like 'בדיקה%'
order by c.created_at;

-- STEP 2 — actually delete them. Uncomment and run after checking step 1.
-- delete from clients where name like 'בדיקת%' or name like 'בדיקה%';

-- Note: the matching Supabase Auth accounts (auth.users) are NOT deleted by
-- the above — clients.auth_user_id has no cascade. They're left behind as
-- harmless orphaned logins nobody can reach from the app (not worth the risk
-- of hand-editing auth.users directly to remove them).
