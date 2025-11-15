export const prerender = false;

export async function GET(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Redirect to the generic OAuth callback endpoint for GitHub
  const redirectUrl = new URL("/auth/oauth/github/callback", new URL(request.url).origin);
  redirectUrl.search = url.search; // Preserve query parameters
  
  return Response.redirect(redirectUrl.toString());
}
