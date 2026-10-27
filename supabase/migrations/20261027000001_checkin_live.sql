-- Longer pairing names (coffee: drink · method · roast · origin · extras) and "most paired with" grouped by the first part.
alter table public.checkin_pairings drop constraint if exists checkin_pairings_name_check;
alter table public.checkin_pairings add constraint checkin_pairings_name_check check (char_length(name) between 1 and 140);

create or replace function public.cigar_top_pairings(c uuid)
returns table (kind public.pairing_kind, name text, mentions bigint)
language sql stable security definer set search_path = public as $$
  select pa.kind, initcap(lower(split_part(pa.name, ' · ', 1))), count(*) as mentions
  from checkin_pairings pa join checkins ch on ch.id = pa.checkin_id
  where ch.cigar_id = c and ch.visibility = 'public'
  group by pa.kind, initcap(lower(split_part(pa.name, ' · ', 1)))
  order by mentions desc
  limit 6;
$$;
