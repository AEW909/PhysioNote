create table if not exists public.app_memberships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  app_key text not null,
  role public.profile_role not null default 'clinician',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, app_key),
  constraint app_memberships_app_key_check check (app_key = lower(app_key) and length(app_key) > 0)
);

create index if not exists app_memberships_app_key_role_idx
  on public.app_memberships (app_key, role)
  where active;

alter table public.app_memberships enable row level security;

grant select, insert, update, delete on public.app_memberships to authenticated, service_role;

drop trigger if exists set_app_memberships_updated_at on public.app_memberships;
create trigger set_app_memberships_updated_at
before update on public.app_memberships
for each row execute function public.set_updated_at();

insert into public.app_memberships (user_id, app_key, role, active)
select id, 'physio', role, true
from public.profiles
on conflict (user_id, app_key) do update
set
  role = excluded.role,
  active = true,
  updated_at = now();

create or replace function public.current_user_app_role(target_app_key text)
returns public.profile_role
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.app_memberships
  where user_id = auth.uid()
    and app_key = target_app_key
    and active
$$;

create or replace function public.current_user_has_app_access(target_app_key text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.app_memberships
    where user_id = auth.uid()
      and app_key = target_app_key
      and active
  )
$$;

create or replace function public.current_user_role()
returns public.profile_role
language sql
security definer
set search_path = public
stable
as $$
  select public.current_user_app_role('physio')
$$;

revoke execute on function public.current_user_app_role(text) from public, anon;
revoke execute on function public.current_user_has_app_access(text) from public, anon;
revoke execute on function public.current_user_role() from public, anon;
grant execute on function public.current_user_app_role(text) to authenticated;
grant execute on function public.current_user_has_app_access(text) to authenticated;
grant execute on function public.current_user_role() to authenticated;

drop policy if exists "authenticated staff can read profiles" on public.profiles;
drop policy if exists "owners can update profiles" on public.profiles;

create policy "physio staff can read profiles"
on public.profiles
for select
to authenticated
using (public.current_user_role() in ('owner', 'clinician', 'admin'));

create policy "physio owners can update profiles"
on public.profiles
for update
to authenticated
using (public.current_user_role() = 'owner')
with check (public.current_user_role() = 'owner');

create policy "members can read own app memberships"
on public.app_memberships
for select
to authenticated
using (user_id = auth.uid());

create policy "physio owners can read app memberships"
on public.app_memberships
for select
to authenticated
using (public.current_user_role() = 'owner');

create policy "physio owners can manage app memberships"
on public.app_memberships
for all
to authenticated
using (public.current_user_role() = 'owner')
with check (public.current_user_role() = 'owner');
