import { db, Cred } from "astro:db";

export default async function () {
  await db
    .insert(Cred)
    .values([{ id: "c80kltpjez8jwQIKLLoH67RSPKw", locale: "en-US" }]);
}
