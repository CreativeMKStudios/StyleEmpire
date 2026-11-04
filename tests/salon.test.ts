import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { copy } from "../src/data/copy.ts";
import { placeBooking, markBookingPaid, getBooking } from "../src/lib/bookings.ts";
import { resetDatabaseForTests } from "../src/lib/db.ts";
import type { Mailer, OutboundMail } from "../src/lib/mail.ts";
import { slotsForDay } from "../src/lib/slots.ts";
import { londonParts, londonWallToUtc } from "../src/lib/time.ts";

const dir = mkdtempSync(path.join(tmpdir(), "style-empire-"));
process.env.BOOKINGS_DB = path.join(dir, "bookings.sqlite");
process.env.PAYMENT_MODE = "demo";
process.env.MANAGER_EMAIL = "manager@example.com";

after(() => {
  resetDatabaseForTests();
  rmSync(dir, { recursive: true, force: true });
});

function mailer(box: OutboundMail[]): Mailer {
  return async (message) => {
    box.push(message);
  };
}

test("London winter and summer offsets", () => {
  const winter = londonWallToUtc("2026-01-15", 9, 30);
  assert.equal(winter.toISOString(), "2026-01-15T09:30:00.000Z");
  const summer = londonWallToUtc("2026-06-15", 9, 30);
  assert.equal(summer.toISOString(), "2026-06-15T08:30:00.000Z");
  assert.equal(londonParts(summer).ymd, "2026-06-15");
  assert.equal(londonParts(summer).hour, "09");
});

test("a closed day is rejected before a slot is taken", async () => {
  const now = new Date("2026-11-04T08:00:00.000Z");
  const closed = await placeBooking(
    {
      serviceId: "mens-cut",
      date: "2026-11-08",
      time: "10:00",
      name: "Pat Smith",
      email: "pat@example.com",
      phone: "07123456789",
      notes: "",
      payment: "in_store",
    },
    now,
    mailer([]),
  );
  assert.equal(closed.ok, false);
  if (closed.ok) return;
  assert.equal(closed.status, 400);
  assert.match(closed.error, /closed/i);
});

test("Sunday is closed and Tuesday ends before 2pm", () => {
  const now = new Date("2026-11-01T00:00:00.000Z");
  assert.deepEqual(slotsForDay({ ymd: "2026-11-01", durationMin: 30, now, busy: [] }), []);
  const tuesday = slotsForDay({ ymd: "2026-11-03", durationMin: 45, now, busy: [] });
  assert.equal(tuesday[0], "09:30");
  assert.equal(tuesday.at(-1), "13:00");
  assert.equal(tuesday.includes("13:30"), false);
});

test("a booked slot cannot be taken twice, and both emails go out", async () => {
  const sent: OutboundMail[] = [];
  const now = new Date("2026-11-04T07:00:00.000Z");
  const first = await placeBooking(
    {
      serviceId: "barber-cut",
      date: "2026-11-04",
      time: "11:00",
      name: "Pat Smith",
      email: "pat@example.com",
      phone: "01536 601414",
      notes: "Short sides",
      payment: "in_store",
    },
    now,
    mailer(sent),
  );
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(sent.length, 2);
  assert.equal(sent[0]?.to, "pat@example.com");
  assert.equal(sent[1]?.to, "manager@example.com");
  assert.match(sent[0].text, /Barber cut/);
  assert.match(sent[1].text, /Pat Smith/);

  const second = await placeBooking(
    {
      serviceId: "barber-cut",
      date: "2026-11-04",
      time: "11:00",
      name: "Jo Brown",
      email: "jo@example.com",
      phone: "07123456789",
      notes: "",
      payment: "in_store",
    },
    now,
    mailer([]),
  );
  assert.equal(second.ok, false);
  if (second.ok) return;
  assert.equal(second.status, 409);
});

test("online test payment emails once", async () => {
  const sent: OutboundMail[] = [];
  const now = new Date("2026-11-05T07:00:00.000Z");
  const placed = await placeBooking(
    {
      serviceId: "nails",
      date: "2026-11-05",
      time: "10:00",
      name: "Sam Lee",
      email: "sam@example.com",
      phone: "07111 222333",
      notes: "",
      payment: "online",
    },
    now,
    mailer(sent),
  );
  assert.equal(placed.ok, true);
  if (!placed.ok) return;
  assert.equal(sent.length, 0);
  assert.equal(placed.booking.status, "pending_payment");
  const paid = await markBookingPaid(placed.booking.id, "demo", null, mailer(sent));
  assert.equal(paid.ok, true);
  assert.equal(sent.length, 2);
  assert.match(sent[0]?.text ?? "", /no card was charged/i);
  const again = await markBookingPaid(placed.booking.id, "demo", null, mailer(sent));
  assert.equal(again.ok, true);
  assert.equal(sent.length, 2);
  const stored = getBooking(placed.booking.id);
  assert.equal(stored?.paymentStatus, "demo_paid");
});

function syllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return 0;
  if (cleaned.length <= 3) return 1;
  const stripped = cleaned.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = stripped.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

function grade(text: string): number {
  const sentences = text.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean);
  const words = text.split(/\s+/).filter((word) => /[A-Za-z]/.test(word));
  const syllableCount = words.reduce((total, word) => total + syllables(word), 0);
  return 0.39 * (words.length / sentences.length) + 11.8 * (syllableCount / words.length) - 15.59;
}

function collect(value: unknown, bucket: string[]): void {
  if (typeof value === "string") bucket.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collect(item, bucket));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collect(item, bucket));
}

test("our own sentences stay around a grade 8 reading level", () => {
  const parts: string[] = [];
  collect(copy, parts);
  const text = parts.join(" ");
  const score = grade(text);
  console.log("Flesch-Kincaid grade", score.toFixed(2), "words", text.split(/\s+/).length);
  assert.ok(score <= 8.5, `reading grade ${score.toFixed(2)} is above 8.5`);
});

before(() => {
  resetDatabaseForTests();
});
