-- One-time seed for the DEMO studio (slug = 'demo') so the walkthrough video
-- has real workers, real services, and real photos instead of empty screens.
-- Paste into Supabase → SQL Editor → New query → Run once.

-- Owner's personal photo (shown in "עלינו" + greeting), on the demo studio row.
update studios set owner_photo_url = 'https://images.pexels.com/photos/3993455/pexels-photo-3993455.jpeg?auto=compress&cs=tinysrgb&w=600'
where slug = 'demo';

-- Two workers (business-mode demo).
insert into employees (studio_id, name, title, color, avatar_url, about, active, sort_order)
select id, 'מאיה כהן', 'מניקוריסטית בכירה', '#D9738F',
  'https://images.pexels.com/photos/17909398/pexels-photo-17909398.jpeg?auto=compress&cs=tinysrgb&w=600',
  '5 שנות ניסיון בבניית ציפורניים ועיצוב אקססורי.', true, 0
from studios where slug = 'demo';

insert into employees (studio_id, name, title, color, avatar_url, about, active, sort_order)
select id, 'שירה לוי', 'מומחית פדיקור ספא', '#9A4E72',
  'https://images.pexels.com/photos/5128190/pexels-photo-5128190.jpeg?auto=compress&cs=tinysrgb&w=600',
  'מתמחה בטיפולי ספא לרגליים ועיצוב ציפורניים עדין.', true, 1
from studios where slug = 'demo';

-- Turn on business mode so the demo shows off multi-worker scheduling too.
update studios set business_mode = true where slug = 'demo';

-- Three services with real photos.
insert into services (studio_id, name, duration, price, gradient, image_url, active, sort_order)
select id, 'מניקור ג''ל', 60, 130, 'linear-gradient(135deg,#D9738F,#F4C9D4)',
  'https://images.pexels.com/photos/3997381/pexels-photo-3997381.jpeg?auto=compress&cs=tinysrgb&w=600',
  true, 0
from studios where slug = 'demo';

insert into services (studio_id, name, duration, price, gradient, image_url, active, sort_order)
select id, 'בניית ציפורניים', 90, 180, 'linear-gradient(135deg,#7C2A53,#D9738F)',
  'https://images.pexels.com/photos/9099607/pexels-photo-9099607.jpeg?auto=compress&cs=tinysrgb&w=600',
  true, 1
from studios where slug = 'demo';

insert into services (studio_id, name, duration, price, gradient, image_url, active, sort_order)
select id, 'פדיקור ספא', 75, 150, 'linear-gradient(135deg,#5E1F40,#9A4E72)',
  'https://images.pexels.com/photos/17056222/pexels-photo-17056222.jpeg?auto=compress&cs=tinysrgb&w=600',
  true, 2
from studios where slug = 'demo';
