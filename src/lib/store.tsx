import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fixturesQueryOptions } from "./fixtures.query";
import { deleteFixture, importFixtures } from "./fixtures.functions";
import { fixtureSchema } from "./fixtures";

export type MatchStatus = "upcoming" | "live";
export type Pick = "1" | "X" | "2";

export interface Match {
  id: string;
  home: string;
  away: string;
  league: string;
  kickoff: string; // datetime-local string, e.g. 2026-10-21T18:00
  status: MatchStatus;
  minute?: number | undefined;
  homeScore: number;
  awayScore: number;
  odds: { home: number; draw: number; away: number };
}

export interface Selection {
  matchId: string;
  pick: Pick;
  odd: number;
  label: string;
}

export interface PlacedBet {
  id: string;
  selections: Selection[];
  stake: number;
  totalOdds: number;
  potentialWin: number;
  placedAt: string;
  status: "open" | "void";
}

export type MatchInput = Omit<Match, "id">;

export const LEAGUES = [
  "English Premier League (ENG)",
  "La Liga (ESP)",
  "Serie A (ITA)",
  "Champions League",
  "IPL Cricket",
  "Kenyan Premier League",
] as const;

/** Removes a fixture and voids any open bet that included it. Pure for testing. */
export function removeFixture(matches: Match[], bets: PlacedBet[], selections: Selection[], id: string) {
  return {
    matches: matches.filter((m) => m.id !== id),
    selections: selections.filter((s) => s.matchId !== id),
    bets: bets.map((b) =>
      b.status === "open" && b.selections.some((s) => s.matchId === id) ? { ...b, status: "void" as const } : b,
    ),
  };
}

interface Store {
  matches: Match[];
  selections: Selection[];
  bets: PlacedBet[];
  balance: number;
  isAdmin: boolean;
  roleReady: boolean;
  user: { id: string; email: string } | null;
  /** False until the first session check resolves; use to avoid UI flashing signed-out state. */
  authReady: boolean;
  signOut: () => Promise<void>;
  oddsFormat: "decimal" | "fractional";
  setOddsFormat: (f: "decimal" | "fractional") => void;
  toggleSelection: (m: Match, pick: Pick) => void;
  removeSelection: (matchId: string) => void;
  clearSelections: () => void;
  deposit: (amount: number) => void;
  placeBet: (stake: number) => PlacedBet;
  addMatch: (input: MatchInput) => Promise<void>;
  updateMatch: (id: string, input: MatchInput) => Promise<void>;
  deleteMatch: (id: string) => Promise<void>;
  acceptOdds: () => void;
}

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { data: matches } = useSuspenseQuery(fixturesQueryOptions);
  const queryClient = useQueryClient();
  const save = useMutation({ mutationFn: useServerFn(importFixtures), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["fixtures"] }); } });
  const remove = useMutation({ mutationFn: useServerFn(deleteFixture), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["fixtures"] }); } });
  const [selections, setSelections] = useState<Selection[]>([]);
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [balance, setBalance] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleReady, setRoleReady] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [oddsFormat, setOddsFormat] = useState<"decimal" | "fractional">("decimal");

  useEffect(() => {
    const channel = supabase.channel("fixture-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "fixtures" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["fixtures"] });
      }).subscribe((status) => {
        if (status === "SUBSCRIBED") void queryClient.invalidateQueries({ queryKey: ["fixtures"] });
      });
    return () => { void supabase.removeChannel(channel); };
  }, [queryClient]);

  useEffect(() => {
    const ids = new Set(matches.map((m) => m.id));
    setBets((prev) => prev.map((bet) => bet.status === "open" && bet.selections.some((s) => !ids.has(s.matchId)) ? { ...bet, status: "void" } : bet));
  }, [matches]);

  // Single session listener for the whole app (mounted once at the root).
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { id: data.user.id, email: data.user.email ?? "" } : null);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setIsAdmin(false);
      setRoleReady(false);
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Admin status comes from the server-validated user_roles table via the
  // has_role() security-definer function — never from client-editable state.
  useEffect(() => {
    if (!user) { setIsAdmin(false); setRoleReady(true); return; }
    setIsAdmin(false);
    setRoleReady(false);
    let active = true;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      if (active) { setIsAdmin(!!data); setRoleReady(true); }
    });
    return () => { active = false; };
  }, [user]);

  const store = useMemo<Store>(() => {
    const totalOdds = selections.reduce((a, s) => a * s.odd, 1);
    return {
      matches, selections, bets, balance, isAdmin, roleReady, user, authReady, oddsFormat, setOddsFormat,
      signOut: async () => { await supabase.auth.signOut(); },
      toggleSelection: (m, pick) => {
        const odd = pick === "1" ? m.odds.home : pick === "X" ? m.odds.draw : m.odds.away;
        setSelections((prev) => {
          const existing = prev.find((s) => s.matchId === m.id);
          if (existing?.pick === pick) return prev.filter((s) => s.matchId !== m.id);
          const next = prev.filter((s) => s.matchId !== m.id);
          return [...next, { matchId: m.id, pick, odd, label: `${m.home} vs ${m.away}` }];
        });
      },
      removeSelection: (id) => setSelections((p) => p.filter((s) => s.matchId !== id)),
      clearSelections: () => setSelections([]),
      acceptOdds: () => setSelections((prev) => prev.map((s) => {
        const match = matches.find((m) => m.id === s.matchId);
        return match ? { ...s, odd: selectedOdd(match, s.pick), label: `${match.home} vs ${match.away}` } : s;
      })),
      // TODO(backend): replace with MegaPay STK push / crypto webhook via a server function.
      deposit: (amount) => setBalance((b) => b + amount),
      placeBet: (stake) => {
        if (!canPlaceBet(user, balance, stake) || !selections.length || selectionIssues(matches, selections).length) throw new Error("Review your selections and balance before placing a bet.");
        // TODO(backend): supabase.from("bets").insert({...}) inside a server function that debits balance atomically.
        const bet: PlacedBet = {
          id: crypto.randomUUID(), selections, stake, totalOdds,
          potentialWin: stake * totalOdds, placedAt: new Date().toISOString(), status: "open",
        };
        setBets((b) => [bet, ...b]);
        setBalance((b) => b - stake);
        setSelections([]);
        return bet;
      },
      addMatch: async (input) => {
        const row = fixtureSchema.parse({ ...input, id: crypto.randomUUID(), kickoff: new Date(input.kickoff).toISOString() });
        await save.mutateAsync({ data: { rows: [row], mode: "merge" } });
      },
      updateMatch: async (id, input) => {
        const row = fixtureSchema.parse({ ...input, id, kickoff: new Date(input.kickoff).toISOString() });
        await save.mutateAsync({ data: { rows: [row], mode: "merge" } });
      },
      deleteMatch: async (id) => { await remove.mutateAsync({ data: { id } }); },
    };
  }, [matches, selections, bets, balance, isAdmin, roleReady, user, authReady, oddsFormat, save.mutateAsync, remove.mutateAsync]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used within AppProvider");
  return c;
}

export function formatOdd(d: number, format: "decimal" | "fractional") {
  if (format === "decimal") return d.toFixed(2);
  const v = d - 1;
  let best = { n: 1, den: 1, err: Infinity };
  for (let den = 1; den <= 20; den++) {
    const n = Math.round(v * den);
    const err = Math.abs(v - n / den);
    if (err < best.err - 1e-9) best = { n, den, err };
  }
  return `${best.n}/${best.den}`;
}

/** A bet may only be placed by a signed-in user staking within their balance. */
export function canPlaceBet(user: unknown, balance: number, stake: number) {
  return !!user && stake >= 1 && balance > 0 && stake <= balance;
}

export function selectedOdd(match: Match, pick: Pick) {
  return pick === "1" ? match.odds.home : pick === "X" ? match.odds.draw : match.odds.away;
}

export function selectionIssues(matches: Match[], selections: Selection[]) {
  return selections.flatMap<{ matchId: string; type: "void" | "changed"; odd: number | null }>((selection) => {
    const match = matches.find((m) => m.id === selection.matchId);
    if (!match) return [{ matchId: selection.matchId, type: "void" as const, odd: null }];
    const odd = selectedOdd(match, selection.pick);
    return odd === selection.odd ? [] : [{ matchId: selection.matchId, type: "changed" as const, odd }];
  });
}

export const kes = (n: number) =>
  `${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KES`;
