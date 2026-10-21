import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Home, ListChecks, Radio, Shield, Ticket, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { kes, useApp } from "@/lib/store";
import { Betslip } from "./Betslip";
import { DepositModal } from "./DepositModal";

export function AppShell({ children }: { children: ReactNode }) {
  const { balance, selections, isAdmin } = useApp();
  const [depositOpen, setDepositOpen] = useState(false);
  const [slipOpen, setSlipOpen] = useState(false);

  const nav = [
    { to: "/", label: "Home", icon: Home },
    { to: "/live", label: "Live", icon: Radio },
    { to: "/betslip", label: "Betslip", icon: Ticket, badge: selections.length },
    { to: "/my-bets", label: "My Bets", icon: ListChecks },
    { to: "/profile", label: "Profile", icon: User },
    // Admin link only exists in the nav array when admin mode is on
    ...(isAdmin ? [{ to: "/admin", label: "Admin Panel", icon: Shield, admin: true }] : []),
  ] as const;

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-3 sm:px-6">
          <Link to="/" className="font-display text-2xl font-extrabold tracking-wide">BET<span className="text-primary">POAKE</span></Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-md bg-secondary px-2.5 py-1.5 text-sm font-semibold sm:block">{kes(balance)}</span>
            <Button size="sm" variant="neon" onClick={() => setDepositOpen(true)}>Deposit</Button>
            <Button size="icon" variant="ghost" aria-label="Notifications"><Bell /></Button>
            <Link to="/profile" className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-bold">JK</Link>
          </div>
        </div>
        <div className="px-3 pb-2 text-xs font-semibold sm:hidden">Balance: <span className="text-primary">{kes(balance)}</span></div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-3 py-4 sm:px-6">
        <aside className="sticky top-20 hidden h-fit w-52 shrink-0 space-y-1 lg:block">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary ${"admin" in n ? "text-admin" : ""}`}
              activeProps={{ className: "bg-secondary text-primary" }}>
              <n.icon className="h-4 w-4" />{n.label}
              {"badge" in n && n.badge > 0 && <span className="ml-auto rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">{n.badge}</span>}
            </Link>
          ))}
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
        <aside className="sticky top-20 hidden h-fit w-80 shrink-0 rounded-xl border bg-card p-4 xl:block">
          <h2 className="mb-3 text-xl font-bold">Betslip</h2>
          <Betslip onDeposit={() => setDepositOpen(true)} />
        </aside>
      </div>

      <footer className="mx-auto max-w-7xl space-y-2 border-t px-3 py-6 text-center text-xs text-muted-foreground sm:px-6">
        <p className="font-semibold text-destructive">Strictly 18+ Only. Underage gambling is an offense.</p>
        <p><span className="font-semibold text-foreground">Responsible Gambling: </span>Please gamble responsibly. Set your limits and only bet what you can afford to lose.</p>
      </footer>

      {/* Floating betslip trigger for mobile/tablet */}
      {selections.length > 0 && (
        <Button variant="neon" className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-full xl:hidden" onClick={() => setSlipOpen(true)}>
          <Ticket /> Betslip ({selections.length})
        </Button>
      )}

      {/* Floating admin dashboard button — only mounted in admin mode */}
      {isAdmin && (
        <Button asChild variant="admin" className="fixed right-4 bottom-36 z-30 rounded-full shadow-lg lg:bottom-6">
          <Link to="/admin"><Shield /> Admin Dashboard</Link>
        </Button>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background/95 backdrop-blur lg:hidden">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${"admin" in n ? "text-admin" : "text-muted-foreground"}`}
            activeProps={{ className: "text-primary" }}>
            <n.icon className="h-5 w-5" />{"admin" in n ? "Admin" : n.label}
            {"badge" in n && n.badge > 0 && <span className="absolute top-1 right-[calc(50%-18px)] rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{n.badge}</span>}
          </Link>
        ))}
      </nav>

      <Sheet open={slipOpen} onOpenChange={setSlipOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader><SheetTitle>Betslip</SheetTitle></SheetHeader>
          <div className="px-4 pb-4"><Betslip onDeposit={() => { setSlipOpen(false); setDepositOpen(true); }} /></div>
        </SheetContent>
      </Sheet>
      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
    </div>
  );
}
