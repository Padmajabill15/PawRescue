import { MapPin, Siren } from "lucide-react";
import Link from "next/link";
import { SafeImg } from "@/components/rescue/safe-img";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SEVERITY_BADGE, SPECIES_EMOJI, STATUS_LABEL, timeAgo, type RescueRequest } from "@/lib/requests";

export function RequestCard({ r, href, action }: { r: RescueRequest; href: string; action?: React.ReactNode }) {
  return (
    <Card className="flex gap-4 overflow-hidden p-3 transition-shadow hover:shadow-md">
      <Link href={href} className="shrink-0">
        {r.images[0] ? (
          <SafeImg
            src={r.images[0]}
            className="h-24 w-24 rounded-lg object-cover sm:h-28 sm:w-28"
            fallback={<span className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted text-3xl sm:h-28 sm:w-28">{SPECIES_EMOJI[r.species]}</span>}
          />
        ) : (
          <span className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted text-3xl">{SPECIES_EMOJI[r.species]}</span>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {r.isEmergency && (
            <Badge variant="danger" className="gap-1">
              <Siren className="h-3 w-3" /> SOS
            </Badge>
          )}
          <Badge variant={SEVERITY_BADGE[r.severity]} className="capitalize">
            {r.severity}
          </Badge>
          {r.duplicateOf ? <Badge variant="muted">Already reported · linked</Badge> : <Badge variant="muted">{STATUS_LABEL[r.status]}</Badge>}
        </div>
        <Link href={href} className="font-medium capitalize hover:text-primary">
          {SPECIES_EMOJI[r.species]} {r.species}
          {r.animalCount > 1 ? ` ×${r.animalCount}` : ""}
        </Link>
        {r.description && <p className="line-clamp-2 text-sm text-muted-foreground">{r.description}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {r.distanceKm !== undefined ? `${r.distanceKm} km away` : r.address || "Pinned on map"} · {timeAgo(r.createdAt)}
          </span>
          {action}
        </div>
      </div>
    </Card>
  );
}
