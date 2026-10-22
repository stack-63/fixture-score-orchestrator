import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatOdd, kes, useApp } from "@/lib/store";

export function Betslip({ onDeposit }: { onDeposit: () => void }) {
  const { selections, removeSelection, balance, placeBet, oddsFormat, user } = useApp();
  const [stake, setStake] = useState(100);
  const [loading, setLoading] = useState(false);
  const [warn, setWarn] = useState(false);
  const [success, setSuccess] = useState<null | number>(null);
  const totalOdds = selections.reduce((a, s) => a * s.odd, 1);

  const place = () => {
    if (!user) return; // signed-out users never reach this; the button is replaced by a sign-in CTA
    if (balance <= 0 || stake > balance) return setWarn(true);
    setWarn(false);
    setLoading(true);
    setTimeout(() => {
      const bet = placeBet(stake);
      setLoading(false);
      setSuccess(bet.potentialWin);
    }, 1200);
  };

  const successDialog = (
    <Dialog open={success !== null} onOpenChange={() => setSuccess(null)}>
      <DialogContent className="text-center">
        <DialogHeader><DialogTitle className="text-2xl">Bet Placed!</DialogTitle></DialogHeader>
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <p className="text-sm text-muted-foreground">Potential win: <span className="font-bold text-primary">{kes(success ?? 0)}</span></p>
        <Button asChild variant="secondary"><Link to="/my-bets" onClick={() => setSuccess(null)}>View My Bets</Link></Button>
      </DialogContent>
    </Dialog>
  );

  if (selections.length === 0)
    return (
      <>
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Your betslip is empty. Select odds from any match to place a bet.</p>
        {successDialog}
      </>
    );

  return (
    <div className="space-y-3">
      {selections.map((s) => (
        <div key={s.matchId} className="flex items-center gap-2 rounded-lg border bg-secondary p-2.5 text-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{s.label}</p>
            <p className="text-xs text-muted-foreground">Pick: <span className="text-primary">{s.pick}</span></p>
          </div>
          <span className="font-display text-lg font-bold">{formatOdd(s.odd, oddsFormat)}</span>
          <Button size="icon" variant="ghost" onClick={() => removeSelection(s.matchId)} aria-label="Remove"><Trash2 /></Button>
        </div>
      ))}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Total Selections</span><span>{selections.length}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Total Odds</span><span className="font-bold">{totalOdds.toFixed(2)}</span></div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Stake (KES)</label>
        <Input type="number" min={1} step={1} value={stake} onChange={(e) => setStake(Math.max(0, Math.floor(Number(e.target.value))))} />
        <div className="mt-2 flex gap-1.5">
          {[50, 100, 200].map((v) => <Button key={v} size="sm" variant="secondary" onClick={() => setStake((s) => s + v)}>+{v}</Button>)}
          <Button size="sm" variant="secondary" onClick={() => setStake(Math.floor(balance))}>Max</Button>
        </div>
      </div>
      <div className="flex justify-between rounded-lg bg-secondary p-3">
        <span className="text-sm text-muted-foreground">Potential Win</span>
        <span className="font-display text-xl font-bold text-primary">{kes(stake * totalOdds)}</span>
      </div>
      {warn && (
        <div className="rounded-lg border border-destructive/50 p-3 text-sm">
          Insufficient balance. <button className="font-semibold text-primary underline" onClick={onDeposit}>Deposit now</button>
        </div>
      )}
      {user ? (
        <Button variant="neon" size="lg" className="w-full" disabled={loading || stake < 1} onClick={place}>
          {loading ? <><Loader2 className="animate-spin" /> Placing…</> : "Place Bet"}
        </Button>
      ) : (
        <Button asChild variant="neon" size="lg" className="w-full">
          <Link to="/auth" search={{ redirect: "/betslip" }}>Sign in to place your bet</Link>
        </Button>
      )}
      <Dialog open={success !== null} onOpenChange={() => setSuccess(null)}>
        <DialogContent className="text-center">
          <DialogHeader><DialogTitle className="text-2xl">Bet Placed!</DialogTitle></DialogHeader>
          <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
          <p className="text-sm text-muted-foreground">Potential win: <span className="font-bold text-primary">{kes(success ?? 0)}</span></p>
          <Button asChild variant="secondary"><Link to="/my-bets" onClick={() => setSuccess(null)}>View My Bets</Link></Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
