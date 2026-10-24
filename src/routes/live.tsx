import { createFileRoute } from "@tanstack/react-router";
import { FixtureList } from "@/components/betting/FixtureList";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Live Matches — BETPOAKE" },
      { name: "description", content: "In-play matches with live scores and odds." },
      { property: "og:title", content: "Live Matches — BETPOAKE" },
      { property: "og:description", content: "In-play matches with live scores and odds." },
    ],
  }),
  component: Live,
});

function Live() {
  const { matches } = useApp();
  return (
    <div>
      <h1 className="mb-3 text-3xl font-bold">Live Matches</h1>
      <FixtureList matches={matches.filter((m) => m.status === "live")} empty="No live matches right now." />
    </div>
  );
}
