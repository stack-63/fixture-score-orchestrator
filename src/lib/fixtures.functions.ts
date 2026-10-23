import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { fixtureBatchSchema, requireFixtureAdmin, type Fixture } from "./fixtures";

export const listFixtures = createServerFn({ method: "GET" }).handler(async (): Promise<Fixture[]> => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Fixture service is unavailable.");
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data, error } = await client.from("fixtures").select("id,home,away,league,kickoff,status,minute,home_score,away_score,odds").order("kickoff").limit(2000);
  if (error) throw new Error("Unable to load fixtures. Please try again.");
  return fixtureBatchSchema.parse((data ?? []).map((row) => ({
    id: row.id, home: row.home, away: row.away, league: row.league,
    kickoff: row.kickoff, status: row.status,
    ...(row.minute === null ? {} : { minute: row.minute }),
    homeScore: row.home_score, awayScore: row.away_score, odds: row.odds,
  })));
});

export const importFixtures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ rows: fixtureBatchSchema, mode: z.enum(["merge", "replace"]) }))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    requireFixtureAdmin(!role.error && role.data === true);
    const result = await context.supabase.rpc("import_fixtures", { _rows: data.rows, _mode: data.mode });
    if (result.error) throw new Error("Fixtures were not saved. Please retry.");
    return result.data;
  });

export const deleteFixture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().min(1).max(100) }))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    requireFixtureAdmin(!role.error && role.data === true);
    const result = await context.supabase.rpc("delete_fixture", { _id: data.id });
    if (result.error) throw new Error("Fixture was not deleted. Please retry.");
    return { success: true };
  });