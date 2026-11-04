import { randomBytes } from "node:crypto";
import { copy } from "../data/copy.ts";
import { salon } from "../data/salon.ts";
import { getService } from "../data/services.ts";
import { getDb } from "./db.ts";
import { bookingMessages, contactMessages, deliver, type Mailer } from "./mail.ts";
import { isOfferedSlot, slotRange, type BusyRange } from "./slots.ts";
import { addDays, londonParts, openingWindow } from "./time.ts";
import { bookingFieldError, clean, validEmail, validName, validPhone } from "./validate.ts";

export type PaymentChoice = "in_store" | "online";
export type PaymentStatus = "pay_in_store" | "pending" | "paid" | "demo_paid";
export type BookingStatus = "confirmed" | "pending_payment";

export type Booking = {
  id: string;
  serviceId: string;
  serviceName: string;
  startMs: number;
  endMs: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  paymentChoice: PaymentChoice;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  amountPence: number | null;
  stripeSessionId: string | null;
  emailedAt: string | null;
  createdAt: string;
};

type BookingRow = {
  id: string;
  service_id: string;
  service_name: string;
  start_ms: number;
  end_ms: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string;
  payment_choice: PaymentChoice;
  payment_status: PaymentStatus;
  status: BookingStatus;
  amount_pence: number | null;
  stripe_session_id: string | null;
  emailed_at: string | null;
  created_at: string;
};

function mapRow(row: BookingRow): Booking {
  return {
    id: row.id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    startMs: Number(row.start_ms),
    endMs: Number(row.end_ms),
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    notes: row.notes,
    paymentChoice: row.payment_choice,
    paymentStatus: row.payment_status,
    status: row.status,
    amountPence: row.amount_pence == null ? null : Number(row.amount_pence),
    stripeSessionId: row.stripe_session_id,
    emailedAt: row.emailed_at,
    createdAt: row.created_at,
  };
}

export function paymentMode(): "demo" | "stripe" | "off" {
  if (process.env.PAYMENT_MODE === "demo") return "demo";
  if (process.env.PAYMENT_MODE === "stripe" && process.env.STRIPE_SECRET_KEY) return "stripe";
  return "off";
}

export function activeBusy(now = new Date(), exceptId?: string): BusyRange[] {
  const cutoff = new Date(now.getTime() - salon.holdMinutes * 60_000).toISOString();
  const rows = getDb()
    .prepare(
      `SELECT id, start_ms, end_ms FROM bookings
       WHERE status = 'confirmed'
          OR (status = 'pending_payment' AND created_at > ?)`,
    )
    .all(cutoff) as { id: string; start_ms: number; end_ms: number }[];
  return rows
    .filter((row) => row.id !== exceptId)
    .map((row) => ({ startMs: Number(row.start_ms), endMs: Number(row.end_ms) }));
}

export function getBooking(id: string): Booking | null {
  const row = getDb().prepare("SELECT * FROM bookings WHERE id = ?").get(id) as BookingRow | undefined;
  return row ? mapRow(row) : null;
}

export type PlaceInput = {
  serviceId: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  payment: string;
  companyWebsite?: string;
};

export type PlaceResult = { ok: true; booking: Booking } | { ok: false; error: string; status: number };

function newId(): string {
  return randomBytes(9).toString("base64url");
}

export async function placeBooking(input: PlaceInput, now = new Date(), mailer?: Mailer): Promise<PlaceResult> {
  if (input.companyWebsite && input.companyWebsite.trim()) {
    return { ok: false, error: copy.errors.honeypot, status: 200 };
  }

  const name = clean(input.name, 80);
  const email = clean(input.email, 120).toLowerCase();
  const phone = clean(input.phone, 20);
  const notes = clean(input.notes, 500);
  const fieldError = bookingFieldError({ name, email, phone, notes, payment: input.payment });
  if (fieldError) return { ok: false, error: fieldError, status: 400 };

  const service = getService(input.serviceId);
  if (!service || !service.bookable || service.minutes == null) {
    return { ok: false, error: copy.errors.service, status: 400 };
  }

  const today = londonParts(now).ymd;
  const last = addDays(today, salon.horizonDays);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false, error: copy.errors.closed, status: 400 };
  if (input.date < today) return { ok: false, error: copy.errors.past, status: 400 };
  if (input.date > last) return { ok: false, error: copy.errors.horizon, status: 400 };
  if (!openingWindow(input.date)) return { ok: false, error: copy.errors.closed, status: 400 };

  const mode = paymentMode();
  if (input.payment === "online" && mode === "off") {
    return { ok: false, error: copy.book.stripeOff, status: 400 };
  }
  if (input.payment === "online" && mode === "stripe" && service.pricePence == null) {
    return { ok: false, error: copy.book.stripeOff, status: 400 };
  }

  const busy = activeBusy(now);
  if (!isOfferedSlot({ ymd: input.date, label: input.time, durationMin: service.minutes, now, busy })) {
    const range = slotRange(input.date, input.time, service.minutes);
    if (!range) return { ok: false, error: copy.errors.slot, status: 409 };
    if (range.startMs < now.getTime() + salon.leadMinutes * 60_000) {
      return { ok: false, error: copy.errors.lead, status: 400 };
    }
    return { ok: false, error: copy.errors.slot, status: 409 };
  }

  const range = slotRange(input.date, input.time, service.minutes);
  if (!range) return { ok: false, error: copy.errors.slot, status: 409 };

  const online = input.payment === "online";
  const booking: Booking = {
    id: newId(),
    serviceId: service.id,
    serviceName: service.name,
    startMs: range.startMs,
    endMs: range.endMs,
    customerName: name,
    customerEmail: email,
    customerPhone: phone,
    notes,
    paymentChoice: online ? "online" : "in_store",
    paymentStatus: online ? "pending" : "pay_in_store",
    status: online ? "pending_payment" : "confirmed",
    amountPence: service.pricePence,
    stripeSessionId: null,
    emailedAt: null,
    createdAt: now.toISOString(),
  };

  const db = getDb();
  db.exec("BEGIN");
  try {
    db.prepare(
      `INSERT INTO bookings (
        id, service_id, service_name, start_ms, end_ms, customer_name, customer_email,
        customer_phone, notes, payment_choice, payment_status, status, amount_pence,
        stripe_session_id, emailed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      booking.id,
      booking.serviceId,
      booking.serviceName,
      booking.startMs,
      booking.endMs,
      booking.customerName,
      booking.customerEmail,
      booking.customerPhone,
      booking.notes,
      booking.paymentChoice,
      booking.paymentStatus,
      booking.status,
      booking.amountPence,
      booking.stripeSessionId,
      booking.emailedAt,
      booking.createdAt,
    );

    if (!online) {
      await deliver(bookingMessages(booking), mailer);
      const emailedAt = new Date().toISOString();
      db.prepare("UPDATE bookings SET emailed_at = ? WHERE id = ?").run(emailedAt, booking.id);
      booking.emailedAt = emailedAt;
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    console.error(error);
    return { ok: false, error: copy.errors.mail, status: 503 };
  }

  return { ok: true, booking };
}

export async function markBookingPaid(
  id: string,
  how: "demo" | "stripe",
  stripeSessionId: string | null,
  mailer?: Mailer,
): Promise<PlaceResult> {
  const booking = getBooking(id);
  if (!booking) return { ok: false, error: copy.errors.missing, status: 404 };
  if (booking.emailedAt && booking.status === "confirmed") return { ok: true, booking };
  if (booking.paymentChoice !== "online") return { ok: false, error: copy.errors.payment, status: 400 };

  if (booking.status !== "pending_payment" && booking.status !== "confirmed") {
    return { ok: false, error: copy.errors.conflict, status: 409 };
  }
  const clash = activeBusy(new Date(), id).some(
    (range) => booking.startMs < range.endMs && booking.endMs > range.startMs,
  );
  if (clash && booking.status !== "confirmed") return { ok: false, error: copy.errors.conflict, status: 409 };

  const paymentStatus: PaymentStatus = how === "demo" ? "demo_paid" : "paid";
  const db = getDb();
  db.exec("BEGIN");
  try {
    db.prepare(
      `UPDATE bookings
       SET status = 'confirmed', payment_status = ?, stripe_session_id = COALESCE(?, stripe_session_id)
       WHERE id = ?`,
    ).run(paymentStatus, stripeSessionId, id);
    const next = getBooking(id);
    if (!next) throw new Error("missing after update");
    await deliver(bookingMessages(next), mailer);
    const emailedAt = new Date().toISOString();
    db.prepare("UPDATE bookings SET emailed_at = ? WHERE id = ?").run(emailedAt, id);
    db.exec("COMMIT");
    return { ok: true, booking: { ...next, emailedAt } };
  } catch (error) {
    db.exec("ROLLBACK");
    console.error(error);
    return { ok: false, error: copy.errors.mail, status: 503 };
  }
}

export async function saveMessage(
  input: { name: string; email: string; phone: string; body: string; companyWebsite?: string },
  mailer?: Mailer,
): Promise<PlaceResult | { ok: true; id: string }> {
  if (input.companyWebsite && input.companyWebsite.trim()) {
    return { ok: false, error: copy.errors.honeypot, status: 200 };
  }
  const name = clean(input.name, 80);
  const email = clean(input.email, 120).toLowerCase();
  const phone = clean(input.phone || "", 20);
  const body = input.body.replace(/\s+/g, " ").trim();
  if (!validName(name)) return { ok: false, error: copy.errors.name, status: 400 };
  if (!validEmail(email)) return { ok: false, error: copy.errors.email, status: 400 };
  if (phone && !validPhone(phone)) return { ok: false, error: copy.errors.phone, status: 400 };
  if (body.length < 5 || body.length > 1000) return { ok: false, error: copy.errors.message, status: 400 };

  const id = newId();
  const createdAt = new Date().toISOString();
  const db = getDb();
  db.exec("BEGIN");
  try {
    db.prepare("INSERT INTO messages (id, name, email, phone, body, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
      id,
      name,
      email,
      phone,
      body,
      createdAt,
    );
    await deliver(contactMessages({ name, email, phone, body }), mailer);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    console.error(error);
    return { ok: false, error: copy.errors.mail, status: 503 };
  }
  return { ok: true, id };
}
