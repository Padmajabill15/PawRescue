"use client";

import { Loader2, LocateFixed, Send, Siren } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PickerMap } from "@/components/map";
import { PhotoPicker } from "@/components/rescue/photo-picker";
import { useGeolocation } from "@/components/rescue/use-geolocation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { api } from "@/lib/api";
import { SPECIES, SPECIES_EMOJI, type RescueRequest, type Species } from "@/lib/requests";
import { cn } from "@/lib/utils";

const FALLBACK = { lat: 15.8497, lng: 74.4977 }; // Belagavi

export function ReportForm({ emergency = false }: { emergency?: boolean }) {
  const router = useRouter();
  const geo = useGeolocation(true);
  const [files, setFiles] = useState<File[]>([]);
  const [species, setSpecies] = useState<Species>("dog");
  const [isEmergency, setIsEmergency] = useState(emergency);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pos = geo.coords ?? FALLBACK;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!files.length) return setError("Please add at least one photo of the animal");
    if (!geo.coords) return setError("Please set the animal's location: allow location access or tap the map");
    const f = new FormData(e.currentTarget);
    const body = new FormData();
    files.forEach((file) => body.append("images", file));
    body.append("species", species);
    body.append("lat", String(geo.coords.lat));
    body.append("lng", String(geo.coords.lng));
    body.append("isEmergency", String(isEmergency));
    for (const k of ["description", "address", "contactPhone", "animalCount"]) {
      const v = String(f.get(k) ?? "").trim();
      if (v) body.append(k, v);
    }
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ request: RescueRequest; nearestNgos: { name: string; distanceKm: number }[] }>(
        "/requests",
        { method: "POST", body },
      );
      router.push(`/dashboard/user/reports/${data.request._id}?new=${data.nearestNgos.length}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit the report");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && <Alert>{error}</Alert>}

      <section className="space-y-2">
        <span className="text-sm font-medium">Photos of the animal</span>
        <PhotoPicker files={files} onChange={setFiles} required />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Where is the animal?</span>
          <Button type="button" variant="outline" size="sm" onClick={geo.locate} disabled={geo.loading}>
            {geo.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            My location
          </Button>
        </div>
        <div className="h-64 overflow-hidden rounded-lg border sm:h-80">
          <PickerMap lat={pos.lat} lng={pos.lng} onChange={(lat, lng) => geo.setCoords({ lat, lng })} />
        </div>
        <p className="text-xs text-muted-foreground">
          {geo.error ?? (geo.coords ? "Drag the pin or tap the map to fine-tune the exact spot." : "Finding your location…")}
        </p>
      </section>

      <section className="space-y-2">
        <span className="text-sm font-medium">Animal</span>
        <div className="flex flex-wrap gap-2">
          {SPECIES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={species === s}
              onClick={() => setSpecies(s)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm capitalize transition-colors",
                species === s ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {SPECIES_EMOJI[s]} {s}
            </button>
          ))}
        </div>
      </section>

      <Field label="What happened?" htmlFor="description" hint="E.g. hit by a bike, bleeding from the leg, can't stand.">
        <Textarea id="description" name="description" maxLength={1000} required={!emergency} />
      </Field>

      {!emergency && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field label="Landmark / address (optional)" htmlFor="address">
              <Input id="address" name="address" maxLength={300} />
            </Field>
          </div>
          <Field label="How many animals?" htmlFor="animalCount">
            <Input id="animalCount" name="animalCount" type="number" min={1} max={50} defaultValue={1} />
          </Field>
        </div>
      )}

      <Field label="Your phone (so the NGO can reach you)" htmlFor="contactPhone">
        <Input id="contactPhone" name="contactPhone" type="tel" maxLength={20} required={emergency} />
      </Field>

      {!emergency && (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
          <input
            type="checkbox"
            checked={isEmergency}
            onChange={(e) => setIsEmergency(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[hsl(var(--destructive))]"
          />
          <span className="text-sm">
            <span className="font-medium">This is an emergency</span>
            <span className="block text-muted-foreground">Life-threatening injury. NGOs see it at the top of their list.</span>
          </span>
        </label>
      )}

      <Button type="submit" size="lg" variant={isEmergency ? "destructive" : "default"} className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : isEmergency ? <Siren className="h-5 w-5" /> : <Send className="h-5 w-5" />}
        {isEmergency ? "Send emergency alert" : "Submit report"}
      </Button>
    </form>
  );
}
