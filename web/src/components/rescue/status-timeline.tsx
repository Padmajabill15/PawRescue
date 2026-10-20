import { Check } from "lucide-react";
import { STATUS_FLOW, STATUS_LABEL, type RescueRequest } from "@/lib/requests";
import { cn } from "@/lib/utils";

export function StatusStepper({ status }: { status: RescueRequest["status"] }) {
  const steps = STATUS_FLOW.filter((s) => s !== "closed");
  const current = Math.min(STATUS_FLOW.indexOf(status), steps.length - 1);
  return (
    <ol className="flex items-start overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const done = i < current || status === "closed" || (i === current && status === "recovered");
        const active = i === current && !done;
        return (
          <li key={s} className="flex min-w-[84px] flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={cn("h-0.5 flex-1", i === 0 ? "bg-transparent" : i <= current ? "bg-primary" : "bg-border")} />
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-background text-primary ring-4 ring-primary/20",
                  !done && !active && "border-border bg-background text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn("h-0.5 flex-1", i === steps.length - 1 ? "bg-transparent" : i < current ? "bg-primary" : "bg-border")} />
            </div>
            <span className={cn("mt-2 text-xs", active || done ? "font-medium" : "text-muted-foreground")}>
              {STATUS_LABEL[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function HistoryList({ history }: { history: RescueRequest["statusHistory"] }) {
  return (
    <ol className="relative space-y-4 border-l pl-5">
      {[...history].reverse().map((h, i) => (
        <li key={`${h.status}-${h.at}`} className="relative">
          <span
            className={cn(
              "absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-background",
              i === 0 ? "bg-primary" : "bg-muted-foreground/40",
            )}
          />
          <p className="text-sm font-medium">{STATUS_LABEL[h.status]}</p>
          {h.note && <p className="text-sm text-muted-foreground">{h.note}</p>}
          <p className="text-xs text-muted-foreground">{new Date(h.at).toLocaleString()}</p>
        </li>
      ))}
    </ol>
  );
}
