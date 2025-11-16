export const prerender = false;

import { db, OAuthClient, OAuthConnection } from "astro:db";
import { eq, and } from "astro:db";

export async function GET(context: any) {
  const { request, session, params } = context;
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const providerId = params.provider;
  const storedState = await session.get(`oauth-state-${providerId}`);

  if (!code || !state || state !== storedState) {
    return new Response("Invalid OAuth callback", { status: 400 });
  }

  const humanId = await session.get("humanId");
  if (!humanId) {
    return new Response("Not logged in", { status: 401 });
  }

  // Get OAuth client configuration
  const client = await db
    .select()
    .from(OAuthClient)
    .where(eq(OAuthClient.id, providerId))
    .get();
  if (!client) {
    return new Response("Unknown OAuth provider", { status: 404 });
  }

  try {
    // Exchange code for access token with dynamic redirect URI
    const redirectUri = `${new URL(request.url).origin}/auth/oauth/${providerId}/callback`;

    const tokenResponse = await fetch(client.tokenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: client.clientId,
        client_secret: client.clientSecret,
        code: code,
        redirect_uri: redirectUri
      }).toString()
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(`OAuth error: ${tokenData.error_description}`, {
        status: 400
      });
    }

    // Get user info from provider
    const userResponse = await fetch(client.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json"
      }
    });

    const userData = await userResponse.json();

    // Store OAuth connection in database
    const connectionId = crypto.randomUUID();

    // First try to find existing connection
    const existingConnection = await db
      .select()
      .from(OAuthConnection)
      .where(
        and(
          eq(OAuthConnection.humanId, humanId),
          eq(OAuthConnection.clientId, providerId)
        )
      )
      .get();

    if (existingConnection) {
      // Update existing connection
      await db
        .update(OAuthConnection)
        .set({
          providerId: userData.id?.toString() || userData.login,
          username: userData.login || userData.name,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          linkedAt: new Date()
        })
        .where(eq(OAuthConnection.id, existingConnection.id));
    } else {
      // Insert new connection
      await db.insert(OAuthConnection).values({
        id: connectionId,
        humanId: humanId,
        clientId: providerId,
        providerId: userData.id?.toString() || userData.login,
        username: userData.login || userData.name,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        linkedAt: new Date()
      });
    }

    // Clean up session
    await session.delete(`oauth-state-${providerId}`);

    // Redirect back to link page with success
    const redirectUrl = new URL(
      `/app/link-oauth?provider=${providerId}&success=true`,
      new URL(request.url).origin
    );
    return Response.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("OAuth error:", error);
    return new Response("Failed to link OAuth account", { status: 500 });
  }
}
