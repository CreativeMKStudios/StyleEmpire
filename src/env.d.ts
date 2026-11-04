/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE?: string;
  readonly SMTP_HOST?: string;
  readonly SMTP_PORT?: string;
  readonly SMTP_FROM?: string;
  readonly MANAGER_EMAIL?: string;
  readonly PAYMENT_MODE?: string;
  readonly STRIPE_SECRET_KEY?: string;
  readonly BOOKINGS_DB?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
