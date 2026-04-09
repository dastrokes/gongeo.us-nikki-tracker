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

create or replace function public.list_item_facets(
  p_quality integer default null,
  p_type text default null,
  p_style_key varchar(16) default null,
  p_label_id integer default null,
  p_obtain_min integer default null,
  p_obtain_max integer default null,
  p_obtain_ids integer[] default null,
  p_category text default null,
  p_subcategory text default null,
  p_selected_metadata jsonb default null
)
returns table (
  facet_group text,
  facet_key text,
  facet_value text
)
language sql
stable
as $$
  with base_rows as (
    select
      coalesce(nullif(btrim(idx.category), ''), '__uncategorized__') as category,
      coalesce(nullif(btrim(idx.subcategory), ''), '__uncategorized__') as subcategory,
      coalesce(idx.metadata, '{}'::jsonb) as metadata
    from public.items i
    join public.item_attributes idx
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
  ),
  scoped_rows as (
    select
      base_rows.category,
      base_rows.subcategory,
      base_rows.metadata
    from base_rows
    where (p_category is null or base_rows.category = p_category)
      and (p_subcategory is null or base_rows.subcategory = p_subcategory)
  ),
  selected_filters as (
    select
      filter_entry.key,
      nullif(btrim(filter_entry.value), '') as value
    from jsonb_each_text(coalesce(p_selected_metadata, '{}'::jsonb)) filter_entry
    where nullif(btrim(filter_entry.value), '') is not null
  ),
  categories as (
    select
      'category'::text as facet_group,
      'category'::text as facet_key,
      category as facet_value
    from (
      select distinct base_rows.category
      from base_rows
    ) distinct_categories
  ),
  subcategories as (
    select
      'subcategory'::text as facet_group,
      'subcategory'::text as facet_key,
      subcategory as facet_value
    from (
      select distinct base_rows.subcategory
      from base_rows
      where (p_category is null or base_rows.category = p_category)
    ) distinct_subcategories
  ),
  metadata_entries as (
    select
      metadata_entry.key as facet_key,
      scoped_rows.metadata,
      metadata_entry.value as raw_value
    from scoped_rows
    cross join lateral jsonb_each(scoped_rows.metadata) metadata_entry
    where metadata_entry.key not in (
      'item_id',
      'item_type',
      'slot',
      'category',
      'subcategory'
    )
  ),
  advanced_scalar_entries as (
    select
      metadata_entries.facet_key,
      nullif(btrim(trim(both '"' from metadata_entries.raw_value::text)), '') as facet_value,
      metadata_entries.metadata
    from metadata_entries
    where jsonb_typeof(metadata_entries.raw_value) = 'string'
  ),
  advanced_array_entries as (
    select
      metadata_entries.facet_key,
      nullif(btrim(array_value.value), '') as facet_value,
      metadata_entries.metadata
    from metadata_entries
    cross join lateral jsonb_array_elements_text(
      case
        when jsonb_typeof(metadata_entries.raw_value) = 'array'
          then metadata_entries.raw_value
        else '[]'::jsonb
      end
    ) array_value(value)
  ),
  advanced_entries as (
    select * from advanced_scalar_entries
    union all
    select * from advanced_array_entries
  ),
  advanced_facets as (
    select distinct
      'advanced'::text as facet_group,
      advanced_entries.facet_key,
      advanced_entries.facet_value
    from advanced_entries
    where advanced_entries.facet_value is not null
      and not exists (
        select 1
        from selected_filters
        where selected_filters.key <> advanced_entries.facet_key
          and not (
            coalesce(
              nullif(btrim(advanced_entries.metadata ->> selected_filters.key), ''),
              ''
            ) = selected_filters.value
          )
      )
  )
  select
    combined_facets.facet_group,
    combined_facets.facet_key,
    combined_facets.facet_value
  from (
    select * from categories
    union all
    select * from subcategories
    union all
    select * from advanced_facets
  ) combined_facets
  where combined_facets.facet_value is not null;
$$;
