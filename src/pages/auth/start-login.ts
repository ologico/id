export const prerender = false;

import type { APIContext } from "astro";
import { db, eq, Cred } from "astro:db";

export async function POST(context: APIContext) {
  const { request, session } = context;

  const { credId } = await request.json();
  const cred = await db.select().from(Cred).where(eq(Cred.id, credId)).get();

  if (!cred) {
    return new Response("Unknown credential", { status: 403 });
  }

  // Generate challenge
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  // Store in session
  await session.set("webauthn-challenge", Array.from(challenge));
  await session.set("webauthn-credId", credId);

  // Convert challenge to base64url for client
  const challengeBase64url = btoa(String.fromCharCode(...challenge))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return new Response(JSON.stringify({ challenge: challengeBase64url }), {
    headers: { "Content-Type": "application/json" }
  });
}
