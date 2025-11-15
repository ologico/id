export const prerender = false;

import { db, GitHub } from "astro:db";
import { eq } from "astro:db";

export async function POST(context: any) {
  const { session } = context;
  
  const humanId = await session.get("humanId");
  if (!humanId) {
    return new Response("Not logged in", { status: 401 });
  }

  try {
    await db.delete(GitHub).where(eq(GitHub.humanId, humanId));
    return new Response("GitHub account unlinked successfully");
  } catch (error) {
    console.error("Error unlinking GitHub account:", error);
    return new Response("Failed to unlink GitHub account", { status: 500 });
  }
}
