-- "Fã de" badges: the brands a user says they like, shown on their profile.
-- Only the brand NAME is shown (no logos), so no brand authorization is needed.
create table if not exists public.fan_brands (
  user_id uuid not null references public.profiles (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, brand_id)
);
alter table public.fan_brands enable row level security;
drop policy if exists fan_brands_read on public.fan_brands;
create policy fan_brands_read on public.fan_brands for select to authenticated using (true);
drop policy if exists fan_brands_write on public.fan_brands;
create policy fan_brands_write on public.fan_brands for insert to authenticated with check (user_id = auth.uid());
drop policy if exists fan_brands_delete on public.fan_brands;
create policy fan_brands_delete on public.fan_brands for delete to authenticated using (user_id = auth.uid());

create or replace function public.fan_brands_limit() returns trigger
language plpgsql as $$
begin
  if (select count(*) from public.fan_brands where user_id = new.user_id) >= 8 then
    raise exception 'FAN_BRANDS_LIMIT';
  end if;
  return new;
end $$;
drop trigger if exists fan_brands_limit on public.fan_brands;
create trigger fan_brands_limit before insert on public.fan_brands
  for each row execute function public.fan_brands_limit();
