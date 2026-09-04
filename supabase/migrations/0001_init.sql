create table children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  avatar text not null,
  pin_hash text not null,
  rank int not null default 1,
  created_at timestamptz not null default now()
);

create table mission_progress (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  course text not null,
  rank int not null default 1,
  turns_completed int not null default 0,
  updated_at timestamptz not null default now(),
  unique (child_id, course)
);

create table mission_turns (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  role text not null check (role in ('child', 'orb')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table children enable row level security;
alter table mission_progress enable row level security;
alter table mission_turns enable row level security;

create policy "Parents manage their own children"
  on children for all
  using (auth.uid() = parent_id)
  with check (auth.uid() = parent_id);

create policy "Parents manage their children's progress"
  on mission_progress for all
  using (exists (select 1 from children c where c.id = child_id and c.parent_id = auth.uid()))
  with check (exists (select 1 from children c where c.id = child_id and c.parent_id = auth.uid()));

create policy "Parents manage their children's turns"
  on mission_turns for all
  using (exists (select 1 from children c where c.id = child_id and c.parent_id = auth.uid()))
  with check (exists (select 1 from children c where c.id = child_id and c.parent_id = auth.uid()));
