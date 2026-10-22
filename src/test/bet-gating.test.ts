import { describe, expect, it } from "vitest";
import { canPlaceBet } from "@/lib/store";

describe("placing a bet", () => {
  it("is never allowed for a signed-out user, even with funds", () => {
    expect(canPlaceBet(null, 1000, 100)).toBe(false);
  });

  it("is allowed for a signed-in user staking within their balance", () => {
    expect(canPlaceBet({ id: "u1" }, 1000, 100)).toBe(true);
  });

  it("is blocked when the stake exceeds the balance", () => {
    expect(canPlaceBet({ id: "u1" }, 50, 100)).toBe(false);
  });
});
