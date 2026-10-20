"use client";

import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";

async function post(path: string, body: unknown) {
  const res = await fetch(`/api${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const field = json.errors ? (Object.values(json.errors).flat()[0] as string | undefined) : undefined;
    throw new Error(field ?? json.message ?? "Something went wrong");
  }
  return json as { message?: string; data?: { devCode?: string } };
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function sendCode(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await post("/auth/forgot-password", { email });
      setInfo(r.message ?? "Code sent");
      setDevCode(r.data?.devCode ?? null);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the code");
    } finally {
      setBusy(false);
    }
  }

  async function reset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("newPassword") !== f.get("confirm")) return setError("Passwords don't match");
    setBusy(true);
    setError(null);
    try {
      await post("/auth/reset-password", { email, code: f.get("code"), newPassword: f.get("newPassword") });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reset the password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Reset your password" description="We'll email you a 6-digit code. It works for reporter and NGO accounts.">
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      {step === "email" && (
        <form onSubmit={sendCode} className="space-y-4">
          <Field label="Account email" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Send code
          </Button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={reset} className="space-y-4">
          {info && <Alert kind="success">{info}</Alert>}
          {devCode && (
            <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
              Email isn&apos;t set up on this server yet, so here is the code for testing: <span className="font-mono font-semibold text-foreground">{devCode}</span>
            </p>
          )}
          <Field label="6-digit code" htmlFor="code">
            <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" required className="font-mono text-lg tracking-[0.4em]" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New password" htmlFor="newPassword">
              <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required minLength={8} />
            </Field>
            <Field label="Confirm" htmlFor="confirm">
              <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
            </Field>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Reset password
          </Button>
          <button type="button" onClick={() => sendCode()} disabled={busy} className="w-full text-center text-sm text-primary hover:underline">
            Send a new code
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="space-y-4">
          <Alert kind="success">Your password has been reset.</Alert>
          <Button asChild className="w-full">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      )}

      {step !== "done" && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered it? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      )}
    </AuthShell>
  );
}
