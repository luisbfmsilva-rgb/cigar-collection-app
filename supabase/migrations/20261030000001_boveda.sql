-- Boveda packs inside a humidor, with a replacement interval the user can change.
create table public.humidor_boveda (
  id uuid primary key default gen_random_uuid(),
  humidor_id uuid not null references public.humidors (id) on delete cascade,
  size_g smallint not null check (size_g in (8, 32, 60, 320)),
  rh smallint not null default 69 check (rh in (62, 65, 69, 72, 75, 84)),
  quantity smallint not null default 1 check (quantity between 1 and 50),
  installed_on date not null default current_date,
  replace_after_days int not null default 90 check (replace_after_days between 7 and 730),
  created_at timestamptz not null default now()
);
create index humidor_boveda_humidor_idx on public.humidor_boveda (humidor_id);
alter table public.humidor_boveda enable row level security;
create policy humidor_boveda_own on public.humidor_boveda for all to authenticated
  using (public.owns_humidor(humidor_id)) with check (public.owns_humidor(humidor_id));
