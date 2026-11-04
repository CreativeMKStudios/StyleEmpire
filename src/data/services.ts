export type Service = {
  id: string;
  name: string;
  group: "Hair" | "Barbers" | "Nails" | "Beauty" | "Tanning";
  summary: string;
  /** Minutes held on the book. Null means phone only. */
  minutes: number | null;
  bookable: boolean;
  /** Pence. Null means the salon has not published a price. */
  pricePence: number | null;
};

export const services: Service[] = [
  {
    id: "womens-cut",
    name: "Women's cut and finish",
    group: "Hair",
    summary: "A cut and a blow-dry. The book holds one hour.",
    minutes: 60,
    bookable: true,
    pricePence: null,
  },
  {
    id: "mens-cut",
    name: "Men's cut",
    group: "Hair",
    summary: "A men's cut at a hair station. The book holds 45 minutes.",
    minutes: 45,
    bookable: true,
    pricePence: null,
  },
  {
    id: "child-cut",
    name: "Children's cut",
    group: "Hair",
    summary: "A shorter cut for a child. The book holds 30 minutes.",
    minutes: 30,
    bookable: true,
    pricePence: null,
  },
  {
    id: "blow-dry",
    name: "Blow-dry",
    group: "Hair",
    summary: "A wash and blow-dry, with no cut. The book holds 45 minutes.",
    minutes: 45,
    bookable: true,
    pricePence: null,
  },
  {
    id: "colour",
    name: "Colour",
    group: "Hair",
    summary: "Colour and highlights take longer than a cut. Call so we can set the right length.",
    minutes: null,
    bookable: false,
    pricePence: null,
  },
  {
    id: "barber-cut",
    name: "Barber cut",
    group: "Barbers",
    summary: "A cut in the barber room. The book holds 30 minutes.",
    minutes: 30,
    bookable: true,
    pricePence: null,
  },
  {
    id: "skin-fade",
    name: "Skin fade",
    group: "Barbers",
    summary: "A skin fade in the barber room. The book holds 45 minutes.",
    minutes: 45,
    bookable: true,
    pricePence: null,
  },
  {
    id: "nails",
    name: "Nail appointment",
    group: "Nails",
    summary: "Nails with a nail technician. The book holds one hour.",
    minutes: 60,
    bookable: true,
    pricePence: null,
  },
  {
    id: "brows",
    name: "Brow threading",
    group: "Beauty",
    summary: "Brows shaped by threading. The book holds 20 minutes.",
    minutes: 20,
    bookable: true,
    pricePence: null,
  },
  {
    id: "lashes",
    name: "Lash appointment",
    group: "Beauty",
    summary: "A lash appointment. The book holds 75 minutes. Say what you want in the notes.",
    minutes: 75,
    bookable: true,
    pricePence: null,
  },
  {
    id: "makeup",
    name: "Makeup",
    group: "Beauty",
    summary: "Makeup, including bridal makeup, is booked by phone.",
    minutes: null,
    bookable: false,
    pricePence: null,
  },
  {
    id: "aesthetics",
    name: "Aesthetics",
    group: "Beauty",
    summary: "Aesthetics are booked by phone, so you can talk the treatment through first.",
    minutes: null,
    bookable: false,
    pricePence: null,
  },
  {
    id: "sunbed",
    name: "Sunbed",
    group: "Tanning",
    summary: "Sunbeds are for people aged 18 and over. That is UK law. Call us to book one.",
    minutes: null,
    bookable: false,
    pricePence: null,
  },
];

export function getService(id: string): Service | undefined {
  return services.find((service) => service.id === id);
}

export function bookableServices(): Service[] {
  return services.filter((service) => service.bookable && service.minutes != null);
}
