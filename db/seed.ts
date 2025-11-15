import { db, Cred } from "astro:db";

export default async function () {
  await db.insert(Cred).values([
    { id: "Rqj4-bfnKq2q1JKJwWaiLc2kTk8", locale: "en-US" },
  ]);
}
