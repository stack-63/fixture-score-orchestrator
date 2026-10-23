CREATE TABLE public.fixtures (
 id text PRIMARY KEY,
 home text NOT NULL,
 away text NOT NULL,
 league text NOT NULL,
 kickoff timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','live')),
 minute integer CHECK (minute BETWEEN 0 AND 130),
 home_score integer NOT NULL DEFAULT 0 CHECK (home_score BETWEEN 0 AND 999),
 away_score integer NOT NULL DEFAULT 0 CHECK (away_score BETWEEN 0 AND 999),
 odds jsonb NOT NULL CHECK (jsonb_typeof(odds->'home') = 'number' AND jsonb_typeof(odds->'draw') = 'number' AND jsonb_typeof(odds->'away') = 'number' AND (odds->>'home')::numeric > 1 AND (odds->>'draw')::numeric > 1 AND (odds->>'away')::numeric > 1),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fixtures TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fixtures TO authenticated;
GRANT ALL ON public.fixtures TO service_role;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public fixture feed" ON public.fixtures FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin fixture insert" ON public.fixtures FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin fixture update" ON public.fixtures FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin fixture delete" ON public.fixtures FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE FUNCTION public.import_fixtures(_rows jsonb, _mode text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE added integer; updated integer; removed integer := 0;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only admins can change fixtures' USING ERRCODE = '42501'; END IF;
 IF _mode NOT IN ('merge','replace') OR jsonb_typeof(_rows) <> 'array' OR jsonb_array_length(_rows) > 2000 THEN RAISE EXCEPTION 'Invalid fixture import'; END IF;
 PERFORM pg_advisory_xact_lock(7236191);
 SELECT count(*) FILTER (WHERE f.id IS NULL), count(*) FILTER (WHERE f.id IS NOT NULL) INTO added, updated FROM jsonb_array_elements(_rows) r LEFT JOIN public.fixtures f ON f.id = r->>'id';
 INSERT INTO public.fixtures (id, home, away, league, kickoff, status, minute, home_score, away_score, odds)
 SELECT r->>'id', r->>'home', r->>'away', r->>'league', (r->>'kickoff')::timestamptz, r->>'status', (r->>'minute')::integer, COALESCE((r->>'homeScore')::integer,0), COALESCE((r->>'awayScore')::integer,0), r->'odds' FROM jsonb_array_elements(_rows) r
 ON CONFLICT (id) DO UPDATE SET home=EXCLUDED.home, away=EXCLUDED.away, league=EXCLUDED.league, kickoff=EXCLUDED.kickoff, status=EXCLUDED.status, minute=EXCLUDED.minute, home_score=EXCLUDED.home_score, away_score=EXCLUDED.away_score, odds=EXCLUDED.odds, updated_at=now();
 IF _mode = 'replace' THEN
 DELETE FROM public.fixtures WHERE id NOT IN (SELECT r->>'id' FROM jsonb_array_elements(_rows) r);
 GET DIAGNOSTICS removed = ROW_COUNT;
 END IF;
 RETURN jsonb_build_object('added',added,'updated',updated,'removed',removed);
END;
$$;
REVOKE ALL ON FUNCTION public.import_fixtures(jsonb,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_fixtures(jsonb,text) TO authenticated;
CREATE FUNCTION public.delete_fixture(_id text) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only admins can change fixtures' USING ERRCODE = '42501'; END IF;
 PERFORM pg_advisory_xact_lock(7236191);
 DELETE FROM public.fixtures WHERE id = _id;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_fixture(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_fixture(text) TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fixtures;