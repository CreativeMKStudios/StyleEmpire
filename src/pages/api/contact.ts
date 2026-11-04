import type { APIRoute } from "astro";
import { copy } from "../../data/copy.ts";
import { saveMessage } from "../../lib/bookings.ts";
import { json, readBody, redirect, sameOrigin, wantsJson } from "../../lib/http.ts";
import { rateLimit } from "../../lib/rate.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!sameOrigin(request)) return json({ error: "Bad origin" }, 403);
  if (!rateLimit(`contact:${clientAddress}`, 6, 60 * 60 * 1000)) {
    return wantsJson(request)
      ? json({ error: copy.errors.rate }, 429)
      : redirect(`/contact?error=${encodeURIComponent(copy.errors.rate)}`);
  }

  const body = await readBody(request);
  const result = await saveMessage({
    name: body.name || "",
    email: body.email || "",
    phone: body.phone || "",
    body: body.message || "",
    companyWebsite: body.company_website || "",
  });

  if (!result.ok) {
    if (result.error === copy.errors.honeypot) {
      return wantsJson(request) ? json({ ok: true }) : redirect("/contact?sent=1");
    }
    if (wantsJson(request)) return json({ error: result.error }, result.status);
    return redirect(`/contact?error=${encodeURIComponent(result.error)}`);
  }

  return wantsJson(request) ? json({ ok: true }) : redirect("/contact?sent=1");
};
