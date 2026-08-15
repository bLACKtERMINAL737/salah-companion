"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "../../lib/firebase";
import { GlassCard, Button } from "../ui/Primitives";

export function AuthForm() {
  const { t } = useSettings();
  const { configured } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!configured) {
    return <GlassCard className="mx-auto max-w-sm p-6 text-center text-sm text-[var(--text-muted)]">{t("auth.notConfigured")}</GlassCard>;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") await signInWithEmail(email, password);
      else await signUpWithEmail(email, password);
      router.push("/settings");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/settings");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard className="mx-auto max-w-sm p-6">
      <Button variant="outline" onClick={handleGoogle} disabled={loading} className="w-full">
        {t("auth.continueWithGoogle")}
      </Button>
      <div className="my-4 flex items-center gap-3 text-xs text-[var(--text-muted)]">
        <span className="h-px flex-1 bg-[var(--surface-glass-border)]" />
        {t("auth.orEmail")}
        <span className="h-px flex-1 bg-[var(--surface-glass-border)]" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--text-secondary)]">{t("auth.email")}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--surface-glass-border)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--gold)]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--text-secondary)]">{t("auth.password")}</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--surface-glass-border)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--gold)]"
          />
        </label>
        {error && <p className="text-xs text-[var(--color-rose-alert)]">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {mode === "signin" ? t("common.signIn") : t("common.signUp")}
        </Button>
      </form>
      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-4 w-full text-center text-xs text-[var(--gold)] hover:underline"
      >
        {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}
      </button>
    </GlassCard>
  );
}
