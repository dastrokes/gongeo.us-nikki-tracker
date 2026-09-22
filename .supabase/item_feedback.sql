begin;

create table if not exists public.feedback_suggestions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('item', 'outfit')),
  entity_id bigint not null,
  base_snapshot jsonb not null default '{}'::jsonb,
  base_signature text not null,
  proposed_patch jsonb not null default '{}'::jsonb,
  changed_fields text[] not null default '{}'::text[],
  status text not null default 'open'
    check (status in ('open', 'accepted', 'rejected', 'applied')),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.feedback_votes (
  suggestion_id uuid not null
    references public.feedback_suggestions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  vote_value smallint not null check (vote_value in (-1, 1)),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (suggestion_id, user_id)
);

create index if not exists idx_feedback_suggestions_status_created
  on public.feedback_suggestions (status, created_at desc);

create index if not exists idx_feedback_suggestions_entity_status
  on public.feedback_suggestions
  (entity_type, entity_id, status, created_at desc);

create index if not exists idx_feedback_suggestions_changed_fields
  on public.feedback_suggestions using gin (changed_fields);

create unique index if not exists idx_feedback_suggestions_open_entity
  on public.feedback_suggestions (entity_type, entity_id)
  where status = 'open';

create index if not exists idx_feedback_votes_user
  on public.feedback_votes (user_id, updated_at desc);

alter table public.feedback_suggestions enable row level security;
alter table public.feedback_votes enable row level security;

revoke all on table public.feedback_suggestions from public, anon, authenticated;
revoke all on table public.feedback_votes from public, anon, authenticated;
revoke all on table public.feedback_suggestions from service_role;
revoke all on table public.feedback_votes from service_role;
grant select, insert, update, delete on table public.feedback_suggestions
  to service_role;
grant select, insert, update, delete on table public.feedback_votes
  to service_role;

create or replace view public.feedback_queue
with (security_invoker = true) as
select
  suggestion.id,
  suggestion.entity_type,
  suggestion.entity_id,
  suggestion.base_snapshot,
  suggestion.base_signature,
  suggestion.proposed_patch,
  suggestion.changed_fields,
  suggestion.status,
  suggestion.user_id,
  suggestion.created_at,
  suggestion.updated_at,
  coalesce(totals.agree_count, 0)::bigint as agree_count,
  coalesce(totals.disagree_count, 0)::bigint as disagree_count,
  coalesce(totals.score, 0)::bigint as score,
  coalesce(totals.total_votes, 0)::bigint as total_votes
from public.feedback_suggestions suggestion
left join (
  select
    vote.suggestion_id,
    count(*) filter (where vote.vote_value = 1)::bigint as agree_count,
    count(*) filter (where vote.vote_value = -1)::bigint as disagree_count,
    (
      count(*) filter (where vote.vote_value = 1)
      - count(*) filter (where vote.vote_value = -1)
    )::bigint as score,
    count(*)::bigint as total_votes
  from public.feedback_votes vote
  group by vote.suggestion_id
) totals on totals.suggestion_id = suggestion.id;

revoke all on table public.feedback_queue from public, anon, authenticated;
revoke all on table public.feedback_queue from service_role;
grant select on table public.feedback_queue to service_role;

commit;
