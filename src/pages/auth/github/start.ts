export const prerender = false;

export async function GET(context: any) {
  const { session } = context;
  
  const humanId = await session.get("humanId");
  if (!humanId) {
    return new Response("Not logged in", { status: 401 });
  }

  // Generate a random state parameter for security
  const state = crypto.randomUUID();
  await session.set("github-oauth-state", state);

  // GitHub OAuth parameters
  const clientId = import.meta.env.GITHUB_CLIENT_ID;
  const redirectUri = `${new URL(context.request.url).origin}/auth/github/callback`;
  
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.set("scope", "user:email");
  githubAuthUrl.searchParams.set("state", state);

  return Response.redirect(githubAuthUrl.toString());
}
