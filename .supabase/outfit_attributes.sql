create or replace function public.list_outfits(
  p_page integer default 1,
  p_page_size integer default 18,
  p_quality integer default null,
  p_style_key varchar(16) default null,
  p_label_id integer default null,
  p_obtain_min integer default null,
  p_obtain_max integer default null,
  p_obtain_ids integer[] default null
)
returns table (
  id bigint,
  quality integer,
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
      o.id,
      o.quality,
      o.props,
      o.style_key,
      o.tags,
      o.obtain_type,
      case
        when o.obtain_type is null then null
        else substring(o.obtain_type::text from 1 for 3)::integer
      end as obtain_version_prefix
    from public.outfits o
    where o.id between 10000 and 99999
      and (p_quality is null or o.quality = p_quality)
      and (p_style_key is null or o.style_key = p_style_key)
      and (p_label_id is null or o.tags @> array[p_label_id]::integer[])
      and (p_obtain_min is null or o.obtain_type >= p_obtain_min)
      and (p_obtain_max is null or o.obtain_type <= p_obtain_max)
      and (
        p_obtain_ids is null
        or cardinality(p_obtain_ids) = 0
        or o.obtain_type = any(p_obtain_ids)
      )
  ),
  totals as (
    select count(*)::bigint as total_count
    from filtered
  ),
  paged as (
    select
      filtered.id,
      filtered.quality,
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
    null::integer[] as props,
    null::varchar(16) as style_key,
    null::integer[] as tags,
    null::integer as obtain_type,
    totals.total_count
  from totals
  where totals.total_count > 0
    and not exists (select 1 from paged);
$$;
