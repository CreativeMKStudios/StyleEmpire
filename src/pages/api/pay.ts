import type { APIRoute } from "astro";
import { copy } from "../../data/copy.ts";
import { getBooking, markBookingPaid, paymentMode } from "../../lib/bookings.ts";
import { json, readBody, redirect, sameOrigin, siteOrigin, wantsJson } from "../../lib/http.ts";
import { createStripeSession } from "../../lib/pay.ts";
import { rateLimit } from "../../lib/rate.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress, site }) => {
  if (!sameOrigin(request)) return json({ error: "Bad origin" }, 403);
  if (!rateLimit(`pay:${clientAddress}`, 10, 60 * 60 * 1000)) {
    return json({ error: copy.errors.rate }, 429);
  }

  const body = await readBody(request);
  const id = body.id || "";
  const booking = getBooking(id);
  if (!booking) {
    return wantsJson(request) ? json({ error: copy.errors.missing }, 404) : redirect("/book?error=" + encodeURIComponent(copy.errors.missing));
  }

  const mode = paymentMode();
  if (mode === "demo") {
    const result = await markBookingPaid(id, "demo", null);
    if (!result.ok) {
      return wantsJson(request)
        ? json({ error: result.error }, result.status)
        : redirect(`/book/pay/${id}?error=${encodeURIComponent(result.error)}`);
    }
    const next = `/book/confirmed?ref=${id}`;
    return wantsJson(request) ? json({ ok: true, next }) : redirect(next);
  }

  if (mode === "stripe") {
    try {
      const url = await createStripeSession(booking, siteOrigin(request, site));
      return wantsJson(request) ? json({ ok: true, next: url }) : redirect(url);
    } catch (error) {
      console.error(error);
      return wantsJson(request)
        ? json({ error: copy.errors.stripe }, 502)
        : redirect(`/book/pay/${id}?error=${encodeURIComponent(copy.errors.stripe)}`);
    }
  }

  return wantsJson(request)
    ? json({ error: copy.book.stripeOff }, 400)
    : redirect(`/book/pay/${id}?error=${encodeURIComponent(copy.book.stripeOff)}`);
};
