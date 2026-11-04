import { fullAddress, hoursLabel, salon, weekHours } from "../data/salon.ts";

const dayUrl: Record<string, string> = {
  Monday: "https://schema.org/Monday",
  Tuesday: "https://schema.org/Tuesday",
  Wednesday: "https://schema.org/Wednesday",
  Thursday: "https://schema.org/Thursday",
  Friday: "https://schema.org/Friday",
  Saturday: "https://schema.org/Saturday",
  Sunday: "https://schema.org/Sunday",
};

function hhmm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function salonJsonLd(site: string, images: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": ["HairSalon", "BeautySalon"],
    name: salon.name,
    description: `${salon.name} is a hair salon at ${fullAddress}. Hair, barbers, nails, beauty and tanning.`,
    image: images,
    url: site,
    telephone: salon.phoneTel,
    currenciesAccepted: "GBP",
    paymentAccepted: "Cash, Credit Card, Debit Card",
    address: {
      "@type": "PostalAddress",
      streetAddress: salon.street,
      addressLocality: salon.locality,
      addressRegion: salon.region,
      postalCode: salon.postcode,
      addressCountry: salon.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: salon.lat,
      longitude: salon.lng,
    },
    hasMap: salon.mapsUrl,
    areaServed: {
      "@type": "City",
      name: "Kettering",
    },
    sameAs: [salon.facebook, salon.companiesHouse],
    openingHoursSpecification: weekHours
      .filter((day) => day.open != null && day.close != null)
      .map((day) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: dayUrl[day.day],
        opens: hhmm(day.open as number),
        closes: hhmm(day.close as number),
      })),
    amenityFeature: [
      {
        "@type": "LocationFeatureSpecification",
        name: "Wheelchair accessible entrance",
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: "Wheelchair accessible seating",
        value: true,
      },
    ],
    parentOrganization: {
      "@type": "Organization",
      name: salon.legalName,
      identifier: salon.companyNumber,
      url: salon.companiesHouse,
    },
  };
}

export function hoursForHumans(): { day: string; label: string }[] {
  return weekHours.map((day) => ({ day: day.day, label: hoursLabel(day) }));
}

export function breadcrumbJsonLd(site: string, crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: new URL(crumb.path, site).href,
    })),
  };
}

export function faqJsonLd(questions: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
