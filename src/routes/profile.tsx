import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Settings — BETPOAKE" },
      { name: "description", content: "Manage your account, theme and odds format." },
      { property: "og:title", content: "Profile & Settings — BETPOAKE" },
      { property: "og:description", content: "Manage your account, theme and odds format." },
    ],
  }),
  component: Page,
});

function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b p-4 last:border-0">
      <div><p className="font-semibold">{title}</p>{desc && <p className="text-xs text-muted-foreground">{desc}</p>}</div>
      {children}
    </div>
  );
}

function Page() {
  const { isAdmin, setIsAdmin, oddsFormat, setOddsFormat } = useApp();
  const [light, setLight] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle("light", light); }, [light]);

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-3xl font-bold">Profile & Settings</h1>
      <div className="rounded-xl border bg-card">
        <Row title="Light Theme"><Switch checked={light} onCheckedChange={setLight} /></Row>
        <Row title="Odds Format" desc={oddsFormat === "decimal" ? "Decimal (1.85)" : "Fractional (17/20)"}>
          <div className="flex gap-1">
            {(["decimal", "fractional"] as const).map((f) => (
              <Button key={f} size="sm" variant={oddsFormat === f ? "default" : "secondary"} onClick={() => setOddsFormat(f)} className="capitalize">{f}</Button>
            ))}
          </div>
        </Row>
        <Row title="Password"><Button size="sm" variant="secondary" onClick={() => toast("Password change coming soon")}><KeyRound /> Change</Button></Row>
        <Row title="Log Out"><Button size="sm" variant="destructive" onClick={() => toast("Logged out (simulated)")}><LogOut /> Log Out</Button></Row>
      </div>

      {/* DEV ONLY: remove before launch; real role comes from the user_roles table. */}
      <div className="rounded-xl border border-admin/50 bg-card">
        <Row title="Simulate Admin View" desc="Testing only — toggles admin tools on and off.">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-admin" />
            <Switch checked={isAdmin} onCheckedChange={setIsAdmin} aria-label="Simulate Admin View" />
          </div>
        </Row>
      </div>
    </div>
  );
}
