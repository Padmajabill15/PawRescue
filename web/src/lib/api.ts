export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[] | undefined>,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    ...rest,
    headers: { ...(json !== undefined && { "Content-Type": "application/json" }), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    const firstFieldError = body.errors
      ? Object.values(body.errors as Record<string, string[]>).flat()[0]
      : undefined;
    throw new ApiError(res.status, firstFieldError ?? body.message ?? "Something went wrong", body.errors);
  }
  return body.data as T;
}
