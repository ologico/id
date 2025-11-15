export const prerender = false;

import { db, OAuthConnection } from "astro:db";
import { eq, and } from "astro:db";

export async function POST(context: any) {
  const { session, params } = context;
  
  const humanId = await session.get("humanId");
  if (!humanId) {
    return new Response("Not logged in", { status: 401 });
  }

  const providerId = params.provider;

  try {
    await db.delete(OAuthConnection).where(
      and(
        eq(OAuthConnection.humanId, humanId),
        eq(OAuthConnection.clientId, providerId)
      )
    );
    return new Response("OAuth account unlinked successfully");
  } catch (error) {
    console.error("Error unlinking OAuth account:", error);
    return new Response("Failed to unlink OAuth account", { status: 500 });
  }
}
