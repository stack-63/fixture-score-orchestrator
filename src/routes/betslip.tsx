import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Betslip } from "@/components/betting/Betslip";
import { DepositModal } from "@/components/betting/DepositModal";

export const Route = createFileRoute("/betslip")({
  head: () => ({
    meta: [
      { title: "Betslip — BETPOAKE" },
      { name: "description", content: "Review your selections and place your bet." },
      { property: "og:title", content: "Betslip — BETPOAKE" },
      { property: "og:description", content: "Review your selections and place your bet." },
    ],
  }),
  component: Page,
});

function Page() {
  const [open, setOpen] = useState(false);
  return (
    <div className="max-w-lg">
      <h1 className="mb-3 text-3xl font-bold">Betslip</h1>
      <Betslip onDeposit={() => setOpen(true)} />
      <DepositModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
