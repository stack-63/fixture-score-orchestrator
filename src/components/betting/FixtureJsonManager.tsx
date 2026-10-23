import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileJson, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { MAX_JSON_BYTES, importSummary, parseFixtureJson, type ImportMode } from "@/lib/fixtures";
import { importFixtures } from "@/lib/fixtures.functions";
import { useApp } from "@/lib/store";

export function FixtureJsonManager() {
  const { matches } = useApp();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<ImportMode>("merge");
  const [confirm, setConfirm] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const result = useMemo(() => text.trim() ? parseFixtureJson(text) : { rows: null, errors: [] }, [text]);
  const summary = importSummary(matches, result.rows ?? [], mode);
  const mutation = useMutation({ mutationFn: useServerFn(importFixtures), onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ["fixtures"] });
    toast.success("Fixtures imported successfully");
    setConfirm(false); setOpen(false); setText(""); setFileName("");
  }, onError: (error) => toast.error(error.message) });

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    setFileError(""); setText(""); setFileName(file.name);
    if (!file.name.toLowerCase().endsWith(".json")) return setFileError("Choose a .json file.");
    if (file.size > MAX_JSON_BYTES) return setFileError("The file exceeds 2 MB.");
    try { setText(await file.text()); } catch { setFileError("The file could not be read."); }
  };
  const submit = () => {
    if (result.rows) mutation.mutate({ data: { rows: result.rows, mode } });
  };
  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(matches, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "betpoake-fixtures.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <>
    <Button variant="secondary" onClick={exportJson}><Download /> Export JSON</Button>
    <Button variant="admin" onClick={() => setOpen(true)}><FileJson /> Import JSON</Button>
    <Dialog open={open} onOpenChange={(value) => { if (!mutation.isPending) setOpen(value); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle className="text-2xl">JSON Fixtures Manager</DialogTitle></DialogHeader>
        <Tabs defaultValue="file">
          <TabsList><TabsTrigger value="file">Upload file</TabsTrigger><TabsTrigger value="paste">Paste JSON</TabsTrigger></TabsList>
          <TabsContent value="file">
            <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-5 text-center" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void readFile(e.dataTransfer.files[0]); }}>
              <Upload className="h-7 w-7 text-admin" />
              <p className="max-w-full break-all text-sm text-muted-foreground">{fileName || "Drop a JSON file"}</p>
              <Button variant="secondary" onClick={() => fileInput.current?.click()}>Choose file</Button>
              <input ref={fileInput} type="file" accept=".json,application/json" className="hidden" aria-label="Fixture JSON file" onChange={(e) => { void readFile(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
          </TabsContent>
          <TabsContent value="paste"><Label htmlFor="fixture-json">Fixture JSON</Label><Textarea id="fixture-json" className="mt-2 min-h-56 font-mono text-xs" value={text} onChange={(e) => { setText(e.target.value); setFileError(""); }} spellCheck={false} placeholder="[]" /><Button variant="ghost" size="sm" disabled={!result.rows} onClick={() => setText(JSON.stringify(result.rows, null, 2))}>Format JSON</Button></TabsContent>
        </Tabs>
        {(fileError || result.errors.length > 0) && <div role="alert" className="max-h-36 space-y-1 overflow-y-auto text-sm text-destructive">{fileError && <p>{fileError}</p>}{result.errors.slice(0, 30).map((error, i) => <p key={i}>{error}</p>)}{result.errors.length > 30 && <p>{result.errors.length - 30} more errors</p>}</div>}
        {result.rows && <>
          <div className="flex flex-wrap gap-4 border-y py-3 text-sm"><strong>{result.rows.length} fixtures</strong><span>{result.rows.filter((row) => row.status === "live").length} live</span><span>{result.rows.filter((row) => row.status === "upcoming").length} upcoming</span></div>
          <div className="max-h-40 overflow-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b"><th className="py-2">Match</th><th>1</th><th>X</th><th>2</th></tr></thead><tbody>{result.rows.slice(0, 10).map((row) => <tr key={row.id} className="border-b"><td className="max-w-52 break-words py-2 pr-3">{row.home} vs {row.away}</td><td className="pr-2">{row.odds.home}</td><td className="pr-2">{row.odds.draw}</td><td>{row.odds.away}</td></tr>)}</tbody></table></div>
        </>}
        <fieldset className="space-y-2"><legend className="mb-2 text-sm font-semibold">Import mode</legend><label className="flex items-center gap-2 text-sm"><input type="radio" name="import-mode" value="merge" checked={mode === "merge"} onChange={() => setMode("merge")} />Merge / Append</label><label className="flex items-center gap-2 text-sm"><input type="radio" name="import-mode" value="replace" checked={mode === "replace"} onChange={() => setMode("replace")} />Replace All Fixtures</label></fieldset>
        {result.rows && <p className="text-sm text-muted-foreground">{summary.added} new · {summary.updated} updated · {summary.removed} removed</p>}
        <Button variant="admin" disabled={!result.rows || !!fileError || mutation.isPending} onClick={() => mode === "replace" ? setConfirm(true) : submit()}>{mutation.isPending ? <Loader2 className="animate-spin" /> : <Upload />} {mutation.isPending ? "Saving…" : "Import Fixtures"}</Button>
      </DialogContent>
    </Dialog>
    <AlertDialog open={confirm} onOpenChange={(value) => { if (!mutation.isPending) setConfirm(value); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Replace all fixtures?</AlertDialogTitle><AlertDialogDescription>{summary.removed} fixtures will be removed. Open betslips containing removed fixtures will be void. {result.rows?.length === 0 && "This will clear the entire schedule."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel><Button variant="destructive" disabled={mutation.isPending} onClick={submit}>{mutation.isPending ? "Saving…" : "Replace Fixtures"}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}