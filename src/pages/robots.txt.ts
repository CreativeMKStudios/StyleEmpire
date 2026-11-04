import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? "http://localhost:4321";
  const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /book/pay/
Disallow: /book/confirmed

Sitemap: ${origin}/sitemap-index.xml
`;
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
