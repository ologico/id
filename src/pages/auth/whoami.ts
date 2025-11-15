export const prerender = false;

import type { APIContext } from "astro";
import { db, eq, Cred } from "astro:db";

export async function GET(context: APIContext) {
  const { request, session } = context;
  const humanId = await session.get("humanId");
  return new Response(humanId);
}
