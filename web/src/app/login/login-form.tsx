"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell, OrDivider } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { useSession } from "@/components/session-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { api } from "@/lib/api";
import { dashboardPath, safeNext, type SessionUser } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const done = (user: SessionUser) => {
    setUser(user);
    const next = safeNext(params.get("next"));
    router.replace(next?.startsWith(dashboardPath(user.role)) ? next : dashboardPath(user.role));
    router.refresh();
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ user: SessionUser }>("/auth/login", {
        method: "POST",
        json: { email: form.get("email"), password: form.get("password") },
      });
      done(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Welcome back" description="Sign in as a reporter, NGO, or admin.">
      <GoogleButton onSuccess={done} />
      <OrDivider />
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        <div className="-mt-2 text-right">
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>
      <div className="mt-6 space-y-1 text-center text-sm text-muted-foreground">
        <p>
          New here?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
        <p>
          Run a rescue NGO?{" "}
          <Link href="/ngo/apply" className="font-medium text-primary hover:underline">
            Apply to join
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
