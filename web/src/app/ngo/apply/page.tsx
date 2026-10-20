"use client";

import { Loader2, LocateFixed } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const SPECIALIZATIONS = ["dogs", "cats", "cattle", "birds", "wildlife", "reptiles", "other"] as const;

export default function NgoApplyPage() {
  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [specs, setSpecs] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function locate() {
    if (!navigator.geolocation) return setError("Your browser doesn't support location access");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) });
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location. Allow location access or type it in.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("password") !== f.get("confirm")) return setError("Passwords don't match");
    if (!coords.lat || !coords.lng) return setError("Please add your NGO's location");
    setBusy(true);
    setError(null);
    try {
      await api("/ngos/apply", {
        method: "POST",
        json: {
          name: f.get("name"),
          email: f.get("email"),
          phone: f.get("phone"),
          password: f.get("password"),
          registrationNumber: f.get("registrationNumber") || undefined,
          address: f.get("address") || undefined,
          description: f.get("description") || undefined,
          lat: Number(coords.lat),
          lng: Number(coords.lng),
          serviceRadiusKm: Number(f.get("serviceRadiusKm") || 10),
          capacity: Number(f.get("capacity") || 0),
          specializations: specs,
        },
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit the application");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <AuthShell title="Application submitted" description="Thank you for joining the rescue network.">
        <div className="space-y-4 text-center">
          <Alert kind="success">
            Our admin team will verify your details. You can sign in as soon as your NGO is approved.
          </Alert>
          <Button asChild className="w-full">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      wide
      title="Apply as a rescue NGO"
      description="Verified NGOs receive nearby rescue requests. Every application is reviewed by an admin."
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {error && <Alert>{error}</Alert>}

        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="NGO name" htmlFor="name">
            <Input id="name" name="name" required minLength={2} />
          </Field>
          <Field label="Registration number (optional)" htmlFor="registrationNumber">
            <Input id="registrationNumber" name="registrationNumber" />
          </Field>
          <Field label="Official email" htmlFor="email">
            <Input id="email" name="email" type="email" required />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" type="tel" required minLength={7} />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          </Field>
          <Field label="Confirm password" htmlFor="confirm">
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
          </Field>
        </section>

        <section className="space-y-4">
          <Field label="Address" htmlFor="address">
            <Input id="address" name="address" />
          </Field>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Location</span>
              <Button type="button" variant="outline" size="sm" onClick={locate} disabled={locating}>
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                Use my location
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                aria-label="Latitude"
                placeholder="Latitude e.g. 15.8497"
                inputMode="decimal"
                value={coords.lat}
                onChange={(e) => setCoords((c) => ({ ...c, lat: e.target.value }))}
                required
              />
              <Input
                aria-label="Longitude"
                placeholder="Longitude e.g. 74.4977"
                inputMode="decimal"
                value={coords.lng}
                onChange={(e) => setCoords((c) => ({ ...c, lng: e.target.value }))}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">A map picker arrives in a later phase.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Service radius (km)" htmlFor="serviceRadiusKm">
              <Input id="serviceRadiusKm" name="serviceRadiusKm" type="number" min={1} max={200} defaultValue={10} />
            </Field>
            <Field label="Animals you can house" htmlFor="capacity">
              <Input id="capacity" name="capacity" type="number" min={0} defaultValue={10} />
            </Field>
          </div>
        </section>

        <section className="space-y-2">
          <span className="text-sm font-medium">Specializations</span>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map((s) => {
              const on = specs.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSpecs((cur) => (on ? cur.filter((x) => x !== s) : [...cur, s]))}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm capitalize transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </section>

        <Field label="About your NGO" htmlFor="description">
          <Textarea id="description" name="description" maxLength={1000} />
        </Field>

        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit application
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already approved?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
