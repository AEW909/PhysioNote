create temporary table discharge_note_ids on commit drop as
select id, appointment_id
from public.clinical_notes
where note_type = 'discharge';

update public.clinical_notes
set current_version_id = null
where id in (select id from discharge_note_ids);

delete from public.note_versions
where clinical_note_id in (select id from discharge_note_ids);

delete from public.clinical_notes
where id in (select id from discharge_note_ids);

delete from public.appointments
where id in (
  select appointment_id
  from discharge_note_ids
  where appointment_id is not null
);
