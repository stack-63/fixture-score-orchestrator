import { z } from "zod";

export const fixtureSchema = z.object({
  id: z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, "Use letters, numbers, underscores or hyphens"),
  home: z.string().trim().min(1).max(120),
  away: z.string().trim().min(1).max(120),
  league: z.string().trim().min(1).max(160),
  kickoff: z.string().datetime({ offset: true, message: "Use an ISO date with timezone, e.g. 2026-10-23T18:00:00+03:00" }),
  status: z.enum(["upcoming", "live"]),
  minute: z.number().int().min(0).max(130).optional(),
  homeScore: z.number().int().min(0).max(999).default(0),
  awayScore: z.number().int().min(0).max(999).default(0),
  odds: z.object({ home: z.number().finite().gt(1), draw: z.number().finite().gt(1), away: z.number().finite().gt(1) }).strict(),
}).strict();

export const fixtureBatchSchema = z.array(fixtureSchema).max(2000).superRefine((rows, ctx) => {
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    if (seen.has(row.id)) ctx.addIssue({ code: "custom", path: [index, "id"], message: "Duplicate fixture ID" });
    seen.add(row.id);
  });
});
export type Fixture = z.infer<typeof fixtureSchema>;
export type ImportMode = "merge" | "replace";
export const MAX_JSON_BYTES = 2 * 1024 * 1024;

export function parseFixtureJson(text: string) {
  if (new TextEncoder().encode(text).length > MAX_JSON_BYTES) return { rows: null, errors: ["The file exceeds 2 MB."] };
  let value: unknown;
  try { value = JSON.parse(text); } catch { return { rows: null, errors: ["Invalid JSON. Check commas, quotes and brackets."] }; }
  const result = fixtureBatchSchema.safeParse(value);
  if (!result.success) return { rows: null, errors: result.error.issues.map((issue) => {
    const [row, ...path] = issue.path;
    return `${typeof row === "number" ? `Row ${row + 1}: ${path.join(".")}` : "Fixtures"}: ${issue.message}`;
  }) };
  return { rows: result.data, errors: [] };
}

export function importSummary(current: { id: string }[], incoming: { id: string }[], mode: ImportMode) {
  const existing = new Set(current.map((row) => row.id));
  const next = new Set(incoming.map((row) => row.id));
  return {
    added: incoming.filter((row) => !existing.has(row.id)).length,
    updated: incoming.filter((row) => existing.has(row.id)).length,
    removed: mode === "replace" ? current.filter((row) => !next.has(row.id)).length : 0,
  };
}

export function requireFixtureAdmin(allowed: boolean | null) {
  if (allowed !== true) throw new Error("Only admins can change fixtures.");
}