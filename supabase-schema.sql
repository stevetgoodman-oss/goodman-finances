-- Goodman Finances Inc. v2 shared schema
-- Run this in Supabase SQL Editor after creating your project.

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists household_members (
  household_id uuid references households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member',
  created_at timestamptz default now(),
  primary key (household_id, user_id)
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  name text not null,
  category_group text not null,
  monthly_budget numeric not null default 0,
  keywords text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  tx_date date not null,
  description text not null,
  amount numeric not null,
  category text not null,
  tx_type text not null check (tx_type in ('income','expense')),
  source text default 'manual',
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table households enable row level security;
alter table household_members enable row level security;
alter table budgets enable row level security;
alter table transactions enable row level security;

create policy "members can read households" on households
  for select using (id in (select household_id from household_members where user_id = auth.uid()));

create policy "users can create households" on households
  for insert with check (created_by = auth.uid());

create policy "members can read members" on household_members
  for select using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "users can add themselves as member" on household_members
  for insert with check (user_id = auth.uid());

create policy "members can read budgets" on budgets
  for select using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "members can manage budgets" on budgets
  for all using (household_id in (select household_id from household_members where user_id = auth.uid()))
  with check (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "members can read transactions" on transactions
  for select using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "members can manage transactions" on transactions
  for all using (household_id in (select household_id from household_members where user_id = auth.uid()))
  with check (household_id in (select household_id from household_members where user_id = auth.uid()));
