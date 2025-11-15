import { db, Cred } from "astro:db";

export default async function () {
  await db.insert(Cred).values([
    { id: "x49gwpP1tKDNfIDGJTCgMFLhYkY", publicKey: "{\"x\":\"EoedexVv3Z7W79yN4pr5DdamRUPrk59LYpDhW6KsP4w\",\"y\":\"Dj3uuHVmNUT1v73mNsG0-HXjHJy0uoVbWiobN3E8MGk\"}", signCount: 0 },
    { id: "RNsvcVxOTLSpN0u3_YFiOw", publicKey: "{\"x\":\"VliiIzaXaddYL5Zwzz89rR3zy8VOfG3gDrIpkNCXEqk\",\"y\":\"R71HtV7epDqwuvFJ7lrGt_0A8Af1wSrg6vox-k3CnyI\"}", signCount: 0 }
  ]);
}
