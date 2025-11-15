import { db, Cred } from "astro:db";

export default async function () {
  await db.insert(Cred).values([
    { id: "x49gwpP1tKDNfIDGJTCgMFLhYkY", publicKey: "{\"x\":\"EoedexVv3Z7W79yN4pr5DdamRUPrk59LYpDhW6KsP4w\",\"y\":\"Dj3uuHVmNUT1v73mNsG0-HXjHJy0uoVbWiobN3E8MGk\"}", signCount: 0 }
  ]);
}
