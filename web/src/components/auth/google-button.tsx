"use client";

import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { api } from "@/lib/api";
import type { SessionUser } from "@/lib/auth";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleButton({
  emergency = false,
  onSuccess,
}: {
  emergency?: boolean;
  onSuccess: (user: SessionUser) => void;
}) {
  const { resolvedTheme } = useTheme();
  const [error, setError] = useState<string | null>(null);

  if (!clientId) {
    return (
      <p className="rounded-md border border-dashed px-3 py-2 text-center text-xs text-muted-foreground">
        Google sign-in isn&apos;t configured yet (add NEXT_PUBLIC_GOOGLE_CLIENT_ID).
      </p>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex flex-col items-center gap-3">
        <GoogleLogin
          theme={resolvedTheme === "dark" ? "filled_black" : "outline"}
          size="large"
          shape="pill"
          text="continue_with"
          onSuccess={async ({ credential }) => {
            setError(null);
            try {
              const data = await api<{ user: SessionUser }>("/auth/google", {
                method: "POST",
                json: { credential, emergency },
              });
              onSuccess(data.user);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Google sign-in failed");
            }
          }}
          onError={() => setError("Google sign-in was cancelled or failed")}
        />
        {error && <Alert>{error}</Alert>}
      </div>
    </GoogleOAuthProvider>
  );
}
