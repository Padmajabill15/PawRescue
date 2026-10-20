"use client";

import { Loader2, Send } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { RequestDetailView, useRequest } from "@/app/dashboard/request-detail";
import { PhotoPicker } from "@/components/rescue/photo-picker";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api";
import { nextStatuses, STATUS_LABEL, type RequestStatus } from "@/lib/requests";

export default function NgoCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, error, reload } = useRequest(id);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setActionError(null);
    try {
      await fn();
      reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  const accepted = data && data.status !== "submitted";
  const next = data ? nextStatuses(data.status) : [];

  async function postUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const notes = String(new FormData(e.currentTarget).get("notes") ?? "").trim();
    if (notes.length < 2) return setActionError("Please write a short update");
    const body = new FormData();
    body.append("notes", notes);
    files.forEach((f) => body.append("images", f));
    await run("update", async () => {
      await api(`/requests/${id}/updates`, { method: "POST", body });
      setFiles([]);
      (e.target as HTMLFormElement).reset();
    });
  }

  const actions = data && (
    <div className="space-y-4">
      {actionError && <Alert>{actionError}</Alert>}
      {!accepted ? (
        <Card className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">This rescue is still open. Accept it to take responsibility and notify the reporter.</p>
          <Button onClick={() => run("accept", () => api(`/requests/${id}/accept`, { method: "PATCH" }))} disabled={busy !== null}>
            {busy === "accept" && <Loader2 className="h-4 w-4 animate-spin" />}
            Accept rescue
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {next.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Update status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Optional note for the reporter" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
                <div className="flex flex-wrap gap-2">
                  {next.map((s: RequestStatus, i) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={i === 0 ? "default" : "outline"}
                      disabled={busy !== null}
                      onClick={() =>
                        run(s, async () => {
                          await api(`/requests/${id}/status`, { method: "PATCH", json: { status: s, note: note || undefined } });
                          setNote("");
                        })
                      }
                    >
                      {busy === s && <Loader2 className="h-4 w-4 animate-spin" />}
                      {STATUS_LABEL[s]}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Post a treatment update</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={postUpdate} className="space-y-3">
                <Textarea name="notes" placeholder="E.g. Wound cleaned and dressed, started antibiotics. Eating well." maxLength={2000} />
                <PhotoPicker files={files} onChange={setFiles} />
                <Button type="submit" size="sm" disabled={busy !== null}>
                  {busy === "update" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Post update
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <RequestDetailView
      data={data}
      error={error}
      backHref={accepted ? "/dashboard/ngo/cases" : "/dashboard/ngo/requests"}
      backLabel={accepted ? "My cases" : "Incoming requests"}
      actions={actions}
      showReporter
    />
  );
}
