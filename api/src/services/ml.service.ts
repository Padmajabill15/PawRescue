import { env } from "../config/env";

export interface MlAnalysis {
  species: { label: string; confidence: number; top: { label: string; confidence: number }[] };
  injury: { probability: number };
  severity: { level: "low" | "medium" | "high" | "critical"; score: number; reasons: string[] };
  embedding: number[];
  model: string;
  ms: number;
}

type ImageFile = { buffer: Buffer; mimetype: string; originalname?: string };

function form(files: ImageFile[], field: string) {
  const fd = new FormData();
  for (const f of files.slice(0, 3)) {
    fd.append(field, new Blob([new Uint8Array(f.buffer)], { type: f.mimetype }), f.originalname || "photo.jpg");
  }
  return fd;
}

async function call<T>(path: string, body: FormData): Promise<T | null> {
  try {
    const res = await fetch(`${env.ML_URL}${path}`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(env.ML_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null; // ML service is optional: callers fall back to rules
  }
}

/** Full analysis for a new report. Returns null when the ML service is unavailable. */
export function analyzeReport(files: ImageFile[], description: string | undefined, isEmergency: boolean) {
  const fd = form(files, "images");
  fd.append("description", description ?? "");
  fd.append("is_emergency", String(isEmergency));
  return call<MlAnalysis>("/analyze", fd);
}

/** Quick species suggestion for the report form. */
export function suggestSpecies(file: ImageFile) {
  return call<{ top: { label: string; confidence: number }[] }>("/species", form([file], "image"));
}

export async function mlHealth() {
  try {
    const res = await fetch(`${env.ML_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return (await res.json()) as { status: string; model?: string; device?: string; error?: string };
  } catch {
    return { status: "offline" };
  }
}

export function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
