import { weekHours, type Weekday } from "../data/salon.ts";

export const LONDON = "Europe/London";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type LondonParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  weekday: string;
  ymd: string;
};

export function londonParts(date: Date): LondonParts {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });
  const bag: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") bag[part.type] = part.value;
  }
  let hour = bag.hour ?? "00";
  if (hour === "24") hour = "00";
  const year = bag.year ?? "1970";
  const month = bag.month ?? "01";
  const day = bag.day ?? "01";
  return {
    year,
    month,
    day,
    hour,
    minute: bag.minute ?? "00",
    weekday: (bag.weekday ?? "Sun").replace(".", ""),
    ymd: `${year}-${month}-${day}`,
  };
}

/** Convert a London wall-clock time to a UTC Date. */
export function londonWallToUtc(ymd: string, hour: number, minute: number): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) throw new Error("Bad date");
  let utc = Date.UTC(y, m - 1, d, hour, minute, 0);
  for (let i = 0; i < 4; i += 1) {
    const got = londonParts(new Date(utc));
    const gotMs = Date.UTC(
      Number(got.year),
      Number(got.month) - 1,
      Number(got.day),
      Number(got.hour),
      Number(got.minute),
    );
    const wantMs = Date.UTC(y, m - 1, d, hour, minute);
    const delta = wantMs - gotMs;
    if (delta === 0) break;
    utc += delta;
  }
  return new Date(utc);
}

export function weekdayIndex(ymd: string): number {
  const noon = londonWallToUtc(ymd, 12, 0);
  const name = londonParts(noon).weekday;
  const index = WEEKDAY_INDEX[name];
  if (index == null) throw new Error(`Unknown weekday ${name}`);
  return index;
}

const DAYS_FROM_SUNDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export function openingWindow(ymd: string): { start: number; end: number } | null {
  const name = DAYS_FROM_SUNDAY[weekdayIndex(ymd)];
  const day = weekHours.find((item) => item.day === name);
  if (!day || day.open == null || day.close == null) return null;
  return { start: day.open, end: day.close };
}

export function addDays(ymd: string, days: number): string {
  const noon = londonWallToUtc(ymd, 12, 0);
  return londonParts(new Date(noon.getTime() + days * 86_400_000)).ymd;
}

export function formatAppointment(ms: number): string {
  const parts = londonParts(new Date(ms));
  const weekday = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    weekday: "long",
  }).format(new Date(ms));
  const day = Number(parts.day);
  const month = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    month: "long",
  }).format(new Date(ms));
  const hour = Number(parts.hour);
  const minute = parts.minute;
  const suffix = hour >= 12 ? "pm" : "am";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const time = minute === "00" ? `${h12}${suffix}` : `${h12}:${minute}${suffix}`;
  return `${weekday} ${day} ${month} ${parts.year}, ${time}`;
}

export function minutesToLabel(mins: number): string {
  const hour = Math.floor(mins / 60);
  const minute = mins % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function labelToMinutes(label: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(label);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function weekdayName(index: number): Weekday {
  return DAYS_FROM_SUNDAY[index] ?? "Sunday";
}
