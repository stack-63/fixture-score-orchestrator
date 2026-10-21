import { describe, expect, it } from "vitest";
import { removeFixture, type Match, type PlacedBet } from "@/lib/store";

const m = (id: string) => ({ id }) as Match;

describe("deleting a fixture", () => {
  it("voids open betslips that include it and leaves others open", () => {
    const sel = { matchId: "a", pick: "1" as const, odd: 2, label: "" };
    const bets = [
      { id: "b1", status: "open", selections: [sel] },
      { id: "b2", status: "open", selections: [{ ...sel, matchId: "b" }] },
    ] as PlacedBet[];
    const r = removeFixture([m("a"), m("b")], bets, [sel], "a");
    expect(r.matches.map((x) => x.id)).toEqual(["b"]);
    expect(r.selections).toHaveLength(0);
    expect(r.bets.map((b) => b.status)).toEqual(["void", "open"]);
  });
});
