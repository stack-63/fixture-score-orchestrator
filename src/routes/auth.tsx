import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useApp } from "@/lib/store";
import "@lovable.dev/cloud-auth-js/styles.css";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect:
      typeof search["redirect"] === "string" && search["redirect"].startsWith("/") && !search["redirect"].startsWith("//")
        ? search["redirect"]
        : "/",
  }),
  head: () => ({
    meta: [
      { title: "Sign In — BETPOAKE" },
      { name: "description", content: "Sign in or create your BETPOAKE account to place bets." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Sign In — BETPOAKE" },
      { property: "og:description", content: "Sign in or create your BETPOAKE account to place bets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { redirect } = Route.useSearch();
  const { user, authReady } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  // Already signed in? Send them where they were headed.
  useEffect(() => {
    if (authReady && user) navigate({ to: redirect as "/", replace: true });
  }, [authReady, user, redirect, navigate]);

  const submit = async () => {
    if (!email || !password) return toast.error("Enter your email and password");
    setLoading(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      navigate({ to: redirect as "/" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      // With email confirmation on, there is no session until the link is clicked.
      if (!data.session) return setConfirmSent(true);
      navigate({ to: redirect as "/" });
    }
  };

  const oauth = async (provider: "google" | "lovable") => {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) toast.error(result.error.message ?? "Sign-in failed");
  };

  return (
    <div className="mx-auto max-w-sm space-y-6 py-10">
      <div className="text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-wide">
          BET<span className="text-primary">POAKE</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to place bets and manage your account.</p>
      </div>

      {confirmSent ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <h2 className="text-xl font-bold">Check your email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to <span className="font-semibold text-foreground">{email}</span>. Click it to
            activate your account, then sign in.
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => { setConfirmSent(false); setMode("signin"); }}>
            Back to sign in
          </Button>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md py-1.5 text-sm font-semibold ${mode === m ? "bg-background" : "text-muted-foreground"}`}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Password</label>
              <Input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
            {mode === "signin" && (
              <button
                type="button"
                className="text-xs font-semibold text-primary hover:underline"
                onClick={async () => {
                  if (!email) return toast.error("Enter your email first");
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) return toast.error(error.message);
                  toast.success("Check your email for a password reset link");
                }}
              >
                Forgot password?
              </button>
            )}
          </div>
          <Button variant="neon" size="lg" className="w-full" disabled={loading} onClick={submit}>
            {loading ? <Loader2 className="animate-spin" /> : mode === "signin" ? <LogIn /> : <UserPlus />}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or continue with <span className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-2">
            <Button variant="secondary" className="w-full" onClick={() => oauth("google")}>
              Continue with Google
            </Button>
            <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>
              Continue with Lovable
            </button>
          </div>
        </div>
      )}
      <p className="text-center text-xs text-muted-foreground">Strictly 18+. Please gamble responsibly.</p>
    </div>
  );
}
