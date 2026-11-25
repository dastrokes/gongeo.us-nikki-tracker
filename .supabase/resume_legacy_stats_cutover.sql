BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';

DO $guard$
BEGIN
  IF current_database() <> 'postgres' THEN
    RAISE EXCEPTION 'Run the resume only in the main Supabase database';
  END IF;
END;
$guard$;

DROP TRIGGER legacy_stats_cutover_pause ON public.user_banner_stats;
DROP TRIGGER legacy_stats_cutover_pause ON public.user_banner_stats_pearpal;
DROP FUNCTION public.reject_legacy_stats_cutover_write();

COMMIT;
