/**
 * Facts checked against the public Google listing for Style Empire
 * (maps.app.goo.gl/DzDGTz2xpw9puRzz7) on 4 November 2026, plus Companies House
 * company 11970937. The weekly hours come from that Google listing. A live
 * check the same day showed Wednesday closing at 6pm, which matches this table.
 * The glass on the front door is an older photo and says 9am to 8pm, Monday
 * to Saturday. Do not copy the door times back into this file.
 * Fresha still lists Monday as closed. Google lists Monday as open.
 */

export const salon = {
  name: "Style Empire",
  legalName: "Style Empire Salons Ltd",
  companyNumber: "11970937",
  tagline: "Hair. Barbers. Nails. Beauty. Tanning",
  phoneDisplay: "01536 601414",
  phoneTel: "+441536601414",
  emailNote:
    "No email address is shown on the Google listing. Book online or call.",
  street: "193 St Peter's Avenue",
  locality: "Kettering",
  region: "Northamptonshire",
  postcode: "NN16 0HE",
  country: "United Kingdom",
  countryCode: "GB",
  lat: 52.398326,
  lng: -0.715657,
  plusCode: "97XM+8M Kettering",
  mapsUrl: "https://maps.app.goo.gl/DzDGTz2xpw9puRzz7",
  facebook: "https://www.facebook.com/style.empire.kettering/",
  companiesHouse:
    "https://find-and-update.company-information.service.gov.uk/company/11970937",
  rating: 4.7,
  reviewCount: 53,
  category: "Hair salon",
  incorporated: "30 April 2019",
  director: "Emma Arnold",
  leadMinutes: 120,
  horizonDays: 21,
  holdMinutes: 30,
} as const;

export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type DayHours = {
  day: Weekday;
  /** Minutes from midnight in Europe/London. Null when closed. */
  open: number | null;
  close: number | null;
};

export const weekHours: DayHours[] = [
  { day: "Monday", open: 9 * 60 + 30, close: 18 * 60 },
  { day: "Tuesday", open: 9 * 60 + 30, close: 14 * 60 },
  { day: "Wednesday", open: 9 * 60 + 30, close: 18 * 60 },
  { day: "Thursday", open: 9 * 60 + 30, close: 18 * 60 },
  { day: "Friday", open: 9 * 60 + 30, close: 18 * 60 },
  { day: "Saturday", open: 9 * 60, close: 14 * 60 },
  { day: "Sunday", open: null, close: null },
];

export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

export function hoursLabel(day: DayHours): string {
  if (day.open == null || day.close == null) return "Closed";
  return `${formatMinutes(day.open)} to ${formatMinutes(day.close)}`;
}

export const fullAddress = `${salon.street}, ${salon.locality}, ${salon.postcode}`;
