import { db, Cred } from "astro:db";
import { writeFileSync } from "fs";

async function generateSeed() {
  try {
    // Fetch all current credentials from the database
    const creds = await db.select().from(Cred).all();
    
    // Generate the seed file content
    const seedContent = `import { db, Cred } from "astro:db";

export default async function () {
  await db.insert(Cred).values([
${creds.map(cred => 
  `    { id: ${JSON.stringify(cred.id)}, publicKey: ${JSON.stringify(cred.publicKey)}, signCount: ${cred.signCount} }`
).join(',\n')}
  ]);
}
`;

    // Write to the seed file
    writeFileSync('db/seed.ts', seedContent);
    console.log(`Generated seed.ts with ${creds.length} credentials`);
    
  } catch (error) {
    console.error('Error generating seed:', error);
  }
}

generateSeed();
