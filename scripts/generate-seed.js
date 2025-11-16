import { db, Cred, OAuthClient } from "astro:db";
import { writeFileSync } from "fs";

export default async function generateSeed() {
  try {
    // Fetch all current credentials and OAuth clients from the database
    const creds = await db.select().from(Cred).all();
    const oauthClients = await db.select().from(OAuthClient).all();

    // Generate the seed file content
    const seedContent = `import { db, Cred, OAuthClient } from "astro:db";

export default async function () {
  await db.insert(Cred).values([
${creds
  .map(
    (cred) =>
      `    { id: ${JSON.stringify(cred.id)}, publicKey: ${JSON.stringify(cred.publicKey)}, signCount: ${cred.signCount} }`
  )
  .join(",\n")}
  ]);

  await db.insert(OAuthClient).values([
${oauthClients
  .map(
    (client) =>
      `    { id: ${JSON.stringify(client.id)}, name: ${JSON.stringify(client.name)}, clientId: ${JSON.stringify(client.clientId)}, clientSecret: ${JSON.stringify(client.clientSecret)}, authUrl: ${JSON.stringify(client.authUrl)}, tokenUrl: ${JSON.stringify(client.tokenUrl)}, userInfoUrl: ${JSON.stringify(client.userInfoUrl)}, scopes: ${JSON.stringify(client.scopes)}, createdAt: new Date(${JSON.stringify(client.createdAt.toISOString())}) }`
  )
  .join(",\n")}
  ]);
}
`;

    // Write to the seed file
    writeFileSync("db/seed.ts", seedContent);
    console.log(
      `Generated seed.ts with ${creds.length} credentials and ${oauthClients.length} OAuth clients`
    );
  } catch (error) {
    console.error("Error generating seed:", error);
  }
}
