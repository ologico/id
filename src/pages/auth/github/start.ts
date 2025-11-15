export const prerender = false;

export async function GET(context: any) {
  // Redirect to the generic OAuth start endpoint for GitHub
  const redirectUrl = new URL("/auth/oauth/github/start", new URL(context.request.url).origin);
  return Response.redirect(redirectUrl.toString());
}
