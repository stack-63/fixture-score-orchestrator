import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatOdd, useApp, type Match, type Pick } from "@/lib/store";
import { cn } from "@/lib/utils";

function statusLabel(m: Match) {
  if (m.status === "live") return `Live - ${m.minute ?? 0}'`;
  const d = new Date(m.kickoff);
  const today = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return today ? `Today ${time}` : `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} ${time}`;
}

export function MatchRow({ match, onEdit, onDelete }: { match: Match; onEdit?: (() => void) | undefined; onDelete?: (() => void) | undefined }) {
  const { selections, toggleSelection, oddsFormat, isAdmin } = useApp();
  const picked = selections.find((s) => s.matchId === match.id)?.pick;
  const opts: { pick: Pick; odd: number }[] = [
    { pick: "1", odd: match.odds.home },
    { pick: "X", odd: match.odds.draw },
    { pick: "2", odd: match.odds.away },
  ];

  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <span className={cn("font-semibold", match.status === "live" ? "text-live" : "text-muted-foreground")}>
          {match.status === "live" && <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-live align-middle" />}
          {statusLabel(match)}
        </span>
        <span className="truncate text-muted-foreground">{match.league}</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 space-y-1 text-sm font-semibold">
          <div className="flex justify-between"><span>{match.home}</span>{match.status === "live" && <span className="text-primary">{match.homeScore}</span>}</div>
          <div className="flex justify-between"><span>{match.away}</span>{match.status === "live" && <span className="text-primary">{match.awayScore}</span>}</div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:w-64">
          {opts.map((o) => (
            <button
              key={o.pick}
              onClick={() => toggleSelection(match, o.pick)}
              className={cn(
                "flex flex-col items-center rounded-lg border px-2 py-1.5 transition-colors",
                picked === o.pick
                  ? "border-primary bg-primary text-primary-foreground shadow-glow"
                  : "bg-secondary hover:border-primary/60",
              )}
            >
              <span className={cn("text-[10px]", picked === o.pick ? "opacity-80" : "text-muted-foreground")}>{o.pick}</span>
              <span className="font-display text-base font-bold">{formatOdd(o.odd, oddsFormat)}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Admin-only controls: not rendered at all (absent from DOM) for regular users */}
      {isAdmin && (onEdit || onDelete) && (
        <div className="mt-3 flex justify-end gap-2 border-t pt-3">
          {onEdit && (
            <Button size="sm" variant="admin" onClick={onEdit}><Pencil /> Edit</Button>
          )}
          {onDelete && (
            <Button size="sm" variant="destructive" onClick={onDelete}><Trash2 /> Delete</Button>
          )}
        </div>
      )}
    </div>
  );
}
