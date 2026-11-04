export async function readBody(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    const data = (await request.json()) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) out[key] = value == null ? "" : String(value);
    return out;
  }
  const form = await request.formData();
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) out[key] = typeof value === "string" ? value : "";
  return out;
}

export function wantsJson(request: Request): boolean {
  const type = request.headers.get("content-type") || "";
  const accept = request.headers.get("accept") || "";
  return type.includes("application/json") || accept.includes("application/json");
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function redirect(location: string, status = 303): Response {
  return new Response(null, { status, headers: { location, "cache-control": "no-store" } });
}

export function siteOrigin(request: Request, configured?: URL): string {
  if (configured) return configured.origin;
  const host = request.headers.get("host") || "localhost:4321";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}
