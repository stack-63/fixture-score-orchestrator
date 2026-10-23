import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useApp, type Match } from "@/lib/store";
import { FixtureFormDialog } from "./FixtureFormDialog";
import { MatchRow } from "./MatchRow";
import { Button } from "@/components/ui/button";

/** Match list with admin edit/delete wired in. Admin controls are only mounted when isAdmin. */
export function FixtureList({ matches, empty = "No matches found." }: { matches: Match[]; empty?: string }) {
  const { isAdmin, updateMatch, deleteMatch } = useApp();
  const [editing, setEditing] = useState<Match | null>(null);
  const [deleting, setDeleting] = useState<Match | null>(null);
  const [pending, setPending] = useState(false);

  if (matches.length === 0) return <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{empty}</p>;

  return (
    <>
      <div className="space-y-2">
        {matches.map((m) => (
          <MatchRow key={m.id} match={m}
            onEdit={isAdmin ? () => setEditing(m) : undefined}
            onDelete={isAdmin ? () => setDeleting(m) : undefined} />
        ))}
      </div>
      {isAdmin && (
        <>
          <FixtureFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} initial={editing}
            onSubmit={async (input) => { if (editing) { await updateMatch(editing.id, input); toast.success("Fixture updated"); } }} />
          <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o && !pending) setDeleting(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {deleting?.home} vs {deleting?.away}?</AlertDialogTitle>
                <AlertDialogDescription>Are you sure you want to delete this fixture? This will void uncompleted betslips.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                <Button variant="destructive" disabled={pending} onClick={async () => {
                  if (!deleting) return;
                  setPending(true);
                  try { await deleteMatch(deleting.id); toast.success("Fixture deleted"); setDeleting(null); }
                  catch (error) { toast.error(error instanceof Error ? error.message : "Fixture could not be deleted"); }
                  finally { setPending(false); }
                }}>{pending ? "Deleting…" : "Delete Fixture"}</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
