import type { APIRoute } from "astro";
import { copy } from "../../data/copy.ts";
import { paymentMode, placeBooking } from "../../lib/bookings.ts";
import { json, readBody, redirect, sameOrigin, wantsJson } from "../../lib/http.ts";
import { rateLimit } from "../../lib/rate.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!sameOrigin(request)) return json({ error: "Bad origin" }, 403);
  if (!rateLimit(`book:${clientAddress}`, 8, 60 * 60 * 1000)) {
    return wantsJson(request)
      ? json({ error: copy.errors.rate }, 429)
      : redirect(`/book?error=${encodeURIComponent(copy.errors.rate)}`);
  }

  const body = await readBody(request);
  const result = await placeBooking({
    serviceId: body.service || "",
    date: body.date || "",
    time: body.time || "",
    name: body.name || "",
    email: body.email || "",
    phone: body.phone || "",
    notes: body.notes || "",
    payment: body.payment || "",
    companyWebsite: body.company_website || "",
  });

  if (!result.ok) {
    if (result.error === copy.errors.honeypot) {
      return wantsJson(request) ? json({ ok: true }) : redirect("/book/confirmed?ref=received");
    }
    if (wantsJson(request)) return json({ error: result.error }, result.status);
    const back = new URL("/book", "http://local");
    if (body.service) back.searchParams.set("service", body.service);
    if (body.date) back.searchParams.set("date", body.date);
    back.searchParams.set("error", result.error);
    return redirect(`${back.pathname}${back.search}`);
  }

  const next =
    result.booking.paymentChoice === "online" && paymentMode() !== "off"
      ? `/book/pay/${result.booking.id}`
      : `/book/confirmed?ref=${result.booking.id}`;

  if (wantsJson(request)) {
    return json({ ok: true, id: result.booking.id, paymentChoice: result.booking.paymentChoice, next });
  }
  return redirect(next);
};
