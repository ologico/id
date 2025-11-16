export const prerender = false;

import type { APIContext } from "astro";
import { db, eq, Cred } from "astro:db";

function base64urlToUint8Array(base64url: string): Uint8Array {
  // Convert base64url to base64
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if needed
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return new Uint8Array(
    atob(padded)
      .split("")
      .map((c) => c.charCodeAt(0))
  );
}

function derToP1363(derSignature: Uint8Array): Uint8Array {
  // Parse DER-encoded signature to extract r and s values
  let offset = 0;

  // Skip SEQUENCE tag and length
  if (derSignature[offset] !== 0x30) throw new Error("Invalid DER signature");
  offset += 2; // Skip tag and length

  // Parse r value
  if (derSignature[offset] !== 0x02) throw new Error("Invalid DER signature");
  offset++; // Skip INTEGER tag
  let rLength = derSignature[offset++];
  let r = derSignature.slice(offset, offset + rLength);
  offset += rLength;

  // Parse s value
  if (derSignature[offset] !== 0x02) throw new Error("Invalid DER signature");
  offset++; // Skip INTEGER tag
  let sLength = derSignature[offset++];
  let s = derSignature.slice(offset, offset + sLength);

  // Remove leading zero bytes if present (DER encoding requirement)
  if (r[0] === 0x00) r = r.slice(1);
  if (s[0] === 0x00) s = s.slice(1);

  // Pad to 32 bytes for P-256
  const rPadded = new Uint8Array(32);
  const sPadded = new Uint8Array(32);
  rPadded.set(r, 32 - r.length);
  sPadded.set(s, 32 - s.length);

  // Concatenate r and s for P1363 format
  const p1363Signature = new Uint8Array(64);
  p1363Signature.set(rPadded, 0);
  p1363Signature.set(sPadded, 32);

  return p1363Signature;
}

async function verifyAssertion(
  assertion: any,
  storedPublicKey: string,
  challenge: number[]
): Promise<boolean> {
  try {
    // Decode the assertion components using base64url decoder
    const authenticatorData = base64urlToUint8Array(
      assertion.response.authenticatorData
    );
    const clientDataJSON = base64urlToUint8Array(
      assertion.response.clientDataJSON
    );
    const signature = base64urlToUint8Array(assertion.response.signature);

    // Parse client data to verify challenge
    const clientData = JSON.parse(new TextDecoder().decode(clientDataJSON));
    const receivedChallenge = Array.from(
      base64urlToUint8Array(clientData.challenge)
    );

    // Compare arrays directly
    if (JSON.stringify(receivedChallenge) !== JSON.stringify(challenge)) {
      return false;
    }

    // Verify origin
    const origin = new URL(context.request.url).origin;

    // Example use
    if (assertion.origin !== origin) {
      return new Response("Origin mismatch", { status: 400 });
    }

    // Create the data that was signed
    const clientDataHash = await crypto.subtle.digest(
      "SHA-256",
      clientDataJSON
    );
    const signedData = new Uint8Array(
      authenticatorData.length + clientDataHash.byteLength
    );
    signedData.set(authenticatorData);
    signedData.set(new Uint8Array(clientDataHash), authenticatorData.length);

    // Parse the stored public key coordinates
    const keyData = JSON.parse(storedPublicKey);

    // Convert base64url coordinates back to Uint8Array
    const x = base64urlToUint8Array(
      keyData.x + "=".repeat((4 - (keyData.x.length % 4)) % 4)
    );
    const y = base64urlToUint8Array(
      keyData.y + "=".repeat((4 - (keyData.y.length % 4)) % 4)
    );

    // Import the public key using raw format with explicit coordinates
    const publicKey = await crypto.subtle.importKey(
      "raw",
      new Uint8Array([0x04, ...x, ...y]), // 0x04 prefix for uncompressed point
      {
        name: "ECDSA",
        namedCurve: "P-256"
      },
      false,
      ["verify"]
    );

    // Convert DER signature to P1363 format for Web Crypto API
    const p1363Signature = derToP1363(signature);

    // Verify the signature
    const isValid = await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: "SHA-256"
      },
      publicKey,
      p1363Signature,
      signedData
    );

    return isValid;
  } catch (error) {
    console.error("Verification error:", error);
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
  const valid = await verifyAssertion(
    assertion,
    cred.publicKey,
    storedChallenge
  );

  if (!valid) {
    return new Response("Invalid login assertion", { status: 401 });
  }

  // Authentication succeeded
  await session.set("humanId", credId);
  await session.delete("webauthn-challenge");
  await session.delete("webauthn-credId");

  return new Response("OK");
}
