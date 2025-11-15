export const prerender = false;

import type { APIContext } from "astro";
import { db, eq, Cred } from "astro:db";

function base64urlToUint8Array(base64url: string): Uint8Array {
  // Convert base64url to base64
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  return new Uint8Array(
    atob(padded)
      .split('')
      .map(c => c.charCodeAt(0))
  );
}

async function verifyAssertion(
  assertion: any,
  storedPublicKey: string,
  challenge: number[]
): Promise<boolean> {
  console.log('=== Starting verifyAssertion ===');
  console.log('Challenge:', challenge);
  console.log('StoredPublicKey length:', storedPublicKey.length);
  console.log('Assertion ID:', assertion.id);
  
  try {
    // Decode the assertion components using base64url decoder
    const authenticatorData = base64urlToUint8Array(assertion.response.authenticatorData);
    const clientDataJSON = base64urlToUint8Array(assertion.response.clientDataJSON);
    const signature = base64urlToUint8Array(assertion.response.signature);

    // Parse client data to verify challenge
    const clientData = JSON.parse(new TextDecoder().decode(clientDataJSON));
    console.log('Client data:', clientData);
    
    const receivedChallenge = Array.from(base64urlToUint8Array(clientData.challenge));
    
    console.log('Received challenge:', receivedChallenge);
    console.log('Expected challenge:', challenge);

    // Compare arrays directly
    if (JSON.stringify(receivedChallenge) !== JSON.stringify(challenge)) {
      console.log('❌ Challenge verification failed');
      return false;
    }
    console.log('✅ Challenge verification passed');

    // Verify origin
    console.log('Client origin:', clientData.origin);
    const expectedOrigins = [
      'http://localhost:4321',
      'https://localhost:4321'
    ];
    
    if (!expectedOrigins.includes(clientData.origin)) {
      console.log('❌ Origin verification failed');
      console.log('Expected origins:', expectedOrigins);
      return false;
    }
    console.log('✅ Origin verification passed');

    // Create the data that was signed
    const clientDataHash = await crypto.subtle.digest('SHA-256', clientDataJSON);
    const signedData = new Uint8Array(authenticatorData.length + clientDataHash.byteLength);
    signedData.set(authenticatorData);
    signedData.set(new Uint8Array(clientDataHash), authenticatorData.length);

    // Parse the stored public key coordinates
    const keyData = JSON.parse(storedPublicKey);
    console.log('Parsed key data:', keyData);
    
    // Convert base64url coordinates back to Uint8Array
    const x = base64urlToUint8Array(keyData.x + '='.repeat((4 - keyData.x.length % 4) % 4));
    const y = base64urlToUint8Array(keyData.y + '='.repeat((4 - keyData.y.length % 4) % 4));
    
    console.log('X coordinate length:', x.length);
    console.log('Y coordinate length:', y.length);
    
    // Import the public key using raw format with explicit coordinates
    const publicKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array([0x04, ...x, ...y]), // 0x04 prefix for uncompressed point
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false,
      ['verify']
    );
    console.log('✅ Public key imported successfully');

    // Verify the signature
    console.log('Verifying signature...');
    console.log('Signature length:', signature.length);
    console.log('Signed data length:', signedData.length);
    
    const isValid = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: 'SHA-256'
      },
      publicKey,
      signature,
      signedData
    );

    console.log('Signature verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('❌ Verification error:', error);
    return false;
  }
}

export async function POST(context: APIContext) {
  const { request, session } = context;

  const storedChallenge = await session.get("webauthn-challenge");
  const credId = await session.get("webauthn-credId");

  if (!storedChallenge || !credId) {
    return new Response("Session missing data", { status: 400 });
  }

  const assertion = await request.json();

  // Get the stored credential from database
  const cred = await db.select().from(Cred).where(eq(Cred.id, credId)).get();
  
  if (!cred) {
    return new Response("Credential not found", { status: 404 });
  }

  // Verify the WebAuthn assertion using stored public key
  const valid = await verifyAssertion(assertion, cred.publicKey, storedChallenge);

  if (!valid) {
    return new Response("Invalid login assertion", { status: 401 });
  }

  // Authentication succeeded
  await session.set("humanId", credId);
  await session.delete("webauthn-challenge");
  await session.delete("webauthn-credId");

  return new Response("OK");
}
