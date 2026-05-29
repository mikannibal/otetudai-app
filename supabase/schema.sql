create extension if not exists pgcrypto;

create table if not exists public.children (
  id text primary key,
  name text not null,
  pin text not null check (pin ~ '^[0-9]{4}$'),
  points integer not null default 0 check (points >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  name text not null,
  color text not null default 'teal',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.missions (
  id text primary key,
  category_id text not null references public.categories(id),
  name text not null,
  description text not null,
  points integer check (points is null or points >= 0),
  kind text check (kind is null or kind in ('quantity', 'duration')),
  unit_label text,
  unit_step integer check (unit_step is null or unit_step > 0),
  unit_points integer check (unit_points is null or unit_points >= 0),
  max_units integer check (max_units is null or max_units > 0),
  max_points integer check (max_points is null or max_points >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id text primary key,
  child_id text not null references public.children(id),
  mission_id text references public.missions(id) on delete set null,
  mission_name text not null,
  category_id text not null references public.categories(id),
  category_name text not null default '',
  base_points integer not null default 0,
  requested_points integer not null default 0,
  approved_points integer,
  multiplier numeric(6, 2) not null default 1,
  boost_label text not null default '',
  detail text not null default '',
  quantity integer,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  auto_comment text not null default '',
  parent_comment text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id text primary key,
  name text not null,
  points integer not null check (points > 0),
  yen integer not null default 0 check (yen >= 0),
  fixed boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reward_requests (
  id text primary key,
  child_id text not null references public.children(id),
  reward_id text references public.rewards(id) on delete set null,
  reward_name text not null,
  points integer not null check (points > 0),
  yen integer not null default 0 check (yen >= 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  allowance_status text check (allowance_status is null or allowance_status in ('unpaid', 'paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.point_history (
  id text primary key,
  child_id text not null references public.children(id),
  type text not null check (type in ('mission', 'reward', 'gacha', 'adjustment')),
  points integer not null,
  description text not null,
  category_id text references public.categories(id),
  submission_id text references public.submissions(id) on delete set null,
  reward_request_id text references public.reward_requests(id) on delete set null,
  comment text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.gacha_history (
  id text primary key,
  child_id text not null references public.children(id),
  date date not null,
  prize_id text not null,
  label text not null,
  type text not null check (type in ('boost', 'points')),
  category_id text not null default '',
  multiplier numeric(6, 2) not null default 1,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  unique (child_id, date)
);

create table if not exists public.settings (
  id text primary key default 'global',
  parent_pin text not null check (parent_pin ~ '^[0-9]{6}$'),
  exchange_rate_label text not null default '100pt = 100円',
  comments jsonb not null default '{}'::jsonb,
  gacha_prizes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists submissions_child_status_idx on public.submissions(child_id, status);
create index if not exists reward_requests_child_status_idx on public.reward_requests(child_id, status);
create index if not exists point_history_child_created_idx on public.point_history(child_id, created_at desc);
create index if not exists gacha_history_child_date_idx on public.gacha_history(child_id, date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_children_updated_at on public.children;
create trigger set_children_updated_at before update on public.children
for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_missions_updated_at on public.missions;
create trigger set_missions_updated_at before update on public.missions
for each row execute function public.set_updated_at();

drop trigger if exists set_submissions_updated_at on public.submissions;
create trigger set_submissions_updated_at before update on public.submissions
for each row execute function public.set_updated_at();

drop trigger if exists set_rewards_updated_at on public.rewards;
create trigger set_rewards_updated_at before update on public.rewards
for each row execute function public.set_updated_at();

drop trigger if exists set_reward_requests_updated_at on public.reward_requests;
create trigger set_reward_requests_updated_at before update on public.reward_requests
for each row execute function public.set_updated_at();

create or replace function public.approve_mission(
  p_submission_id text,
  p_approved_points integer,
  p_parent_comment text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission public.submissions%rowtype;
  v_points integer := greatest(0, coalesce(p_approved_points, 0));
begin
  select * into v_submission
  from public.submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'submission_not_found';
  end if;

  if v_submission.status <> 'pending' then
    return;
  end if;

  update public.submissions
  set status = 'approved',
      approved_points = v_points,
      parent_comment = coalesce(p_parent_comment, ''),
      resolved_at = now()
  where id = p_submission_id;

  update public.children
  set points = points + v_points
  where id = v_submission.child_id;

  insert into public.point_history (
    id, child_id, type, points, description, category_id, submission_id, comment, created_at
  ) values (
    'point-' || replace(gen_random_uuid()::text, '-', ''),
    v_submission.child_id,
    'mission',
    v_points,
    v_submission.mission_name,
    v_submission.category_id,
    v_submission.id,
    trim(both from concat_ws(' ', nullif(v_submission.auto_comment, ''), nullif(coalesce(p_parent_comment, ''), ''))),
    now()
  );
end;
$$;

create or replace function public.reject_mission(p_submission_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.submissions
  set status = 'rejected',
      approved_points = 0,
      resolved_at = now()
  where id = p_submission_id
    and status = 'pending';
end;
$$;

create or replace function public.approve_reward(p_request_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.reward_requests%rowtype;
  v_child_points integer;
begin
  select * into v_request
  from public.reward_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'reward_request_not_found';
  end if;

  if v_request.status <> 'pending' then
    return;
  end if;

  select points into v_child_points
  from public.children
  where id = v_request.child_id
  for update;

  if v_child_points < v_request.points then
    raise exception 'points_not_enough';
  end if;

  update public.reward_requests
  set status = 'approved',
      resolved_at = now(),
      allowance_status = case when v_request.yen > 0 then 'unpaid' else null end
  where id = p_request_id;

  update public.children
  set points = points - v_request.points
  where id = v_request.child_id;

  insert into public.point_history (
    id, child_id, type, points, description, reward_request_id, created_at
  ) values (
    'point-' || replace(gen_random_uuid()::text, '-', ''),
    v_request.child_id,
    'reward',
    -v_request.points,
    v_request.reward_name || 'と交換',
    v_request.id,
    now()
  );
end;
$$;

create or replace function public.reject_reward(p_request_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reward_requests
  set status = 'rejected',
      resolved_at = now()
  where id = p_request_id
    and status = 'pending';
end;
$$;

create or replace function public.mark_allowances_paid()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.reward_requests
  set allowance_status = 'paid',
      paid_at = now()
  where status = 'approved'
    and yen > 0
    and allowance_status = 'unpaid';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.record_gacha(
  p_child_id text,
  p_prize jsonb,
  p_date date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry public.gacha_history%rowtype;
  v_points integer := coalesce(nullif(p_prize->>'points', '')::integer, 0);
begin
  insert into public.gacha_history (
    id, child_id, date, prize_id, label, type, category_id, multiplier, points, created_at
  ) values (
    'gacha-' || replace(gen_random_uuid()::text, '-', ''),
    p_child_id,
    p_date,
    coalesce(p_prize->>'id', p_prize->>'prizeId'),
    p_prize->>'label',
    p_prize->>'type',
    coalesce(p_prize->>'categoryId', p_prize->>'category_id', ''),
    coalesce(nullif(p_prize->>'multiplier', '')::numeric, 1),
    v_points,
    now()
  )
  on conflict (child_id, date) do nothing
  returning * into v_entry;

  if not found then
    select * into v_entry
    from public.gacha_history
    where child_id = p_child_id
      and date = p_date;
    return to_jsonb(v_entry);
  end if;

  if v_entry.type = 'points' and v_entry.points > 0 then
    update public.children
    set points = points + v_entry.points
    where id = p_child_id;

    insert into public.point_history (
      id, child_id, type, points, description, comment, created_at
    ) values (
      'point-' || replace(gen_random_uuid()::text, '-', ''),
      p_child_id,
      'gacha',
      v_entry.points,
      'ガチャ景品',
      v_entry.label,
      now()
    );
  end if;

  return to_jsonb(v_entry);
end;
$$;

alter table public.children enable row level security;
alter table public.categories enable row level security;
alter table public.missions enable row level security;
alter table public.submissions enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_requests enable row level security;
alter table public.point_history enable row level security;
alter table public.gacha_history enable row level security;
alter table public.settings enable row level security;

drop policy if exists "family_anon_all_children" on public.children;
create policy "family_anon_all_children" on public.children for all to anon using (true) with check (true);
drop policy if exists "family_anon_all_categories" on public.categories;
create policy "family_anon_all_categories" on public.categories for all to anon using (true) with check (true);
drop policy if exists "family_anon_all_missions" on public.missions;
create policy "family_anon_all_missions" on public.missions for all to anon using (true) with check (true);
drop policy if exists "family_anon_all_submissions" on public.submissions;
create policy "family_anon_all_submissions" on public.submissions for all to anon using (true) with check (true);
drop policy if exists "family_anon_all_rewards" on public.rewards;
create policy "family_anon_all_rewards" on public.rewards for all to anon using (true) with check (true);
drop policy if exists "family_anon_all_reward_requests" on public.reward_requests;
create policy "family_anon_all_reward_requests" on public.reward_requests for all to anon using (true) with check (true);
drop policy if exists "family_anon_all_point_history" on public.point_history;
create policy "family_anon_all_point_history" on public.point_history for all to anon using (true) with check (true);
drop policy if exists "family_anon_all_gacha_history" on public.gacha_history;
create policy "family_anon_all_gacha_history" on public.gacha_history for all to anon using (true) with check (true);
drop policy if exists "family_anon_all_settings" on public.settings;
create policy "family_anon_all_settings" on public.settings for all to anon using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.children,
  public.categories,
  public.missions,
  public.submissions,
  public.rewards,
  public.reward_requests,
  public.point_history,
  public.gacha_history,
  public.settings
to anon, authenticated;

grant execute on function public.approve_mission(text, integer, text) to anon, authenticated;
grant execute on function public.reject_mission(text) to anon, authenticated;
grant execute on function public.approve_reward(text) to anon, authenticated;
grant execute on function public.reject_reward(text) to anon, authenticated;
grant execute on function public.mark_allowances_paid() to anon, authenticated;
grant execute on function public.record_gacha(text, jsonb, date) to anon, authenticated;

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array[
      'children',
      'categories',
      'missions',
      'submissions',
      'rewards',
      'reward_requests',
      'point_history',
      'gacha_history',
      'settings'
    ] loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end $$;
