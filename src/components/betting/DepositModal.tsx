import { useState } from "react";
import { Copy, QrCode, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/lib/store";

const wallets = [
  { name: "Bitcoin (BTC)", addr: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
  { name: "Tether (USDT-TRC20)", addr: "TQ5Nv7r9Gb3sYkC1vXhzP2eWq8mA4uLd6F" },
  { name: "Solana (SOL)", addr: "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV" },
];

export function DepositModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { deposit } = useApp();
  const [phone, setPhone] = useState("0712345678");
  const [amount, setAmount] = useState(500);
  const validPhone = /^(07\d{8}|2547\d{8})$/.test(phone);

  const submit = () => {
    // TODO(backend): call a server function that triggers the MegaPay STK push; credit on callback.
    deposit(amount);
    toast.success(`STK prompt sent to ${phone}. ${amount} KES credited (simulated).`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-2xl">Deposit Funds</DialogTitle></DialogHeader>
        <Tabs defaultValue="mpesa">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mpesa">M-Pesa Instant</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
          </TabsList>
          <TabsContent value="mpesa" className="space-y-3 pt-2">
            <div className="grid gap-1.5"><Label>Phone Number</Label><Input value={phone} onChange={(e) => setPhone(e.target.value.trim())} placeholder="07XXXXXXXX" /></div>
            <div className="grid gap-1.5"><Label>Amount (KES)</Label><Input type="number" min={10} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
            <p className="flex gap-2 rounded-lg bg-secondary p-3 text-xs text-muted-foreground"><Smartphone className="h-4 w-4 shrink-0 text-primary" />Clicking deposit will send a secure STK PIN prompt directly to your phone via MegaPay.</p>
            <Button variant="neon" className="w-full" disabled={!validPhone || amount < 10} onClick={submit}>Deposit</Button>
          </TabsContent>
          <TabsContent value="crypto" className="space-y-3 pt-2">
            {wallets.map((w) => (
              <div key={w.name} className="flex items-center gap-3 rounded-lg border p-3">
                <QrCode className="h-12 w-12 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{w.name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{w.addr}</p>
                </div>
                <Button size="icon" variant="ghost" aria-label="Copy" onClick={() => { navigator.clipboard?.writeText(w.addr); toast.success("Address copied"); }}><Copy /></Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
