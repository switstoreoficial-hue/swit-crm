-- SWIT Uniformes CRM schema
-- Run in Supabase SQL editor.

create extension if not exists "uuid-ossp";

do $$ begin
  create type lead_source as enum ('whatsapp', 'facebook', 'instagram');
exception when duplicate_object then null; end $$;

create table if not exists leads (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  whatsapp      text not null,
  company       text,
  source        lead_source not null default 'whatsapp',
  stage         int not null default 0 check (stage between 0 and 5),
  product_type  text,
  quantity      int,
  value         numeric(10,2),
  entry_value   numeric(10,2),
  tiny_order    text,
  assigned_to   text,
  notes         text,
  checklist     jsonb not null default '[false,false,false,false,false,false,false]'::jsonb,
  logo_received boolean not null default false,
  mockup_sent   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists leads_stage_idx       on leads(stage);
create index if not exists leads_assigned_idx    on leads(assigned_to);
create index if not exists leads_updated_at_idx  on leads(updated_at desc);
create index if not exists leads_created_at_idx  on leads(created_at desc);

create table if not exists lead_history (
  id         uuid primary key default uuid_generate_v4(),
  lead_id    uuid not null references leads(id) on delete cascade,
  user_name  text not null,
  text       text not null,
  created_at timestamptz not null default now()
);

create index if not exists lead_history_lead_idx on lead_history(lead_id, created_at desc);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on leads;
create trigger leads_set_updated_at
before update on leads
for each row execute function set_updated_at();

-- Realtime: publish both tables
do $$ begin
  alter publication supabase_realtime add table leads;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table lead_history;
exception when duplicate_object then null; end $$;

-- Open RLS (auth is a simple user-picker; no Supabase Auth users).
alter table leads          enable row level security;
alter table lead_history   enable row level security;

drop policy if exists leads_all on leads;
create policy leads_all on leads
  for all using (true) with check (true);

drop policy if exists history_all on lead_history;
create policy history_all on lead_history
  for all using (true) with check (true);
