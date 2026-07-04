-- Adds 5 real, already-approved photos to the DEMO studio's gallery so the
-- gallery tab isn't empty for the walkthrough video.
-- Paste into Supabase → SQL Editor → New query → Run once.

insert into gallery (studio_id, image_url, caption, uploaded_by, status, employee_id)
select id, 'https://images.pexels.com/photos/34835286/pexels-photo-34835286.jpeg?auto=compress&cs=tinysrgb&w=800',
  'לק ג''ל עם נצנצים', 'מאיה כהן', 'approved',
  (select id from employees where studio_id = studios.id and name = 'מאיה כהן')
from studios where slug = 'demo';

insert into gallery (studio_id, image_url, caption, uploaded_by, status, employee_id)
select id, 'https://images.pexels.com/photos/13038494/pexels-photo-13038494.jpeg?auto=compress&cs=tinysrgb&w=800',
  'מניקור צרפתי קלאסי', 'מאיה כהן', 'approved',
  (select id from employees where studio_id = studios.id and name = 'מאיה כהן')
from studios where slug = 'demo';

insert into gallery (studio_id, image_url, caption, uploaded_by, status, employee_id)
select id, 'https://images.pexels.com/photos/7066298/pexels-photo-7066298.jpeg?auto=compress&cs=tinysrgb&w=800',
  'עיצוב ציפורניים צבעוני', 'שירה לוי', 'approved',
  (select id from employees where studio_id = studios.id and name = 'שירה לוי')
from studios where slug = 'demo';

insert into gallery (studio_id, image_url, caption, uploaded_by, status, employee_id)
select id, 'https://images.pexels.com/photos/34997574/pexels-photo-34997574.jpeg?auto=compress&cs=tinysrgb&w=800',
  'מניקור צרפתי עדין', 'שירה לוי', 'approved',
  (select id from employees where studio_id = studios.id and name = 'שירה לוי')
from studios where slug = 'demo';

insert into gallery (studio_id, image_url, caption, uploaded_by, status, employee_id)
select id, 'https://images.pexels.com/photos/34885842/pexels-photo-34885842.jpeg?auto=compress&cs=tinysrgb&w=800',
  'עיצוב פרחוני ורוד', 'הסלון של דנה', 'approved', null
from studios where slug = 'demo';
