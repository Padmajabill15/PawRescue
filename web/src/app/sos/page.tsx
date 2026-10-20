"use client";

import { Loader2, Siren } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrDivider } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { QuickSos } from "./quick-sos";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportForm } from "@/components/rescue/report-form";
import { dashboardPath } from "@/lib/auth";

export default function SosPage() {
  const router = useRouter();
  const { user, loading, setUser } = useSession();

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-destructive/10 via-transparent to-transparent" />
      <div className="container flex justify-center py-10 sm:py-16">
        <Card className={user?.role === "user" ? "w-full max-w-2xl" : "w-full max-w-md"}>
          <CardHeader className="items-center text-center">
            <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <Siren className="h-7 w-7" />
            </span>
            <CardTitle className="text-2xl">Emergency rescue</CardTitle>
            <CardDescription>
              No account needed. Tell us who you are, add a photo, and the nearest verified NGOs are alerted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : user?.role === "user" ? (
              <ReportForm emergency />
            ) : user ? (
              <div className="space-y-4 text-center">
                <p className="text-sm">
                  You&apos;re signed in as an {user.role === "ngo" ? "NGO" : "admin"}. Emergency reports are filed by reporters.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href={dashboardPath(user.role)}>Go to my dashboard</Link>
                </Button>
              </div>
            ) : (
              <>
                <QuickSos />
                <OrDivider />
                <GoogleButton
                  emergency
                  hideWhenUnconfigured
                  onSuccess={(u) => {
                    setUser(u);
                    router.refresh();
                  }}
                />
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login?next=/sos" className="font-medium text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}
            <p className="text-center text-xs text-muted-foreground">
              If the animal is in immediate danger on a road, keep a safe distance and alert traffic first.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
