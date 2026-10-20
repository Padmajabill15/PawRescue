"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, ROLE_LABEL } from "@/components/dashboard/nav-config";
import type { Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV[role];

  return (
    <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      <p className="hidden px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:block">
        {ROLE_LABEL[role]} dashboard
      </p>
      {items.map(({ href, label, icon: Icon, soon }) => {
        const active = pathname === href;
        const cls = cn(
          "flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          soon && "pointer-events-none opacity-50",
        );
        return soon ? (
          <span key={href} className={cls} aria-disabled>
            <Icon className="h-4 w-4" />
            {label}
            <span className="ml-auto hidden rounded bg-muted px-1.5 text-[10px] uppercase md:inline">soon</span>
          </span>
        ) : (
          <Link key={href} href={href} className={cls} aria-current={active ? "page" : undefined}>
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
