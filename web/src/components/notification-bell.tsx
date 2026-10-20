"use client";

import { Bell, BellRing, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRealtime, useRealtimeStatus } from "@/components/realtime-provider";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/requests";
import { cn } from "@/lib/utils";

interface Note {
  _id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const URGENT = new Set(["request_emergency", "request_escalated"]);

export function NotificationBell() {
  const router = useRouter();
  const { user } = useSession();
  const { connected } = useRealtimeStatus();
  const [items, setItems] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api<{ items: Note[]; unread: number }>("/notifications")
      .then((d) => {
        setItems(d.items);
        setUnread(d.unread);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (user) load();
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, [user, load]);

  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useRealtime<Note>("notification:new", (n) => {
    setItems((cur) => [n, ...cur].slice(0, 30));
    setUnread((u) => u + 1);
    const go = () => n.link && router.push(n.link);
    (URGENT.has(n.type) ? toast.error : toast)(n.title, {
      description: n.body,
      action: n.link ? { label: "Open", onClick: go } : undefined,
      duration: URGENT.has(n.type) ? 15000 : 6000,
    });
    if (perm === "granted" && document.visibilityState !== "visible") {
      const desk = new Notification(n.title, { body: n.body, icon: "/favicon.ico", tag: n._id });
      desk.onclick = () => {
        window.focus();
        go();
      };
    }
  });

  if (!user) return null;

  async function openItem(n: Note) {
    setOpen(false);
    if (!n.read) {
      setItems((cur) => cur.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      void api(`/notifications/${n._id}/read`, { method: "PATCH" }).catch(() => undefined);
    }
    if (n.link) router.push(n.link);
  }

  async function readAll() {
    setItems((cur) => cur.map((x) => ({ ...x, read: true })));
    setUnread(0);
    await api("/notifications/read-all", { method: "PATCH" }).catch(() => undefined);
  }

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="icon" aria-label={`Notifications (${unread} unread)`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {unread ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="font-semibold">Notifications</p>
              <span
                title={connected ? "Live" : "Reconnecting…"}
                className={cn("h-2 w-2 rounded-full", connected ? "bg-emerald-500" : "bg-muted-foreground/40")}
              />
            </div>
            {unread > 0 && (
              <button onClick={readAll} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted-foreground">You&apos;re all caught up.</li>}
            {items.map((n) => (
              <li key={n._id}>
                <button
                  onClick={() => openItem(n)}
                  className={cn("flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted", !n.read && "bg-primary/5")}
                >
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : URGENT.has(n.type) ? "bg-destructive" : "bg-primary")} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{n.title}</span>
                    {n.body && <span className="line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>}
                    <span className="block text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {perm === "default" && (
            <div className="border-t px-4 py-3">
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => Notification.requestPermission().then(setPerm)}
              >
                Turn on desktop alerts for when this tab is in the background
              </button>
            </div>
          )}
          {user.role !== "admin" && (
            <div className="border-t px-4 py-2 text-right">
              <Link href={user.role === "ngo" ? "/dashboard/ngo/requests" : "/dashboard/user/reports"} className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
                {user.role === "ngo" ? "Open requests →" : "My reports →"}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
