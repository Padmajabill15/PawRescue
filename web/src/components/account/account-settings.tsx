"use client";

import { KeyRound, Loader2, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { PageHeader } from "@/components/dashboard/stat-card";
import { useSession } from "@/components/session-provider";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Avatar } from "@/components/user-menu";
import { api } from "@/lib/api";
import type { SessionUser } from "@/lib/auth";

type Msg = { kind: "error" | "success"; text: string } | null;

function useAction() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMsg(null);
    try {
      setMsg({ kind: "success", text: await fn() });
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  };
  return { busy, msg, run };
}

const PROVIDER: Record<SessionUser["authProvider"], string> = {
  password: "Email and password",
  google: "Google",
  guest: "Quick SOS (no password yet)",
  otp: "Phone",
};

export function AccountSettings({ extra }: { extra?: ReactNode }) {
  const { user, setUser, logout } = useSession();
  const profile = useAction();
  const pw = useAction();
  const del = useAction();

  if (!user) return null;

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await profile.run(async () => {
      const d = await api<{ user: SessionUser }>("/auth/me", { method: "PATCH", json: { name: f.get("name"), phone: f.get("phone") } });
      setUser(d.user);
      return "Profile saved";
    });
  }

  async function savePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    if (f.get("newPassword") !== f.get("confirm")) return pw.run(async () => Promise.reject(new Error("New passwords don't match")));
    await pw.run(async () => {
      await api("/auth/change-password", { method: "POST", json: { currentPassword: f.get("currentPassword") || undefined, newPassword: f.get("newPassword") } });
      form.reset();
      setUser({ ...user!, hasPassword: true });
      return "Password updated";
    });
  }

  async function requestDelete(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const reason = String(new FormData(e.currentTarget).get("reason") ?? "").trim();
    await del.run(async () => {
      await api("/auth/delete-request", { method: "POST", json: { reason: reason || undefined } });
      setUser({ ...user!, deletionRequestedAt: new Date().toISOString() });
      return "Request sent. An admin will review it, and you can cancel until then.";
    });
  }

  async function cancelDelete() {
    await del.run(async () => {
      await api("/auth/delete-request", { method: "DELETE" });
      setUser({ ...user!, deletionRequestedAt: null });
      return "Deletion request cancelled";
    });
  }

  return (
    <>
      <PageHeader title="My account" subtitle="Your details, password and account options." />
      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardHeader className="flex-row items-center gap-4">
            <Avatar name={user.name} src={user.avatar} className="h-14 w-14 text-base" />
            <div className="min-w-0">
              <CardTitle className="truncate">{user.name}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2">
                <Badge variant="muted" className="capitalize">{user.role === "user" ? "Reporter" : user.role === "ngo" ? "NGO" : "Admin"}</Badge>
                Signed in with {PROVIDER[user.authProvider]}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
              {profile.msg && <div className="sm:col-span-2"><Alert kind={profile.msg.kind}>{profile.msg.text}</Alert></div>}
              <Field label="Name" htmlFor="name">
                <Input id="name" name="name" defaultValue={user.name} required minLength={2} />
              </Field>
              <Field label="Phone" htmlFor="phone">
                <Input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} />
              </Field>
              <Field label="Email" htmlFor="email" hint="Email can't be changed here.">
                <Input id="email" value={user.email ?? "Not set"} disabled />
              </Field>
              <div className="flex items-end">
                <Button type="submit" disabled={profile.busy}>
                  {profile.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />} Save profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {extra}

        <Card>
          <CardHeader>
            <CardTitle>{user.hasPassword ? "Change password" : "Set a password"}</CardTitle>
            <CardDescription>
              {user.hasPassword ? (
                <>Forgot your current one? <Link href="/forgot-password" className="text-primary hover:underline">Reset it with an email code</Link>.</>
              ) : (
                "Add a password so you can also sign in with your email."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={savePassword} className="grid gap-4 sm:grid-cols-3">
              {pw.msg && <div className="sm:col-span-3"><Alert kind={pw.msg.kind}>{pw.msg.text}</Alert></div>}
              {user.hasPassword && (
                <Field label="Current password" htmlFor="currentPassword">
                  <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
                </Field>
              )}
              <Field label="New password" htmlFor="newPassword">
                <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required minLength={8} />
              </Field>
              <Field label="Confirm new password" htmlFor="confirm">
                <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
              </Field>
              <div className="sm:col-span-3">
                <Button type="submit" variant="outline" disabled={pw.busy || (!user.hasPassword && !user.email)}>
                  {pw.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Update password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {user.role !== "admin" && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle>Delete account</CardTitle>
              <CardDescription>
                An admin reviews every request. Your personal details are removed; rescue records stay so the animals&apos; history isn&apos;t lost.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {del.msg && <Alert kind={del.msg.kind}>{del.msg.text}</Alert>}
              {user.deletionRequestedAt ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="warning">Requested {new Date(user.deletionRequestedAt).toLocaleDateString()}</Badge>
                  <Button variant="outline" size="sm" onClick={cancelDelete} disabled={del.busy}>Cancel request</Button>
                </div>
              ) : (
                <form onSubmit={requestDelete} className="space-y-3">
                  <Textarea name="reason" placeholder="Reason (optional)" maxLength={300} className="min-h-[70px]" />
                  <Button type="submit" variant="destructive" size="sm" disabled={del.busy}>
                    {del.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Request account deletion
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        <div>
          <Button variant="ghost" className="text-muted-foreground" onClick={logout}>Sign out</Button>
        </div>
      </div>
    </>
  );
}
