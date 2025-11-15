export const prerender = false;

import { db, eq, Cred } from "astro:db";

export async function POST({ request }) {
  // Parse JSON body
  const body = await request.json();

  // Validate required fields
  if (!body.id) {
    return new Response(
      JSON.stringify({ error: "id is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Insert into DB
  const result = await db.insert(Cred).values({
    id: body.id,
    publicKey: "...",
    signCount: 0
  });

  // Return response with 201 Created
  return new Response(
    JSON.stringify({
      status: "created",
      cred: { id: body.id }
    }),
    {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        // Optional but recommended in REST APIs
        Location: `/creds/${body.id}`
      }
    }
  );
}
