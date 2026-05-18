declare
  luck_min_items constant integer := 3;
  result jsonb;
begin
  with
    settings as (
      select
        array [
          0.00,
          0.05,
          0.10,
          0.15,
          0.20,
          0.25,
          0.30,
          0.35,
          0.40,
          0.45,
          0.50,
          0.55,
          0.60,
          0.65,
          0.70,
          0.75,
          0.80,
          0.85,
          0.90,
          0.95,
          1.00
        ]::double precision[] as fractions,
        array [
          0,
          5,
          10,
          15,
          20,
          25,
          30,
          35,
          40,
          45,
          50,
          55,
          60,
          65,
          70,
          75,
          80,
          85,
          90,
          95,
          100
        ]::integer[] as labels
    ),
    banner_rows as materialized (
      select
        uid,
        region,
        banner_type,
        total_pulls,
        total_4star_items,
        total_5star_items,
        total_4star_pulls,
        total_5star_pulls
      from
        user_banner_stats_view
    ),
    user_stats as materialized (
      select
        uid,
        region,
        sum(total_pulls) as total_pulls,
        sum(total_5star_pulls) filter (
          where
            banner_type = 2
        ) as total_5star_pulls,
        sum(total_5star_items) filter (
          where
            banner_type = 2
        ) as total_5star_items,
        sum(total_4star_pulls) filter (
          where
            banner_type = 2
        ) as total_4star_type2_pulls,
        sum(total_4star_items) filter (
          where
            banner_type = 2
        ) as total_4star_type2_items,
        sum(total_4star_pulls) filter (
          where
            banner_type = 3
        ) as total_4star_type3_pulls,
        sum(total_4star_items) filter (
          where
            banner_type = 3
        ) as total_4star_type3_items
      from
        banner_rows
      group by
        uid,
        region
    ),
    metric_arrays as (
      select
        (
          select
            percentile_cont(settings.fractions) within group (
              order by
                total_5star_pulls::numeric / total_5star_items
            )
          from
            user_stats
          where
            total_5star_items >= luck_min_items
        ) as avg_5star_pulls,
        (
          select
            percentile_cont(settings.fractions) within group (
              order by
                total_5star_pulls::numeric / total_5star_items
            )
          from
            banner_rows
          where
            banner_type = 2
            and total_5star_items >= luck_min_items
        ) as avg_5star_pulls_banner,
        (
          select
            percentile_cont(settings.fractions) within group (
              order by
                total_4star_type2_pulls::numeric / total_4star_type2_items
            )
          from
            user_stats
          where
            total_4star_type2_items >= luck_min_items
        ) as avg_4star_pulls_type2,
        (
          select
            percentile_cont(settings.fractions) within group (
              order by
                total_4star_pulls::numeric / total_4star_items
            )
          from
            banner_rows
          where
            banner_type = 2
            and total_4star_items >= luck_min_items
        ) as avg_4star_pulls_type2_banner,
        (
          select
            percentile_cont(settings.fractions) within group (
              order by
                total_4star_type3_pulls::numeric / total_4star_type3_items
            )
          from
            user_stats
          where
            total_4star_type3_items >= luck_min_items
        ) as avg_4star_pulls_type3,
        (
          select
            percentile_cont(settings.fractions) within group (
              order by
                total_4star_pulls::numeric / total_4star_items
            )
          from
            banner_rows
          where
            banner_type = 3
            and total_4star_items >= luck_min_items
        ) as avg_4star_pulls_type3_banner,
        (
          select
            percentile_cont(settings.fractions) within group (
              order by
                total_pulls::numeric
            )
          from
            user_stats
        ) as total_pulls_per_user,
        settings.labels
      from
        settings
    ),
    metrics as (
      select
        jsonb_build_object(
          'avg_5star_pulls',
          (
            select
              jsonb_agg(
                jsonb_build_array(
                  labels[idx],
                  round((avg_5star_pulls[idx])::numeric, 2)
                )
                order by
                  idx
              )
            from
              generate_subscripts(labels, 1) as idx
          ),
          'avg_5star_pulls_banner',
          (
            select
              jsonb_agg(
                jsonb_build_array(
                  labels[idx],
                  round((avg_5star_pulls_banner[idx])::numeric, 2)
                )
                order by
                  idx
              )
            from
              generate_subscripts(labels, 1) as idx
          ),
          'avg_4star_pulls_type2',
          (
            select
              jsonb_agg(
                jsonb_build_array(
                  labels[idx],
                  round((avg_4star_pulls_type2[idx])::numeric, 2)
                )
                order by
                  idx
              )
            from
              generate_subscripts(labels, 1) as idx
          ),
          'avg_4star_pulls_type2_banner',
          (
            select
              jsonb_agg(
                jsonb_build_array(
                  labels[idx],
                  round((avg_4star_pulls_type2_banner[idx])::numeric, 2)
                )
                order by
                  idx
              )
            from
              generate_subscripts(labels, 1) as idx
          ),
          'avg_4star_pulls_type3',
          (
            select
              jsonb_agg(
                jsonb_build_array(
                  labels[idx],
                  round((avg_4star_pulls_type3[idx])::numeric, 2)
                )
                order by
                  idx
              )
            from
              generate_subscripts(labels, 1) as idx
          ),
          'avg_4star_pulls_type3_banner',
          (
            select
              jsonb_agg(
                jsonb_build_array(
                  labels[idx],
                  round((avg_4star_pulls_type3_banner[idx])::numeric, 2)
                )
                order by
                  idx
              )
            from
              generate_subscripts(labels, 1) as idx
          ),
          'total_pulls_per_user',
          (
            select
              jsonb_agg(
                jsonb_build_array(
                  labels[idx],
                  round((total_pulls_per_user[idx])::numeric, 2)
                )
                order by
                  idx
              )
            from
              generate_subscripts(labels, 1) as idx
          )
        ) as value
      from
        metric_arrays
    )
  select
    jsonb_build_object(
      'generated_at',
      to_char(
        now() at time zone 'UTC',
        'YYYY-MM-DD"T"HH24:MI:SS"Z"'
      ),
      'metrics',
      metrics.value
    ) into result
  from
    metrics;

  return result;
end;
