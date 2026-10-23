import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LEAGUES, type Match, type MatchInput } from "@/lib/store";
import { fixtureSchema } from "@/lib/fixtures";
import { toast } from "sonner";

const empty: MatchInput = {
  home: "", away: "", league: LEAGUES[0], kickoff: "", status: "upcoming",
  minute: 0, homeScore: 0, awayScore: 0, odds: { home: 2, draw: 3, away: 3.5 },
};

export function FixtureFormDialog({
  open, onOpenChange, initial, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Match | null;
  onSubmit: (input: MatchInput) => Promise<void>;
}) {
  const [f, setF] = useState<MatchInput>(empty);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (open) {
      const date = new Date(initial?.kickoff ?? Date.now());
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setF(initial ? { ...initial, kickoff: local, odds: { ...initial.odds } } : { ...empty, kickoff: local });
    }
  }, [open, initial]);

  const num = (v: string) => (v === "" ? 0 : Number(v));
  const valid = f.home.trim() && f.away.trim() && f.kickoff && f.odds.home > 1 && f.odds.draw > 1 && f.odds.away > 1;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const validated = fixtureSchema.safeParse({ ...f, id: initial?.id ?? "new", kickoff: new Date(f.kickoff).toISOString() });
    if (!validated.success) { toast.error(validated.error.issues[0]?.message ?? "Check fixture fields"); return; }
    setPending(true);
    try { await onSubmit({ ...f, home: f.home.trim(), away: f.away.trim() }); onOpenChange(false); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Fixture could not be saved"); }
    finally { setPending(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!pending) onOpenChange(value); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">{initial ? "Edit Fixture" : "Add New Fixture"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Home Team Name</Label><Input value={f.home} onChange={(e) => setF({ ...f, home: e.target.value })} required /></div>
            <div className="grid gap-1.5"><Label>Away Team Name</Label><Input value={f.away} onChange={(e) => setF({ ...f, away: e.target.value })} required /></div>
          </div>
          <div className="grid gap-1.5"><Label>Tournament / League</Label><Input value={f.league} onChange={(e) => setF({ ...f, league: e.target.value })} required maxLength={160} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Match Date / Time</Label><Input type="datetime-local" value={f.kickoff} onChange={(e) => setF({ ...f, kickoff: e.target.value })} required /></div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as MatchInput["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="upcoming">Upcoming</SelectItem><SelectItem value="live">Live</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          {f.status === "live" && (
            <div className="grid grid-cols-3 gap-3 rounded-lg border border-live/40 p-3">
              <div className="grid gap-1.5"><Label>Minute</Label><Input type="number" min={0} max={130} value={f.minute ?? 0} onChange={(e) => setF({ ...f, minute: num(e.target.value) })} /></div>
              <div className="grid gap-1.5"><Label>Home Score</Label><Input type="number" min={0} value={f.homeScore} onChange={(e) => setF({ ...f, homeScore: num(e.target.value) })} /></div>
              <div className="grid gap-1.5"><Label>Away Score</Label><Input type="number" min={0} value={f.awayScore} onChange={(e) => setF({ ...f, awayScore: num(e.target.value) })} /></div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {(["home", "draw", "away"] as const).map((k, i) => (
              <div key={k} className="grid gap-1.5">
                <Label>{["Home Odds (1)", "Draw Odds (X)", "Away Odds (2)"][i]}</Label>
                <Input type="number" step="0.01" min="1.01" value={f.odds[k]} onChange={(e) => setF({ ...f, odds: { ...f.odds, [k]: num(e.target.value) } })} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="neon" disabled={!valid || pending}>{pending ? "Saving…" : initial ? "Save Changes" : "Add Fixture"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
