import nodemailer from "nodemailer";
import { copy } from "../data/copy.ts";
import { fullAddress, salon } from "../data/salon.ts";
import { formatAppointment } from "./time.ts";

export type BookingMail = {
  id: string;
  serviceName: string;
  startMs: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  paymentChoice: "in_store" | "online";
  paymentStatus: "pay_in_store" | "pending" | "paid" | "demo_paid";
  amountPence: number | null;
};

export type OutboundMail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type Mailer = (message: OutboundMail) => Promise<void>;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function paymentLine(booking: BookingMail): string {
  if (booking.paymentStatus === "paid" && booking.amountPence != null) {
    const pounds = (booking.amountPence / 100).toFixed(2);
    return `Pay: paid online by card, £${pounds}.`;
  }
  if (booking.paymentStatus === "demo_paid" || (booking.paymentChoice === "online" && booking.paymentStatus !== "pay_in_store")) {
    return "Pay: you chose online. Test mode is on, so no card was charged. Please pay the salon for the work.";
  }
  return "Pay: in the salon, on the day. There is no fixed price on the website.";
}

export function customerText(booking: BookingMail): string {
  const when = formatAppointment(booking.startMs);
  return [
    `Hello ${booking.customerName},`,
    "",
    "Your appointment at Style Empire is booked.",
    "",
    `Service: ${booking.serviceName}`,
    `When: ${when}`,
    `Where: ${salon.name}, ${fullAddress}`,
    paymentLine(booking),
    booking.notes ? `Note: ${booking.notes}` : "",
    "",
    `If you need to change it, call ${salon.phoneDisplay}.`,
    "",
    salon.name,
    salon.phoneDisplay,
    fullAddress,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function managerText(booking: BookingMail): string {
  const when = formatAppointment(booking.startMs);
  return [
    "A customer booked on the website.",
    "",
    `Name: ${booking.customerName}`,
    `Email: ${booking.customerEmail}`,
    `Phone: ${booking.customerPhone}`,
    `Service: ${booking.serviceName}`,
    `When: ${when}`,
    paymentLine(booking),
    `Note: ${booking.notes || "None"}`,
    `Booking id: ${booking.id}`,
  ].join("\n");
}

function htmlFromText(text: string): string {
  const body = escapeHtml(text).replaceAll("\n", "<br>");
  return `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#1a1a1a">${body}</div>`;
}

export function bookingMessages(booking: BookingMail): OutboundMail[] {
  const manager = process.env.MANAGER_EMAIL || "style.empire@outlook.com";
  const customerBody = customerText(booking);
  const managerBody = managerText(booking);
  return [
    {
      to: booking.customerEmail,
      subject: copy.emails.customerSubject,
      text: customerBody,
      html: htmlFromText(customerBody),
    },
    {
      to: manager,
      subject: `${copy.emails.managerSubject}: ${booking.customerName}`,
      text: managerBody,
      html: htmlFromText(managerBody),
    },
  ];
}

export function contactMessages(input: {
  name: string;
  email: string;
  phone: string;
  body: string;
}): OutboundMail[] {
  const manager = process.env.MANAGER_EMAIL || "style.empire@outlook.com";
  const salonText = [
    "A note came in from the website.",
    "",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone || "None"}`,
    "",
    input.body,
  ].join("\n");
  const copyText = [
    `Hello ${input.name},`,
    "",
    "We got your note and sent it to Style Empire.",
    "If you need a quicker reply, call " + salon.phoneDisplay + ".",
    "",
    "Your message:",
    input.body,
  ].join("\n");
  return [
    {
      to: manager,
      subject: copy.emails.contactSubject,
      text: salonText,
      html: htmlFromText(salonText),
    },
    {
      to: input.email,
      subject: copy.emails.contactCopySubject,
      text: copyText,
      html: htmlFromText(copyText),
    },
  ];
}

export function smtpMailer(): Mailer {
  const host = process.env.SMTP_HOST || "127.0.0.1";
  const port = Number(process.env.SMTP_PORT || 1025);
  const from = process.env.SMTP_FROM || "Style Empire <bookings@localhost>";
  const transport = nodemailer.createTransport({ host, port, secure: false });
  return async (message) => {
    await transport.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  };
}

export async function deliver(messages: OutboundMail[], mailer: Mailer = smtpMailer()): Promise<void> {
  for (const message of messages) await mailer(message);
}
