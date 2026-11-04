import { getService } from "../data/services.ts";
import type { Booking } from "./bookings.ts";

export async function createStripeSession(booking: Booking, origin: string): Promise<string> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  const service = getService(booking.serviceId);
  if (!service || service.pricePence == null) throw new Error("No price");

  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", `${origin}/book/pay/${booking.id}?session_id={CHECKOUT_SESSION_ID}`);
  body.set("cancel_url", `${origin}/book/pay/${booking.id}?cancelled=1`);
  body.set("customer_email", booking.customerEmail);
  body.set("client_reference_id", booking.id);
  body.set("metadata[booking_id]", booking.id);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "gbp");
  body.set("line_items[0][price_data][unit_amount]", String(service.pricePence));
  body.set("line_items[0][price_data][product_data][name]", `${service.name} at Style Empire`);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body,
  });
  const payload = (await response.json()) as { url?: string; error?: { message?: string } };
  if (!response.ok || !payload.url) {
    throw new Error(payload.error?.message || "Stripe did not start");
  }
  return payload.url;
}

export async function stripeSessionPaid(sessionId: string, bookingId: string): Promise<boolean> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return false;
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!response.ok) return false;
  const payload = (await response.json()) as {
    payment_status?: string;
    metadata?: { booking_id?: string };
    client_reference_id?: string;
  };
  const matches = payload.metadata?.booking_id === bookingId || payload.client_reference_id === bookingId;
  return matches && payload.payment_status === "paid";
}
