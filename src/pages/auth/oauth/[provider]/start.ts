export const prerender = false;

import { db, OAuthClient } from "astro:db";
import { eq } from "astro:db";

export async function GET(context: any) {
  const { session, params } = context;

  const humanId = await session.get("humanId");
  if (!humanId) {
    return new Response("Not logged in", { status: 401 });
  }

  const providerId = params.provider;

  // Get OAuth client configuration
  const client = await db
    .select()
    .from(OAuthClient)
    .where(eq(OAuthClient.id, providerId))
    .get();
  if (!client) {
    return new Response("Unknown OAuth provider", { status: 404 });
  }

  // Generate a random state parameter for security
  const state = crypto.randomUUID();
  await session.set(`oauth-state-${providerId}`, state);

  // Build OAuth authorization URL with dynamic redirect URI
  const redirectUri = `${new URL(context.request.url).origin}/auth/oauth/${providerId}/callback`;

  const authUrl = new URL(client.authUrl);
  authUrl.searchParams.set("client_id", client.clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", client.scopes);
  authUrl.searchParams.set("state", state);

  return Response.redirect(authUrl.toString());
}
