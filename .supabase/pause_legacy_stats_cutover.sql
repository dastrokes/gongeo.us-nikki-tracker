BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';

DO $guard$
BEGIN
  IF current_database() <> 'postgres' THEN
    RAISE EXCEPTION 'Run the pause only in the main Supabase database';
  END IF;
END;
$guard$;

LOCK TABLE public.user_banner_stats, public.user_banner_stats_pearpal
  IN SHARE ROW EXCLUSIVE MODE;

CREATE FUNCTION public.reject_legacy_stats_cutover_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $pause$
BEGIN
  IF current_database() = 'stats_pipeline' THEN
    RETURN NULL;
  END IF;
  RAISE EXCEPTION 'Legacy stats writes are paused for cutover' USING ERRCODE = '55000';
END;
$pause$;

REVOKE EXECUTE ON FUNCTION public.reject_legacy_stats_cutover_write() FROM PUBLIC;

CREATE TRIGGER legacy_stats_cutover_pause
BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.user_banner_stats
FOR EACH STATEMENT EXECUTE FUNCTION public.reject_legacy_stats_cutover_write();

CREATE TRIGGER legacy_stats_cutover_pause
BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.user_banner_stats_pearpal
FOR EACH STATEMENT EXECUTE FUNCTION public.reject_legacy_stats_cutover_write();

DO $verify$
DECLARE
  target regclass;
BEGIN
  FOREACH target IN ARRAY ARRAY[
    'public.user_banner_stats'::regclass,
    'public.user_banner_stats_pearpal'::regclass
  ] LOOP
    BEGIN
      EXECUTE format('UPDATE %s SET uid = uid WHERE false', target);
      RAISE EXCEPTION 'Legacy stats write pause did not block %', target;
    EXCEPTION WHEN SQLSTATE '55000' THEN
      NULL;
    END;
  END LOOP;
END;
$verify$;

COMMIT;
