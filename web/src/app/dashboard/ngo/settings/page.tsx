"use client";

import { Loader2, LocateFixed, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/stat-card";
import { PickerMap } from "@/components/map";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const SPECIALIZATIONS = ["dogs", "cats", "cattle", "birds", "wildlife", "reptiles", "other"] as const;

interface Ngo {
  name: string;
  email: string;
  phone: string;
  address?: string;
  description?: string;
  serviceRadiusKm: number;
  capacity: number;
  specializations: string[];
  location: { coordinates: [number, number] };
}

export default function NgoSettingsPage() {
  const [ngo, setNgo] = useState<Ngo | null>(null);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [specs, setSpecs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    api<Ngo>("/ngos/me")
      .then((n) => {
        setNgo(n);
        setSpecs(n.specializations);
        setPos({ lat: n.location.coordinates[1], lng: n.location.coordinates[0] });
      })
      .catch((e: Error) => setMsg({ kind: "error", text: e.message }));
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setMsg(null);
    try {
      const n = await api<Ngo>("/ngos/me", {
        method: "PATCH",
        json: {
          name: f.get("name"),
          phone: f.get("phone"),
          address: f.get("address"),
          description: f.get("description"),
          serviceRadiusKm: Number(f.get("serviceRadiusKm")),
          capacity: Number(f.get("capacity")),
          specializations: specs,
          ...(pos && { lat: pos.lat, lng: pos.lng }),
        },
      });
      setNgo(n);
      setMsg({ kind: "success", text: "NGO details saved. New reports are matched with these settings." });
    } catch (err) {
      setMsg({ kind: "error", text: err instanceof Error ? err.message : "Couldn't save" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="NGO details" subtitle="What reporters and our matching use: where you are, how far you travel, what you treat." />
      {msg && <div className="mb-4 max-w-3xl"><Alert kind={msg.kind}>{msg.text}</Alert></div>}
      {!ngo ? (
        !msg && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : (
        <Card className="max-w-3xl">
          <CardContent className="pt-6">
            <form onSubmit={save} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="NGO name" htmlFor="name"><Input id="name" name="name" defaultValue={ngo.name} required minLength={2} /></Field>
                <Field label="Phone" htmlFor="phone"><Input id="phone" name="phone" type="tel" defaultValue={ngo.phone} required minLength={7} /></Field>
                <Field label="Official email" htmlFor="email" hint="Contact the admin to change it."><Input id="email" value={ngo.email} disabled /></Field>
                <Field label="Address" htmlFor="address"><Input id="address" name="address" defaultValue={ngo.address ?? ""} /></Field>
                <Field label="Service radius (km)" htmlFor="serviceRadiusKm"><Input id="serviceRadiusKm" name="serviceRadiusKm" type="number" min={1} max={200} defaultValue={ngo.serviceRadiusKm} /></Field>
                <Field label="Animals you can house" htmlFor="capacity"><Input id="capacity" name="capacity" type="number" min={0} defaultValue={ngo.capacity} /></Field>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Base location</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.geolocation?.getCurrentPosition((p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }))}
                  >
                    <LocateFixed className="h-4 w-4" /> Use my location
                  </Button>
                </div>
                <div className="h-64 overflow-hidden rounded-lg border">
                  {pos && <PickerMap lat={pos.lat} lng={pos.lng} onChange={(lat, lng) => setPos({ lat, lng })} />}
                </div>
                <p className="text-xs text-muted-foreground">Drag the pin to your shelter. Reports within your radius of this point reach you.</p>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Specializations</span>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map((s) => {
                    const on = specs.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setSpecs((c) => (on ? c.filter((x) => x !== s) : [...c, s]))}
                        className={cn("rounded-full border px-3 py-1 text-sm capitalize", on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field label="About your NGO" htmlFor="description"><Textarea id="description" name="description" defaultValue={ngo.description ?? ""} maxLength={1000} /></Field>

              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save NGO details
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
