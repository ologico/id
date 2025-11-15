export const prerender = false;

export async function POST(context: any) {
  // Redirect to the generic OAuth unlink endpoint for GitHub
  const response = await fetch(new URL("/auth/oauth/github/unlink", new URL(context.request.url).origin), {
    method: "POST",
    headers: context.request.headers,
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
