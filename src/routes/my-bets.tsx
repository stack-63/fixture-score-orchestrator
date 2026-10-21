import { createFileRoute } from "@tanstack/react-router";
import { kes, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/my-bets")({
  head: () => ({
    meta: [
      { title: "My Bets — BETPOAKE" },
      { name: "description", content: "Track your open and settled bets." },
      { property: "og:title", content: "My Bets — BETPOAKE" },
      { property: "og:description", content: "Track your open and settled bets." },
    ],
  }),
  component: Page,
});

function Page() {
  const { bets } = useApp();
  return (
    <div className="space-y-2">
      <h1 className="mb-3 text-3xl font-bold">My Bets</h1>
      {bets.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No bets yet.</p>}
      {bets.map((b) => (
        <div key={b.id} className="rounded-xl border bg-card p-4 text-sm">
          <div className="mb-2 flex justify-between">
            <span className="text-muted-foreground">{new Date(b.placedAt).toLocaleString("en-GB")}</span>
            <span className={cn("rounded px-2 text-xs font-bold uppercase", b.status === "void" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground")}>{b.status}</span>
          </div>
          {b.selections.map((s) => <p key={s.matchId}>{s.label} — <span className="text-primary">{s.pick}</span> @ {s.odd.toFixed(2)}</p>)}
          <p className="mt-2 text-muted-foreground">Stake {kes(b.stake)} · Odds {b.totalOdds.toFixed(2)} · Win <span className="font-bold text-primary">{kes(b.potentialWin)}</span></p>
        </div>
      ))}
    </div>
  );
}
