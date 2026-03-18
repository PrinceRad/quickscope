-- Run this in Supabase SQL Editor

create table documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  your_name text,
  your_email text,
  your_business text,
  client_name text,
  client_email text,
  deliverables text,
  deadline date,
  revisions text,
  extra_revision text,
  price numeric,
  currency text,
  payment_terms text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table documents enable row level security;

-- Users can only see their own documents
create policy "Users can view own documents"
  on documents for select
  using (auth.uid() = user_id);

-- Users can only insert their own documents
create policy "Users can insert own documents"
  on documents for insert
  with check (auth.uid() = user_id);

-- Users can only delete their own documents
create policy "Users can delete own documents"
  on documents for delete
  using (auth.uid() = user_id);
