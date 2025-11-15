export const prerender = false;

import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const { request, session } = context;
  const humanId = await session.destroy();
  return new Response();
}
