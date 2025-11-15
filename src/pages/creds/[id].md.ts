import { db, eq, Cred } from "astro:db";

export async function GET({ params, request }) {
  const cred = params.id;
  const result = await db.select().from(Cred).where(eq(Cred.id, cred));
  return new Response(JSON.stringify(result[0]));
}

export async function getStaticPaths() {
  const creds = await db.select().from(Cred).all();
  const result = creds.map((c) => ({
    params: {
      ...c
    }
  }));
  return result;
}
