-- Per-banner global stats.

create table if not exists public.global_banner_config (
  banner_id integer not null,
  banner_type smallint not null check (banner_type in (1, 2, 3)),
  quality smallint not null check (quality in (4, 5)),
  outfit_id text not null,
  item_count smallint not null check (item_count > 0),
  primary key (banner_id, quality, outfit_id)
);

select pg_notify('pgrst', 'reload schema');

create index if not exists idx_global_banner_config_banner_id
  on public.global_banner_config (banner_id);

create or replace function public.generate_global_core_json()
returns jsonb
language sql
stable
as $$
with banner_rows as (
  select
    uid,
    region,
    banner_id,
    banner_type,
    total_pulls,
    total_4star_items,
    total_5star_items,
    pulls_4star,
    pulls_5star
  from public.user_banner_stats_view
  where total_pulls > 0
),
core_totals as (
  select
    count(distinct (uid, region))::integer as users,
    coalesce(sum(total_pulls), 0)::integer as pulls
  from banner_rows
),
pulls_per_banner as (
  select
    coalesce(
      jsonb_object_agg(
        banner_id::text,
        jsonb_build_array(three_star_items, four_star_items, five_star_items)
        order by banner_id
      ),
      '{}'::jsonb
    ) as payload
  from (
    select
      banner_id,
      greatest(
        coalesce(sum(total_pulls), 0)
          - coalesce(sum(total_4star_items), 0)
          - coalesce(sum(total_5star_items), 0),
        0
      )::integer as three_star_items,
      coalesce(sum(total_4star_items), 0)::integer as four_star_items,
      coalesce(sum(total_5star_items), 0)::integer as five_star_items
    from banner_rows
    group by banner_id
  ) grouped
),
five_star_distribution as (
  select
    coalesce(
      jsonb_object_agg(pulls_to_obtain::text, users order by pulls_to_obtain),
      '{}'::jsonb
    ) as payload
  from (
    select
      (pull ->> 'pulls_to_obtain')::integer as pulls_to_obtain,
      count(*)::integer as users
    from banner_rows
    cross join lateral jsonb_array_elements(
      case
        when jsonb_typeof(pulls_5star) = 'array' then pulls_5star
        else '[]'::jsonb
      end
    ) as pull
    where banner_type <> 1
      and pull ->> 'pulls_to_obtain' is not null
    group by pulls_to_obtain
  ) grouped
),
four_star_type2_distribution as (
  select
    coalesce(
      jsonb_object_agg(pulls_to_obtain::text, users order by pulls_to_obtain),
      '{}'::jsonb
    ) as payload
  from (
    select
      (pull ->> 'pulls_to_obtain')::integer as pulls_to_obtain,
      count(*)::integer as users
    from banner_rows
    cross join lateral jsonb_array_elements(
      case
        when jsonb_typeof(pulls_4star) = 'array' then pulls_4star
        else '[]'::jsonb
      end
    ) as pull
    where banner_type = 2
      and pull ->> 'pulls_to_obtain' is not null
    group by pulls_to_obtain
  ) grouped
),
four_star_type3_distribution as (
  select
    coalesce(
      jsonb_object_agg(pulls_to_obtain::text, users order by pulls_to_obtain),
      '{}'::jsonb
    ) as payload
  from (
    select
      (pull ->> 'pulls_to_obtain')::integer as pulls_to_obtain,
      count(*)::integer as users
    from banner_rows
    cross join lateral jsonb_array_elements(
      case
        when jsonb_typeof(pulls_4star) = 'array' then pulls_4star
        else '[]'::jsonb
      end
    ) as pull
    where banner_type = 3
      and pull ->> 'pulls_to_obtain' is not null
    group by pulls_to_obtain
  ) grouped
)
select jsonb_build_object(
  'date', now(),
  'pulls', (select pulls from core_totals),
  'users', (select users from core_totals),
  'pullsPerBanner', (select payload from pulls_per_banner),
  'fiveStarDistribution', (select payload from five_star_distribution),
  'fourStarType2Distribution', (select payload from four_star_type2_distribution),
  'fourStarType3Distribution', (select payload from four_star_type3_distribution)
);
$$;

create or replace function public.generate_global_banner_json_for_banner(
  p_banner_id integer
)
returns jsonb
language sql
stable
as $$
with scope_config as (
  select
    banner_id,
    banner_type,
    quality,
    outfit_id,
    item_count,
    concat(quality::text, ':', outfit_id) as scope_key
  from public.global_banner_config
  where banner_id = p_banner_id
    and banner_type <> 1
),
banner_scope as (
  select
    min(banner_type) as banner_type,
    min(item_count) filter (
      where (banner_type = 2 and quality = 5)
        or (banner_type = 3 and quality = 4)
    ) as required_items
  from scope_config
),
banner_rows as (
  select
    stats.uid,
    stats.region,
    stats.banner_id,
    stats.banner_type,
    stats.total_pulls,
    stats.total_4star_items,
    stats.total_5star_items,
    stats.pulls_4star,
    stats.pulls_5star
  from public.user_banner_stats_view stats
  where stats.banner_id = p_banner_id
),
banner_totals as (
  select
    count(*)::integer as users,
    coalesce(sum(total_pulls), 0)::integer as total_pulls
  from banner_rows
),
banner_completion as (
  select
    jsonb_build_object(
      'base', count(*) filter (
        where (scope.banner_type = 2 and rows.total_5star_items >= scope.required_items)
          or (scope.banner_type = 3 and rows.total_4star_items >= scope.required_items)
      ),
      'evo1', count(*) filter (
        where scope.banner_type = 2 and rows.total_pulls > 180
      ),
      'evo2', count(*) filter (
        where scope.banner_type = 2 and rows.total_pulls > 230
      ),
      'evo3', count(*) filter (
        where (scope.banner_type = 2 and rows.total_5star_items >= scope.required_items * 2)
          or (scope.banner_type = 3 and rows.total_4star_items >= scope.required_items * 2)
      )
    ) as payload
  from banner_rows rows
  cross join banner_scope scope
),
overall_pull_distribution as (
  select
    coalesce(
      jsonb_object_agg(total_pulls::text, users order by total_pulls),
      '{}'::jsonb
    ) as payload
  from (
    select
      total_pulls,
      count(*)::integer as users
    from banner_rows
    where total_pulls > 0
    group by total_pulls
  ) grouped
),
scope_rows as (
  select
    rows.uid,
    rows.region,
    config.banner_id,
    config.banner_type,
    config.quality,
    config.outfit_id,
    config.item_count,
    config.scope_key,
    case
      when config.quality = 5 then rows.pulls_5star
      else rows.pulls_4star
    end as pulls
  from scope_config config
  join banner_rows rows on rows.banner_id = config.banner_id
),
scope_users as (
  select
    scope_key,
    count(*) filter (
      where jsonb_typeof(pulls) = 'array'
        and jsonb_array_length(pulls) > 0
    )::integer as users,
    count(*) filter (
      where banner_type in (2, 3)
        and jsonb_typeof(pulls) = 'array'
        and jsonb_array_length(pulls) >= item_count
    )::integer as completed_users
  from scope_rows
  group by scope_key
),
scope_first_items as (
  select
    scope_key,
    coalesce(
      jsonb_agg(
        jsonb_build_object('itemId', item_id, 'users', users)
        order by users desc, item_id
      ),
      '[]'::jsonb
    ) as payload
  from (
    select
      scope_key,
      pulls -> 0 ->> 'item_id' as item_id,
      count(*)::integer as users
    from scope_rows
    where jsonb_typeof(pulls) = 'array'
      and jsonb_array_length(pulls) > 0
      and pulls -> 0 ->> 'item_id' is not null
    group by scope_key, item_id
  ) grouped
  group by scope_key
),
scope_fifth_items as (
  select
    scope_key,
    coalesce(
      jsonb_agg(
        jsonb_build_object('itemId', item_id, 'users', users)
        order by users desc, item_id
      ),
      '[]'::jsonb
    ) as payload
  from (
    select
      scope_key,
      pulls -> 4 ->> 'item_id' as item_id,
      count(*)::integer as users
    from scope_rows
    where banner_type = 2
      and quality = 5
      and jsonb_typeof(pulls) = 'array'
      and jsonb_array_length(pulls) >= 5
      and pulls -> 4 ->> 'item_id' is not null
    group by scope_key, item_id
  ) grouped
  group by scope_key
),
scope_completion_pulls as (
  select
    scope_key,
    coalesce(
      jsonb_object_agg(pull_index::text, users order by pull_index),
      '{}'::jsonb
    ) as payload
  from (
    select
      scope_key,
      ((pulls -> (item_count - 1)) ->> 'pull_index')::integer as pull_index,
      count(*)::integer as users
    from scope_rows
    where banner_type in (2, 3)
      and jsonb_typeof(pulls) = 'array'
      and jsonb_array_length(pulls) >= item_count
      and (pulls -> (item_count - 1)) ->> 'pull_index' is not null
    group by scope_key, pull_index
  ) grouped
  group by scope_key
),
scope_payloads as (
  select
    config.scope_key,
    jsonb_strip_nulls(
      jsonb_build_object(
        'scopeKey', config.scope_key,
        'quality', config.quality,
        'outfitId', config.outfit_id,
        'itemCount', config.item_count,
        'users', coalesce(users.users, 0),
        'firstItemDistribution', coalesce(first_items.payload, '[]'::jsonb),
        'completedUsers',
          case
            when config.banner_type in (2, 3) then coalesce(users.completed_users, 0)
            else null
          end,
        'completionRate',
          case
            when config.banner_type in (2, 3) and coalesce(users.users, 0) > 0
              then coalesce(users.completed_users, 0)::numeric / users.users
            else null
          end,
        'completionPullDistribution',
          case
            when config.banner_type in (2, 3)
              then coalesce(completion_pulls.payload, '{}'::jsonb)
            else null
          end,
        'fifthItemDistribution',
          case
            when config.banner_type = 2 and config.quality = 5
              then coalesce(fifth_items.payload, '[]'::jsonb)
            else null
          end
      )
    ) as payload
  from scope_config config
  left join scope_users users on users.scope_key = config.scope_key
  left join scope_first_items first_items on first_items.scope_key = config.scope_key
  left join scope_fifth_items fifth_items on fifth_items.scope_key = config.scope_key
  left join scope_completion_pulls completion_pulls on completion_pulls.scope_key = config.scope_key
),
scopes_json as (
  select
    coalesce(jsonb_object_agg(scope_key, payload order by scope_key), '{}'::jsonb) as payload
  from scope_payloads
)
select jsonb_build_object(
  'date', now(),
  'bannerId', p_banner_id,
  'bannerType', coalesce((select banner_type from banner_scope), 0),
  'users', (select users from banner_totals),
  'totalPulls', (select total_pulls from banner_totals),
  'overallPullDistribution', (select payload from overall_pull_distribution),
  'completionLevels', (select payload from banner_completion),
  'scopes', (select payload from scopes_json)
);
$$;

create or replace function public.refresh_global_banner_stats(
  p_banner_id integer
)
returns void
language sql
as $$
insert into public.user_global_stats (banner_id, payload)
values (
  p_banner_id,
  case
    when exists (
      select 1
      from public.global_banner_config
      where banner_id = p_banner_id
        and banner_type <> 1
    )
      then public.generate_global_banner_json_for_banner(p_banner_id)
    else '{}'::jsonb
  end
)
on conflict (banner_id)
do update set
  payload = excluded.payload,
  updated_at = now();
$$;

create or replace function public.refresh_global_core_stats()
returns void
language sql
as $$
insert into public.user_global_stats (banner_id, payload)
values (0, public.generate_global_core_json())
on conflict (banner_id)
do update set
  payload = excluded.payload,
  updated_at = now();
$$;

create or replace function public.refresh_global_banner_stats_all()
returns void
language plpgsql
as $$
declare
  current_banner_id integer;
begin
  perform public.refresh_global_core_stats();

  for current_banner_id in
    select distinct banner_id
    from public.global_banner_config
    where banner_type <> 1
    order by banner_id
  loop
    perform public.refresh_global_banner_stats(current_banner_id);
  end loop;
end;
$$;

alter function public.generate_global_core_json()
  set search_path = public;

alter function public.generate_global_banner_json_for_banner(integer)
  set search_path = public;

alter function public.refresh_global_banner_stats(integer)
  set search_path = public;

alter function public.refresh_global_core_stats()
  set search_path = public;

alter function public.refresh_global_banner_stats_all()
  set search_path = public;
