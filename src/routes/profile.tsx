import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
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
  const { user, authReady, isAdmin, signOut, oddsFormat, setOddsFormat } = useApp();
  const [light, setLight] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();
  useEffect(() => { document.documentElement.classList.toggle("light", light); }, [light]);

  const logOut = async () => {
    const { queryClient } = router.options.context;
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (authReady && !user)
    return (
      <div className="max-w-xl space-y-4 py-10 text-center">
        <h1 className="text-3xl font-bold">You're not signed in</h1>
        <p className="text-sm text-muted-foreground">Sign in to view your profile and settings.</p>
        <Button asChild variant="neon"><Link to="/auth" search={{ redirect: "/profile" }}>Sign In</Link></Button>
      </div>
    );

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-3xl font-bold">Profile & Settings</h1>
      <div className="rounded-xl border bg-card">
        <Row title="Account" desc={user?.email}>
          {isAdmin && (
            <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-admin">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin
            </span>
          )}
        </Row>
        <Row title="Light Theme"><Switch checked={light} onCheckedChange={setLight} /></Row>
        <Row title="Odds Format" desc={oddsFormat === "decimal" ? "Decimal (1.85)" : "Fractional (17/20)"}>
          <div className="flex gap-1">
            {(["decimal", "fractional"] as const).map((f) => (
              <Button key={f} size="sm" variant={oddsFormat === f ? "default" : "secondary"} onClick={() => setOddsFormat(f)} className="capitalize">{f}</Button>
            ))}
          </div>
        </Row>
        <Row title="Password"><Button size="sm" variant="secondary" onClick={() => toast("Password change coming soon")}><KeyRound /> Change</Button></Row>
        <Row title="Log Out"><Button size="sm" variant="destructive" onClick={logOut}><LogOut /> Log Out</Button></Row>
      </div>
    </div>
  );
}
