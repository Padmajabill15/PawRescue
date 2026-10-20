"use client";

import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { dashboardPath } from "@/lib/auth";

export function Avatar({ name, src, className = "h-9 w-9" }: { name: string; src?: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" referrerPolicy="no-referrer" className={`${className} rounded-full object-cover`} />
  ) : (
    <span className={`${className} flex items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary`}>
      {initials}
    </span>
  );
}

export function UserMenu() {
  const { user, logout } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Account menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar name={user.name} src={user.avatar} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-card p-1 shadow-lg">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs capitalize text-muted-foreground">{user.role}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Button asChild variant="ghost" className="w-full justify-start" onClick={() => setOpen(false)}>
            <Link href={dashboardPath(user.role)}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-destructive" onClick={logout}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      )}
    </div>
  );
}
