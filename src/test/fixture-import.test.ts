import { describe, expect, it } from "vitest";
import { importSummary, parseFixtureJson, requireFixtureAdmin } from "@/lib/fixtures";
import { selectionIssues, type Match } from "@/lib/store";

const row = { id: "game-a", home: "Arsenal", away: "Chelsea", league: "English Premier League", kickoff: "2026-10-23T18:00:00+03:00", status: "upcoming" as const, homeScore: 0, awayScore: 0, odds: { home: 1.85, draw: 3.4, away: 4.1 } };
describe("admin fixture JSON", () => {
  it("accepts a valid ISO fixture schedule", () => { expect(parseFixtureJson(JSON.stringify([row])).rows?.[0]?.odds.home).toBe(1.85); });
  it("rejects malformed JSON", () => { expect(parseFixtureJson("[broken").rows).toBeNull(); });
  it("requires odds greater than 1.00", () => { expect(parseFixtureJson(JSON.stringify([{ ...row, odds: { ...row.odds, home: 1 } }])).rows).toBeNull(); });
  it("rejects invalid match status", () => { expect(parseFixtureJson(JSON.stringify([{ ...row, status: "finished" }])).rows).toBeNull(); });
  it("requires an ISO kickoff with timezone", () => { expect(parseFixtureJson(JSON.stringify([{ ...row, kickoff: "tomorrow" }])).rows).toBeNull(); });
  it("rejects duplicate fixture IDs", () => { expect(parseFixtureJson(JSON.stringify([row, row])).rows).toBeNull(); });
  it("merge updates IDs and adds new IDs without removing others", () => { expect(importSummary([{ id: "a" }, { id: "b" }], [{ id: "b" }, { id: "c" }], "merge")).toEqual({ added: 1, updated: 1, removed: 0 }); });
  it("replace removes IDs missing from the new schedule", () => { expect(importSummary([{ id: "a" }, { id: "b" }], [{ id: "b" }, { id: "c" }], "replace")).toEqual({ added: 1, updated: 1, removed: 1 }); });
  it("rejects non-admin writes", () => { expect(() => requireFixtureAdmin(false)).toThrow("Only admins"); });
  it("allows a validated admin", () => { expect(() => requireFixtureAdmin(true)).not.toThrow(); });
  it("marks a removed selection void", () => { expect(selectionIssues([], [{ matchId: row.id, pick: "1", odd: 1.85, label: "Arsenal vs Chelsea" }])[0]?.type).toBe("void"); });
  it("flags shifted odds until the new price is accepted", () => {
    const changed: Match = { ...row, odds: { ...row.odds, home: 2.1 } };
    expect(selectionIssues([changed], [{ matchId: row.id, pick: "1", odd: 1.85, label: "" }])[0]).toEqual({ matchId: row.id, type: "changed", odd: 2.1 });
    expect(selectionIssues([changed], [{ matchId: row.id, pick: "1", odd: 2.1, label: "" }])).toEqual([]);
  });
});