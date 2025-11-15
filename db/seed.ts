import { db, Cred } from "astro:db";

export default async function () {
  await db.insert(Cred).values([
    // polvi macos
    { id: "c80kltpjez8jwQIKLLoH67RSPKw", locale: "en-US" },
    // polvi bitwarden
    { id: "hcGGEyAnRsO6caS8HVj6AQ", locale: "en-US" }
  ]);
}
