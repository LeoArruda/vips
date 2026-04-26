-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Workspaces
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Workspace members (links auth.users to workspaces)
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'builder', 'operator', 'partner')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- Workflows
create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  definition jsonb not null default '{"nodes":[],"edges":[],"trigger":{"type":"manual"}}',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Workflow versions (immutable history)
create table public.workflow_versions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  version integer not null,
  definition jsonb not null,
  created_at timestamptz not null default now(),
  unique (workflow_id, version)
);

-- Connectors
create table public.connectors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type text not null,
  name text not null,
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Runs
create table public.runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'running', 'success', 'failed')),
  triggered_by text not null default 'manual' check (triggered_by in ('manual', 'schedule', 'webhook')),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- Run logs
create table public.run_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  node_id text,
  level text not null check (level in ('info', 'warn', 'error')),
  message text not null,
  created_at timestamptz not null default now()
);

-- Secrets (values stored encrypted, never returned as plaintext)
create table public.secrets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  encrypted_value text not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workflows_updated_at
  before update on public.workflows
  for each row execute function public.set_updated_at();

create trigger connectors_updated_at
  before update on public.connectors
  for each row execute function public.set_updated_at();

-- Row Level Security
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_versions enable row level security;
alter table public.connectors enable row level security;
alter table public.runs enable row level security;
alter table public.run_logs enable row level security;
alter table public.secrets enable row level security;

create policy "workspace_members_read_workspace"
  on public.workspaces for select
  using (public.is_workspace_member(id));

create policy "workspace_members_read_self"
  on public.workspace_members for select
  using (user_id = auth.uid());

create policy "workflow_workspace_select" on public.workflows for select using (public.is_workspace_member(workspace_id));
create policy "workflow_workspace_insert" on public.workflows for insert with check (public.is_workspace_member(workspace_id));
create policy "workflow_workspace_update" on public.workflows for update using (public.is_workspace_member(workspace_id));
create policy "workflow_workspace_delete" on public.workflows for delete using (public.is_workspace_member(workspace_id));

create policy "workflow_versions_read" on public.workflow_versions for select using (
  public.is_workspace_member((select workspace_id from public.workflows where id = workflow_id))
);

create policy "connector_workspace_select" on public.connectors for select using (public.is_workspace_member(workspace_id));
create policy "connector_workspace_insert" on public.connectors for insert with check (public.is_workspace_member(workspace_id));
create policy "connector_workspace_update" on public.connectors for update using (public.is_workspace_member(workspace_id));
create policy "connector_workspace_delete" on public.connectors for delete using (public.is_workspace_member(workspace_id));

create policy "run_workspace_select" on public.runs for select using (public.is_workspace_member(workspace_id));

create policy "run_logs_read" on public.run_logs for select using (
  public.is_workspace_member((select workspace_id from public.runs where id = run_id))
);

create policy "secrets_workspace_select" on public.secrets for select using (public.is_workspace_member(workspace_id));
