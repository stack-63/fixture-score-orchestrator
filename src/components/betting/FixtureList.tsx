import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useApp, type Match } from "@/lib/store";
import { FixtureFormDialog } from "./FixtureFormDialog";
import { MatchRow } from "./MatchRow";

/** Match list with admin edit/delete wired in. Admin controls are only mounted when isAdmin. */
export function FixtureList({ matches, empty = "No matches found." }: { matches: Match[]; empty?: string }) {
  const { isAdmin, updateMatch, deleteMatch } = useApp();
  const [editing, setEditing] = useState<Match | null>(null);
  const [deleting, setDeleting] = useState<Match | null>(null);

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
            onSubmit={(input) => { if (editing) { updateMatch(editing.id, input); toast.success("Fixture updated"); } }} />
          <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {deleting?.home} vs {deleting?.away}?</AlertDialogTitle>
                <AlertDialogDescription>Are you sure you want to delete this fixture? This will void uncompleted betslips.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => { if (deleting) { deleteMatch(deleting.id); toast.success("Fixture deleted"); } setDeleting(null); }}>
                  Delete Fixture
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
