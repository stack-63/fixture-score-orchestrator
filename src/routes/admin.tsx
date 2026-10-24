import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FixtureFormDialog } from "@/components/betting/FixtureFormDialog";
import { FixtureList } from "@/components/betting/FixtureList";
import { useApp } from "@/lib/store";
import { FixtureJsonManager } from "@/components/betting/FixtureJsonManager";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Admin — BETPOAKE" },
      { name: "description", content: "Restricted area." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — BETPOAKE" },
      { property: "og:description", content: "Restricted area." },
    ],
  }),
  component: Page,
});

function Page() {
  const { isAdmin, authReady, roleReady, matches, addMatch } = useApp();
  const [creating, setCreating] = useState(false);

  // Wait for the session + role check before deciding what to render.
  if (!authReady || !roleReady) return <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>;
  // Non-admins get nothing from the management screen rendered. Admin status
  // comes from the server-validated user_roles table (see src/lib/store.tsx).
  if (!isAdmin)
    return (
      <div className="py-16 text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist.</p>
        <Button asChild variant="secondary" className="mt-4"><Link to="/">Go home</Link></Button>
      </div>
    );

  const live = matches.filter((m) => m.status === "live").length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-admin">Admin Panel</p>
          <h1 className="text-3xl font-bold">Fixtures Management</h1>
          <p className="text-sm text-muted-foreground">{matches.length} fixtures · {live} live</p>
        </div>
        <div className="flex flex-wrap gap-2"><FixtureJsonManager /><Button variant="admin" onClick={() => setCreating(true)}><Plus /> Add Game</Button></div>
      </div>
      <FixtureList matches={matches} empty="No fixtures yet. Add your first game." />
      <FixtureFormDialog open={creating} onOpenChange={setCreating}
        onSubmit={async (input) => { await addMatch(input); toast.success("Fixture added to live feed"); }} />
    </div>
  );
}
