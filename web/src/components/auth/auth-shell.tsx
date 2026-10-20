import { HeartPulse, MapPinned, PawPrint, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const POINTS = [
  { icon: MapPinned, text: "Nearest verified NGO is alerted with your exact pin" },
  { icon: ShieldCheck, text: "Every NGO is checked by our team before it can rescue" },
  { icon: HeartPulse, text: "Follow treatment updates until the animal recovers" },
];

export function AuthShell({
  title,
  description,
  children,
  wide = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="container py-8 sm:py-12">
      <div className="grid overflow-hidden rounded-2xl border bg-card lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <svg aria-hidden viewBox="0 0 400 400" className="pointer-events-none absolute -right-20 -top-10 h-[420px] w-[420px] opacity-20">
            <path d="M20 380 C 120 300, 80 200, 200 180 S 330 60, 390 20" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="10 12" />
            <circle cx="390" cy="20" r="10" fill="currentColor" />
          </svg>
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <PawPrint className="h-5 w-5 text-accent" /> PawRescue
          </Link>
          <div>
            <p className="font-display text-3xl font-bold leading-tight">Every report puts a rescue team on the road.</p>
            <ul className="mt-8 space-y-4">
              {POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3 text-sm text-primary-foreground/90">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {text}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-primary-foreground/70">If an animal is on a busy road, alert traffic first and keep a safe distance.</p>
        </aside>

        <div className={wide ? "p-6 sm:p-10" : "mx-auto w-full max-w-md p-6 sm:p-10"}>
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="mt-1.5 text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
