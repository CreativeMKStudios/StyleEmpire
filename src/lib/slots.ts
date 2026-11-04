import { salon } from "../data/salon.ts";
import { addDays, labelToMinutes, londonParts, londonWallToUtc, minutesToLabel, openingWindow } from "./time.ts";

export type BusyRange = { startMs: number; endMs: number };

export function slotsForDay(options: {
  ymd: string;
  durationMin: number;
  now: Date;
  busy: BusyRange[];
  leadMin?: number;
  stepMin?: number;
  horizonDays?: number;
}): string[] {
  const leadMin = options.leadMin ?? salon.leadMinutes;
  const stepMin = options.stepMin ?? 30;
  const horizonDays = options.horizonDays ?? salon.horizonDays;
  const today = londonParts(options.now).ymd;
  const lastDay = addDays(today, horizonDays);
  if (options.ymd < today || options.ymd > lastDay) return [];

  const window = openingWindow(options.ymd);
  if (!window) return [];

  const earliest = options.now.getTime() + leadMin * 60_000;
  const slots: string[] = [];
  for (let start = window.start; start + options.durationMin <= window.end; start += stepMin) {
    const [hour, minute] = [Math.floor(start / 60), start % 60];
    const startDate = londonWallToUtc(options.ymd, hour, minute);
    const startMs = startDate.getTime();
    const endMs = startMs + options.durationMin * 60_000;
    if (startMs < earliest) continue;
    const clash = options.busy.some((range) => startMs < range.endMs && endMs > range.startMs);
    if (clash) continue;
    slots.push(minutesToLabel(start));
  }
  return slots;
}

export function slotRange(ymd: string, label: string, durationMin: number): { startMs: number; endMs: number } | null {
  const mins = labelToMinutes(label);
  if (mins == null) return null;
  const startMs = londonWallToUtc(ymd, Math.floor(mins / 60), mins % 60).getTime();
  return { startMs, endMs: startMs + durationMin * 60_000 };
}

export function isOfferedSlot(options: {
  ymd: string;
  label: string;
  durationMin: number;
  now: Date;
  busy: BusyRange[];
}): boolean {
  return slotsForDay({
    ymd: options.ymd,
    durationMin: options.durationMin,
    now: options.now,
    busy: options.busy,
  }).includes(options.label);
}
