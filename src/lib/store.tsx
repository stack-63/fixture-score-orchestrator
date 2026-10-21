import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type MatchStatus = "upcoming" | "live";
export type Pick = "1" | "X" | "2";

export interface Match {
  id: string;
  home: string;
  away: string;
  league: string;
  kickoff: string; // datetime-local string, e.g. 2026-10-21T18:00
  status: MatchStatus;
  minute?: number;
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
];

const seed: Match[] = [
  { id: "m1", home: "Arsenal", away: "Chelsea", league: LEAGUES[0], kickoff: "2026-10-21T17:00", status: "live", minute: 64, homeScore: 1, awayScore: 0, odds: { home: 1.85, draw: 3.4, away: 4.1 } },
  { id: "m2", home: "Real Madrid", away: "Sevilla", league: LEAGUES[1], kickoff: "2026-10-21T21:00", status: "upcoming", homeScore: 0, awayScore: 0, odds: { home: 1.45, draw: 4.6, away: 6.8 } },
  { id: "m3", home: "Inter", away: "AC Milan", league: LEAGUES[2], kickoff: "2026-10-21T19:45", status: "live", minute: 23, homeScore: 0, awayScore: 0, odds: { home: 2.1, draw: 3.2, away: 3.5 } },
  { id: "m4", home: "Gor Mahia", away: "AFC Leopards", league: LEAGUES[5], kickoff: "2026-10-22T15:00", status: "upcoming", homeScore: 0, awayScore: 0, odds: { home: 2.05, draw: 3.0, away: 3.6 } },
  { id: "m5", home: "Bayern Munich", away: "PSG", league: LEAGUES[3], kickoff: "2026-10-22T22:00", status: "upcoming", homeScore: 0, awayScore: 0, odds: { home: 1.95, draw: 3.75, away: 3.6 } },
];

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
  oddsFormat: "decimal" | "fractional";
  setOddsFormat: (f: "decimal" | "fractional") => void;
  setIsAdmin: (v: boolean) => void;
  toggleSelection: (m: Match, pick: Pick) => void;
  removeSelection: (matchId: string) => void;
  clearSelections: () => void;
  deposit: (amount: number) => void;
  placeBet: (stake: number) => PlacedBet;
  addMatch: (input: MatchInput) => void;
  updateMatch: (id: string, input: MatchInput) => void;
  deleteMatch: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<Match[]>(seed);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [balance, setBalance] = useState(0);
  // SIMULATION ONLY: the real admin check must come from a server-validated
  // `user_roles` table (has_role(auth.uid(), 'admin')), never client state.
  const [isAdmin, setIsAdmin] = useState(false);
  const [oddsFormat, setOddsFormat] = useState<"decimal" | "fractional">("decimal");

  const store = useMemo<Store>(() => {
    const totalOdds = selections.reduce((a, s) => a * s.odd, 1);
    return {
      matches, selections, bets, balance, isAdmin, oddsFormat, setOddsFormat, setIsAdmin,
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
      // TODO(backend): replace with MegaPay STK push / crypto webhook via a server function.
      deposit: (amount) => setBalance((b) => b + amount),
      placeBet: (stake) => {
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
      addMatch: (input) => {
        // TODO(supabase): await supabase.from("fixtures").insert(input).select().single();
        setMatches((p) => [{ ...input, id: crypto.randomUUID() }, ...p]);
      },
      updateMatch: (id, input) => {
        // TODO(supabase): await supabase.from("fixtures").update(input).eq("id", id);
        setMatches((p) => p.map((m) => (m.id === id ? { ...input, id } : m)));
        // Keep betslip odds in sync with shifted odds
        setSelections((p) =>
          p.map((s) =>
            s.matchId !== id ? s : {
              ...s,
              label: `${input.home} vs ${input.away}`,
              odd: s.pick === "1" ? input.odds.home : s.pick === "X" ? input.odds.draw : input.odds.away,
            },
          ),
        );
      },
      deleteMatch: (id) => {
        // TODO(supabase): await supabase.from("fixtures").delete().eq("id", id);
        // and void uncompleted betslips server-side (e.g. trigger or server function).
        const r = removeFixture(matches, bets, selections, id);
        setMatches(r.matches);
        setSelections(r.selections);
        setBets(r.bets);
      },
    };
  }, [matches, selections, bets, balance, isAdmin, oddsFormat]);

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

export const kes = (n: number) =>
  `${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KES`;
