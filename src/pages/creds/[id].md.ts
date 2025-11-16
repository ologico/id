export const prerender = false;

import { db, eq, Cred } from "astro:db";

export async function GET({ params }) {
  const id = decodeURIComponent(params.id);

  const result = await db.select().from(Cred).where(eq(Cred.id, id));

  return new Response(JSON.stringify(result[0]), {
    headers: { "Content-Type": "application/json" }
  });
}
