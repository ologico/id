export const prerender = false;

import { db, GitHub } from "astro:db";
import { eq } from "astro:db";

export async function GET(context: any) {
  const { request, session } = context;
  const url = new URL(request.url);
  
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = await session.get("github-oauth-state");
  
  if (!code || !state || state !== storedState) {
    return new Response("Invalid OAuth callback", { status: 400 });
  }

  const humanId = await session.get("humanId");
  if (!humanId) {
    return new Response("Not logged in", { status: 401 });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: import.meta.env.GITHUB_CLIENT_ID,
        client_secret: import.meta.env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      return new Response(`GitHub OAuth error: ${tokenData.error_description}`, { status: 400 });
    }

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Accept": "application/vnd.github.v3+json",
      },
    });

    const userData = await userResponse.json();

    // Store GitHub account info in database
    await db.insert(GitHub).values({
      humanId: humanId,
      githubId: userData.id.toString(),
      username: userData.login,
      accessToken: tokenData.access_token,
      linkedAt: new Date(),
    }).onConflictDoUpdate({
      target: GitHub.humanId,
      set: {
        githubId: userData.id.toString(),
        username: userData.login,
        accessToken: tokenData.access_token,
        linkedAt: new Date(),
      },
    });

    // Clean up session
    await session.delete("github-oauth-state");

    // Redirect back to link page with success
    return Response.redirect("/app/link-github?success=true");
    
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return new Response("Failed to link GitHub account", { status: 500 });
  }
}
