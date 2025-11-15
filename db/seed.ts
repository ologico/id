import { db, Cred } from "astro:db";

export default async function () {
  await db.insert(Cred).values([
    { id: "XYZ123", locale: "en-US" },
    { id: "ABX097", locale: "pr-BR" },
    { id: "BGP123", locale: "pr-BR" }
  ]);
}
