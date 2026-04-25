-- Control A — multi-tenant schema
-- Per-user isolation enforced via Row Level Security (RLS).

create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  language text default 'en',
  timezone text default 'UTC',
  created_at timestamptz default now()
);

create table if not exists public.user_context (
  user_id uuid references public.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz default now(),
  primary key (user_id, key)
);
create index if not exists idx_user_context_user on public.user_context(user_id);

create table if not exists public.agents (
  id text primary key,
  name text not null,
  role text not null,
  tagline text,
  accent text,
  avatar text,
  is_concierge boolean default false,
  system_prompt text not null,
  tools jsonb default '[]'::jsonb,
  output_kinds jsonb default '[]'::jsonb,
  is_global boolean default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.rosters (
  user_id uuid references public.users(id) on delete cascade,
  agent_id text references public.agents(id) on delete cascade,
  status text not null default 'hired' check (status in ('hired','archived','fired')),
  hired_at timestamptz default now(),
  pinned boolean default false,
  primary key (user_id, agent_id)
);
create index if not exists idx_rosters_user on public.rosters(user_id);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  agent_id text references public.agents(id) on delete cascade,
  role text not null check (role in ('user','agent','system')),
  text text,
  artifact_id uuid,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_messages_user_agent on public.messages(user_id, agent_id, created_at desc);

create table if not exists public.artifacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  agent_id text references public.agents(id) on delete cascade,
  kind text not null check (kind in ('code','preview','image','video','doc','dashboard')),
  title text not null,
  subtitle text,
  language text,
  content text,
  url text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_artifacts_user_agent on public.artifacts(user_id, agent_id, created_at desc);

-- Row Level Security
alter table public.users enable row level security;
alter table public.user_context enable row level security;
alter table public.rosters enable row level security;
alter table public.messages enable row level security;
alter table public.artifacts enable row level security;
alter table public.agents enable row level security;

-- Policies: users only see their own data.
create policy "users_self_read" on public.users for select using (auth.uid() = id);
create policy "users_self_update" on public.users for update using (auth.uid() = id);

create policy "ctx_self_all" on public.user_context for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "roster_self_all" on public.rosters for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "msg_self_all" on public.messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "art_self_all" on public.artifacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Agents: global agents visible to everyone; private agents only to creator.
create policy "agents_global_read" on public.agents for select using (is_global = true or created_by = auth.uid());
create policy "agents_owner_write" on public.agents for all using (created_by = auth.uid()) with check (created_by = auth.uid());

-- Trigger: create user row on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
