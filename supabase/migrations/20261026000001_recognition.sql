-- Band (anilha) recognition log + barcode knowledge: reference barcodes, user-confirmed links.

-- ---------------------------------------------------------------------------
-- Band scans: each photo, what the AI read, what the user confirmed. This is the training set.
-- ---------------------------------------------------------------------------
create table public.band_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_path text,
  ai jsonb,
  candidate_ids uuid[] not null default '{}',
  chosen_cigar_id uuid references public.cigars(id) on delete set null,
  outcome text not null default 'pending' check (outcome in ('pending', 'confirmed', 'other', 'none')),
  created_at timestamptz not null default now()
);
create index band_scans_user_idx on public.band_scans (user_id, created_at desc);
alter table public.band_scans enable row level security;
create policy band_scans_select on public.band_scans for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy band_scans_insert on public.band_scans for insert to authenticated with check (user_id = auth.uid());
create policy band_scans_update on public.band_scans for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy band_scans_delete on public.band_scans for delete to authenticated using (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('band-photos', 'band-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy band_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'band-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy band_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'band-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy band_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'band-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ---------------------------------------------------------------------------
-- Reference barcodes (e.g. the California unflavored tobacco list): code -> product name + maker
-- ---------------------------------------------------------------------------
create table public.barcode_catalog (
  code text primary key,              -- digits only, leading zeros removed
  name text not null,
  maker text,
  source text not null default 'utl_ca'
);
create index barcode_catalog_prefix_idx on public.barcode_catalog (left(code, 7));
alter table public.barcode_catalog enable row level security;
create policy barcode_catalog_read on public.barcode_catalog for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- User-confirmed links between a scanned code and a catalog cigar
-- ---------------------------------------------------------------------------
create table public.barcode_links (
  code text not null,                 -- digits only, leading zeros removed
  cigar_id uuid not null references public.cigars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  trusted boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (code, cigar_id, user_id)
);
create index barcode_links_code_idx on public.barcode_links (code);
alter table public.barcode_links enable row level security;
create policy barcode_links_read on public.barcode_links for select to authenticated using (true);
create policy barcode_links_insert on public.barcode_links for insert to authenticated with check (user_id = auth.uid());

-- A link is trusted at once when it comes from an admin, an expert or the brand's own manufacturer account.
create or replace function public.set_barcode_link_trust() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.code := ltrim(regexp_replace(new.code, '\D', '', 'g'), '0');
  new.user_id := auth.uid();
  new.trusted := public.is_admin()
    or public.my_account_type() = 'expert'
    or public.is_brand_manager((select brand_id from cigars where id = new.cigar_id));
  return new;
end $$;
create trigger barcode_links_trust before insert on public.barcode_links
  for each row execute function public.set_barcode_link_trust();

-- Cigars whose barcode matches: official list on the cigar, or a link confirmed by a trusted account or two different users.
create or replace function public.find_cigars_by_barcode(p_code text)
returns setof public.cigar_list
language sql stable set search_path = public as $$
  with c as (select ltrim(regexp_replace(p_code, '\D', '', 'g'), '0') as code)
  select cl.* from cigar_list cl, c
  where exists (select 1 from unnest(cl.barcodes) b where ltrim(regexp_replace(b, '\D', '', 'g'), '0') = c.code)
     or cl.id in (select cigar_id from barcode_links l where l.code = c.code
                  group by cigar_id having bool_or(trusted) or count(distinct user_id) >= 2)
  limit 5;
$$;

-- What we know about a code that is not linked yet: product name and maker (exact), or just the maker (same prefix).
create or replace function public.barcode_info(p_code text)
returns table (name text, maker text, exact boolean)
language sql stable set search_path = public as $$
  with c as (select ltrim(regexp_replace(p_code, '\D', '', 'g'), '0') as code)
  (select b.name, b.maker, true from barcode_catalog b, c where b.code = c.code limit 1)
  union all
  (select null::text, b.maker, false from barcode_catalog b, c
   where left(b.code, 7) = left(c.code, 7) and b.maker is not null
     and not exists (select 1 from barcode_catalog x where x.code = c.code)
   group by b.maker order by count(*) desc limit 1);
$$;

-- Candidate cigars for an AI reading of a band: brand/line/vitola text, best matches first.
create or replace function public.match_band(p_brand text, p_line text, p_vitola text)
returns setof public.cigar_list
language sql stable set search_path = public, extensions as $$
  with q as (
    select lower(unaccent(trim(concat_ws(' ', p_brand, p_line, p_vitola)))) as full_q,
           lower(unaccent(trim(concat_ws(' ', p_brand, p_line)))) as bl_q
  )
  select cl.* from cigar_list cl, q
  where q.full_q <> '' and (cl.search_text like '%' || q.bl_q || '%' or similarity(cl.search_text, q.full_q) > 0.15)
  order by (cl.search_text like '%' || q.bl_q || '%') desc, similarity(cl.search_text, q.full_q) desc, cl.rating_count desc
  limit 8;
$$;

grant execute on function public.find_cigars_by_barcode(text), public.barcode_info(text), public.match_band(text, text, text) to authenticated;
