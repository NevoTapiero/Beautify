-- Clones the DEMO studio's visual content (colors, logo, photos, services,
-- employees, gallery) into nevo-nails, so nevo-nails looks exactly like the
-- demo for filming the beautician walkthrough video — but running as the
-- real (non-demo) app, full-screen, no phone-mockup chrome.
-- Only visual/content fields are copied; the studio's own identity (name,
-- owner_name, slug, owner_id) is left untouched.
-- Paste into Supabase → SQL Editor → New query → Run once.

-- 1) Studio-level look & feel.
update studios set
  logo_url = 'https://mdlnafimawmxvcynidbl.supabase.co/storage/v1/object/public/avatars/403dca05-6005-4d0e-a36b-b3d27d6e66b8/logo/1783094844649_test-owner-photo.png',
  owner_photo_url = 'https://images.pexels.com/photos/3993455/pexels-photo-3993455.jpeg?auto=compress&cs=tinysrgb&w=600',
  color_primary = '#7C2A53',
  color_accent = '#D9738F',
  brand_name = 'Beautify',
  about = 'אני מוצאת בעולם הקוסמטיקה אומנות לכל דבר ועניין',
  business_mode = true
where slug = 'nevo-nails';

-- 2) Clear any existing services/employees/gallery on nevo-nails first, so
--    re-running this script doesn't duplicate rows.
delete from gallery   where studio_id = (select id from studios where slug = 'nevo-nails');
delete from services  where studio_id = (select id from studios where slug = 'nevo-nails');
delete from employees where studio_id = (select id from studios where slug = 'nevo-nails');

-- 3) Employees (the same two workers as the demo).
insert into employees (studio_id, name, title, color, avatar_url, about, active, sort_order)
select id, 'מאיה כהן', 'מניקוריסטית בכירה', '#D9738F',
  'https://images.pexels.com/photos/17909398/pexels-photo-17909398.jpeg?auto=compress&cs=tinysrgb&w=600',
  '5 שנות ניסיון בבניית ציפורניים ועיצוב אקססורי.', true, 0
from studios where slug = 'nevo-nails';

insert into employees (studio_id, name, title, color, avatar_url, about, active, sort_order)
select id, 'שירה לוי', 'מומחית פדיקור ספא', '#9A4E72',
  'https://images.pexels.com/photos/5128190/pexels-photo-5128190.jpeg?auto=compress&cs=tinysrgb&w=600',
  'מתמחה בטיפולי ספא לרגליים ועיצוב ציפורניים עדין.', true, 1
from studios where slug = 'nevo-nails';

-- 4) The 3 active services shown in the demo booking flow.
insert into services (studio_id, name, duration, price, gradient, image_url, active, sort_order)
select id, 'מניקור ג''ל', 60, 130, 'linear-gradient(135deg,#D9738F,#F4C9D4)',
  'https://images.pexels.com/photos/3997381/pexels-photo-3997381.jpeg?auto=compress&cs=tinysrgb&w=600',
  true, 0
from studios where slug = 'nevo-nails';

insert into services (studio_id, name, duration, price, gradient, image_url, active, sort_order)
select id, 'בניית ציפורניים', 90, 180, 'linear-gradient(135deg,#7C2A53,#D9738F)',
  'https://images.pexels.com/photos/9099607/pexels-photo-9099607.jpeg?auto=compress&cs=tinysrgb&w=600',
  true, 1
from studios where slug = 'nevo-nails';

insert into services (studio_id, name, duration, price, gradient, image_url, active, sort_order)
select id, 'פדיקור ספא', 75, 150, 'linear-gradient(135deg,#5E1F40,#9A4E72)',
  'https://images.pexels.com/photos/17056222/pexels-photo-17056222.jpeg?auto=compress&cs=tinysrgb&w=600',
  true, 2
from studios where slug = 'nevo-nails';

-- 5) The 5 approved gallery photos, linked to the matching employee by name.
insert into gallery (studio_id, image_url, caption, uploaded_by, status, employee_id)
select id, 'https://images.pexels.com/photos/34835286/pexels-photo-34835286.jpeg?auto=compress&cs=tinysrgb&w=800',
  'לק ג''ל עם נצנצים', 'מאיה כהן', 'approved',
  (select id from employees where studio_id = studios.id and name = 'מאיה כהן')
from studios where slug = 'nevo-nails';

insert into gallery (studio_id, image_url, caption, uploaded_by, status, employee_id)
select id, 'https://images.pexels.com/photos/13038494/pexels-photo-13038494.jpeg?auto=compress&cs=tinysrgb&w=800',
  'מניקור צרפתי קלאסי', 'מאיה כהן', 'approved',
  (select id from employees where studio_id = studios.id and name = 'מאיה כהן')
from studios where slug = 'nevo-nails';

insert into gallery (studio_id, image_url, caption, uploaded_by, status, employee_id)
select id, 'https://images.pexels.com/photos/7066298/pexels-photo-7066298.jpeg?auto=compress&cs=tinysrgb&w=800',
  'עיצוב ציפורניים צבעוני', 'שירה לוי', 'approved',
  (select id from employees where studio_id = studios.id and name = 'שירה לוי')
from studios where slug = 'nevo-nails';

insert into gallery (studio_id, image_url, caption, uploaded_by, status, employee_id)
select id, 'https://images.pexels.com/photos/34997574/pexels-photo-34997574.jpeg?auto=compress&cs=tinysrgb&w=800',
  'מניקור צרפתי עדין', 'שירה לוי', 'approved',
  (select id from employees where studio_id = studios.id and name = 'שירה לוי')
from studios where slug = 'nevo-nails';

insert into gallery (studio_id, image_url, caption, uploaded_by, status, employee_id)
select id, 'https://images.pexels.com/photos/34885842/pexels-photo-34885842.jpeg?auto=compress&cs=tinysrgb&w=800',
  'עיצוב פרחוני ורוד', 'הסלון של נבו', 'approved', null
from studios where slug = 'nevo-nails';
