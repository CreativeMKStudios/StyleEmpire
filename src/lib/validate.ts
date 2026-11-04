import { copy } from "../data/copy.ts";

export function clean(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function validName(value: string): boolean {
  return /^[\p{L}][\p{L} .'-]{1,79}$/u.test(value);
}

export function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 120;
}

export function validPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 && /^[0-9+()\s-]{10,20}$/.test(value);
}

export function bookingFieldError(input: {
  name: string;
  email: string;
  phone: string;
  notes: string;
  payment: string;
}): string | null {
  if (!validName(input.name)) return copy.errors.name;
  if (!validEmail(input.email)) return copy.errors.email;
  if (!validPhone(input.phone)) return copy.errors.phone;
  if (input.notes.length > 500) return copy.errors.notes;
  if (input.payment !== "in_store" && input.payment !== "online") return copy.errors.payment;
  return null;
}
