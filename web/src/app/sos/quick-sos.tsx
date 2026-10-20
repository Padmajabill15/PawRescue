"use client";

import { Loader2, Siren } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useSession } from "@/components/session-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { SessionUser } from "@/lib/auth";

export function QuickSos() {
  const { setUser } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ user: SessionUser }>("/auth/quick-sos", {
        method: "POST",
        json: { name: f.get("name"), phone: f.get("phone") },
      });
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the SOS");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <Field label="Your name" htmlFor="sos-name">
        <Input id="sos-name" name="name" autoComplete="name" required minLength={2} />
      </Field>
      <Field label="Phone number" htmlFor="sos-phone" hint="The NGO calls this number to find the animal.">
        <Input id="sos-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required />
      </Field>
      <Button type="submit" variant="destructive" size="lg" className="w-full text-base font-bold" disabled={busy}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Siren className="h-5 w-5" />}
        Continue to SOS report
      </Button>
    </form>
  );
}
