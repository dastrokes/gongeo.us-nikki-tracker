create table if not exists public.item_attributes (
  item_id bigint primary key references public.items (id) on delete cascade,
  item_type varchar(50) not null,
  category text,
  subcategory text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_item_attributes_type_category
  on public.item_attributes (item_type, category);

create index if not exists idx_item_attributes_type_category_subcategory
  on public.item_attributes (item_type, category, subcategory);

create index if not exists idx_item_attributes_metadata
  on public.item_attributes
  using gin (metadata jsonb_path_ops);

create or replace function public.list_items(
  p_page integer default 1,
  p_page_size integer default 18,
  p_quality integer default null,
  p_type text default null,
  p_style_key varchar(16) default null,
  p_label_id integer default null,
  p_obtain_min integer default null,
  p_obtain_max integer default null,
  p_obtain_ids integer[] default null,
  p_category text default null,
  p_subcategory text default null,
  p_metadata jsonb default null
)
returns table (
  id bigint,
  quality integer,
  type varchar(50),
  props integer[],
  style_key varchar(16),
  tags integer[],
  obtain_type integer,
  total_count bigint
)
language sql
stable
as $$
  with filtered as (
    select
      i.id,
      i.quality,
      i.type,
      i.props,
      i.style_key,
      i.tags,
      i.obtain_type,
      case
        when i.obtain_type is null then null
        else substring(i.obtain_type::text from 1 for 3)::integer
      end as obtain_version_prefix
    from public.items i
    left join public.item_attributes idx
      on idx.item_id = i.id
    where (
      (i.id between 1020000000 and 1020999999)
      or (i.id between 1021000000 and 1021999999)
      or (i.id between 1027000000 and 1027999999)
      or (i.id between 1028000000 and 1028999999)
      or (i.id between 1029000000 and 1029999999)
    )
      and (p_quality is null or i.quality = p_quality)
      and (p_type is null or p_type = 'all' or i.type = p_type)
      and (p_style_key is null or i.style_key = p_style_key)
      and (p_label_id is null or i.tags @> array[p_label_id]::integer[])
      and (p_obtain_min is null or i.obtain_type >= p_obtain_min)
      and (p_obtain_max is null or i.obtain_type <= p_obtain_max)
      and (
        p_obtain_ids is null
        or cardinality(p_obtain_ids) = 0
        or i.obtain_type = any(p_obtain_ids)
      )
      and (
        p_category is null
        or (
          p_category = '__uncategorized__'
          and nullif(btrim(idx.category), '') is null
        )
        or idx.category = p_category
      )
      and (
        p_subcategory is null
        or (
          p_subcategory = '__uncategorized__'
          and nullif(btrim(idx.subcategory), '') is null
        )
        or idx.subcategory = p_subcategory
      )
      and (p_metadata is null or idx.metadata @> p_metadata)
  ),
  totals as (
    select count(*)::bigint as total_count
    from filtered
  ),
  paged as (
    select
      filtered.id,
      filtered.quality,
      filtered.type,
      filtered.props,
      filtered.style_key,
      filtered.tags,
      filtered.obtain_type,
      totals.total_count
    from filtered
    cross join totals
    order by
      filtered.obtain_version_prefix desc nulls last,
      filtered.quality desc,
      filtered.obtain_type asc nulls last,
      filtered.id asc
    offset greatest(
      0,
      (greatest(coalesce(p_page, 1), 1) - 1)
        * greatest(coalesce(p_page_size, 18), 1)
    )
    limit least(greatest(coalesce(p_page_size, 18), 1), 200)
  )
  select
    paged.id,
    paged.quality,
    paged.type,
    paged.props,
    paged.style_key,
    paged.tags,
    paged.obtain_type,
    paged.total_count
  from paged
  union all
  select
    null::bigint as id,
    null::integer as quality,
    null::varchar(50) as type,
    null::integer[] as props,
    null::varchar(16) as style_key,
    null::integer[] as tags,
    null::integer as obtain_type,
    totals.total_count
  from totals
  where totals.total_count > 0
    and not exists (select 1 from paged);
$$;
