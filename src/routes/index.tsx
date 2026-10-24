import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell, Goal, Swords, Trophy, Volleyball, CircleDot, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FixtureList } from "@/components/betting/FixtureList";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BETPOAKE — Live Odds & Sports Betting in Kenya" },
      { name: "description", content: "Bet on football, basketball, cricket and more with sharp odds in KES. Live and upcoming fixtures." },
      { property: "og:title", content: "BETPOAKE — Live Odds & Sports Betting" },
      { property: "og:description", content: "Sharp odds, instant M-Pesa deposits, live fixtures." },
    ],
  }),
  component: Index,
});

const sports = [
  { name: "Football", icon: Goal }, { name: "Basketball", icon: CircleDot }, { name: "Cricket", icon: Trophy },
  { name: "Tennis", icon: Volleyball }, { name: "Rugby", icon: Hand }, { name: "MMA", icon: Swords }, { name: "Boxing", icon: Dumbbell },
];

const banners = [
  { title: "100% Welcome Bonus!", text: "Deposit 500 KES or more and get an instant match.", cta: "Claim Bonus", bg: "bg-promo" },
  { title: "Daily Free Odds", text: "Join our Telegram channel for daily free odds and download our official Android App.", cta: "Join Telegram", cta2: "Get the App", bg: "bg-promo-alt" },
];

function Index() {
  const { matches } = useApp();
  const [slide, setSlide] = useState(0);
  const [sport, setSport] = useState("Football");
  const [league, setLeague] = useState<string | null>(null);
  useEffect(() => { const t = setInterval(() => setSlide((s) => (s + 1) % banners.length), 6000); return () => clearInterval(t); }, []);
  const b = banners[slide] ?? banners[0];
  if (!b) return null;
  const list = matches.filter((m) => !league || m.league === league);

  return (
    <div className="space-y-5">
      <section className={cn("relative overflow-hidden rounded-2xl border p-5 sm:p-8", b.bg)}>
        <h1 className="text-3xl font-extrabold sm:text-5xl">{b.title}</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground sm:text-base">{b.text}</p>
        <div className="mt-4 flex gap-2">
          <Button variant="neon">{b.cta}</Button>
          {b.cta2 && <Button variant="secondary">{b.cta2}</Button>}
        </div>
        <div className="absolute right-4 bottom-4 flex gap-1.5">
          {banners.map((_, i) => <button key={i} aria-label={`Slide ${i + 1}`} onClick={() => setSlide(i)} className={cn("h-1.5 rounded-full transition-all", i === slide ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground")} />)}
        </div>
      </section>

      <div className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3">
        {sports.map((s) => (
          <button key={s.name} onClick={() => setSport(s.name)}
            className={cn("flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium", sport === s.name ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
            <s.icon className="h-4 w-4" />{s.name}
          </button>
        ))}
      </div>

      <div className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3">
        <button onClick={() => setLeague(null)} className={cn("shrink-0 rounded-md px-3 py-1 text-xs font-semibold", !league ? "bg-accent text-accent-foreground" : "bg-secondary")}>All Competitions</button>
        {[...new Set(matches.map((m) => m.league))].map((l) => (
          <button key={l} onClick={() => setLeague(l)} className={cn("shrink-0 rounded-md px-3 py-1 text-xs font-semibold", league === l ? "bg-accent text-accent-foreground" : "bg-secondary")}>{l}</button>
        ))}
      </div>

      <section>
        <h2 className="mb-2 text-2xl font-bold">{sport} — Live & Upcoming</h2>
        <FixtureList matches={sport === "Football" ? list : []} empty={`No ${sport} fixtures right now.`} />
      </section>
    </div>
  );
}
