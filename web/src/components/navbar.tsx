"use client";

import { Menu, PawPrint, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/components/session-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { dashboardPath } from "@/lib/auth";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#impact", label: "Impact" },
  { href: "/ngo/apply", label: "For NGOs" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <PawPrint className="h-5 w-5" />
          </span>
          <span className="text-lg">PawRescue</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          {!loading && !user && (
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
          <Button asChild variant="destructive" size="sm" className="hidden md:inline-flex">
            <Link href="/sos">SOS</Link>
          </Button>
          {user && <NotificationBell />}
          {user && <UserMenu />}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t md:hidden">
          <nav className="container flex flex-col gap-1 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href={user ? dashboardPath(user.role) : "/login"} onClick={() => setOpen(false)}>
                  {user ? "Dashboard" : "Sign in"}
                </Link>
              </Button>
              <Button asChild variant="destructive" className="flex-1">
                <Link href="/sos" onClick={() => setOpen(false)}>
                  SOS
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
