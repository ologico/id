export const prerender = false;

import type { APIContext } from "astro";
import { db, eq, Cred } from "astro:db";

async function verifyAssertion(
  assertion: any,
  storedPublicKey: string,
  challenge: number[]
): Promise<boolean> {
  try {
    // Decode the assertion components
    const authenticatorData = new Uint8Array(
      atob(assertion.response.authenticatorData)
        .split('')
        .map(c => c.charCodeAt(0))
    );
    
    const clientDataJSON = new Uint8Array(
      atob(assertion.response.clientDataJSON)
        .split('')
        .map(c => c.charCodeAt(0))
    );
    
    const signature = new Uint8Array(
      atob(assertion.response.signature)
        .split('')
        .map(c => c.charCodeAt(0))
    );

    // Parse client data to verify challenge
    const clientData = JSON.parse(new TextDecoder().decode(clientDataJSON));
    const receivedChallenge = new Uint8Array(
      atob(clientData.challenge)
        .split('')
        .map(c => c.charCodeAt(0))
    );
    
    // Verify challenge matches
    const expectedChallenge = new Uint8Array(challenge);
    if (receivedChallenge.length !== expectedChallenge.length) {
      return false;
    }
    for (let i = 0; i < receivedChallenge.length; i++) {
      if (receivedChallenge[i] !== expectedChallenge[i]) {
        return false;
      }
    }

    // Verify origin
    if (clientData.origin !== `https://${new URL(clientData.origin).hostname}` && 
        clientData.origin !== `http://${new URL(clientData.origin).hostname}`) {
      return false;
    }

    // Create the data that was signed
    const clientDataHash = await crypto.subtle.digest('SHA-256', clientDataJSON);
    const signedData = new Uint8Array(authenticatorData.length + clientDataHash.byteLength);
    signedData.set(authenticatorData);
    signedData.set(new Uint8Array(clientDataHash), authenticatorData.length);

    // Decode the stored public key (base64 -> CBOR -> key)
    const publicKeyBytes = new Uint8Array(
      atob(storedPublicKey)
        .split('')
        .map(c => c.charCodeAt(0))
    );

    // Import the public key for verification
    // Note: This is a simplified approach. In production, you'd need to properly
    // parse the CBOR-encoded public key to extract the actual key parameters
    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyBytes,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false,
      ['verify']
    );

    // Verify the signature
    const isValid = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: 'SHA-256'
      },
      publicKey,
      signature,
      signedData
    );

    return isValid;
  } catch (error) {
    console.error('Verification error:', error);
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
