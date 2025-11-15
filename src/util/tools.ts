import { decode } from 'cbor-js';

export const authStorageKey = "webauthn:id";

export async function register(
  name?: string,
  displayName?: string
): Promise<string> {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const userId = new Uint8Array(16);
  crypto.getRandomValues(userId);

  name = "human";
  displayName = "Human";

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
    {
      challenge,
      rp: {
        name: "Infinite Logic",
        id: window.location.hostname
      },
      user: {
        id: userId,
        name,
        displayName
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" } // ES256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required"
      },
      timeout: 60000,
      attestation: "none"
    };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    });

    if (!credential) {
      return "Registration cancelled.";
    }

    // Store the credential name in localStorage
    const credId = credential.id;

    localStorage.setItem(`${authStorageKey}`, credId);

    // Extract and encode the public key from attestation object
    const attestationResponse = credential.response as AuthenticatorAttestationResponse;
    const attestationBuffer = new Uint8Array(attestationResponse.attestationObject);
    const attestation = decode(attestationBuffer.buffer.slice(attestationBuffer.byteOffset, attestationBuffer.byteOffset + attestationBuffer.byteLength));
    const authData = new Uint8Array(attestation.authData);
    
    // Extract public key from credential data (starts at offset 55 in authData)
    // The credential data contains: AAGUID (16 bytes) + credentialIdLength (2 bytes) + credentialId + publicKey
    const credentialIdLength = (authData[53] << 8) | authData[54];
    const publicKeyStart = 55 + credentialIdLength;
    const publicKeyBytes = authData.slice(publicKeyStart);
    
    // Parse the CBOR-encoded public key
    const publicKeyObject = decode(publicKeyBytes.buffer.slice(publicKeyBytes.byteOffset, publicKeyBytes.byteOffset + publicKeyBytes.byteLength));
    
    // Extract the x and y coordinates for P-256 (assuming ES256 algorithm)
    // CBOR key format: 1: key type, 3: algorithm, -1: curve, -2: x coordinate, -3: y coordinate
    const x = new Uint8Array(publicKeyObject[-2]);
    const y = new Uint8Array(publicKeyObject[-3]);
    
    // Store the coordinates as base64url for later reconstruction
    const publicKey = JSON.stringify({
      x: btoa(String.fromCharCode(...x)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
      y: btoa(String.fromCharCode(...y)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    });

    // signCount will be handled server-side during verification
    const signCount = 0;

    // Send credential record to your API
    await fetch("http://localhost:4321/creds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: credId,
        publicKey: publicKey,
        signCount: signCount
      })
    });

    return `Welcome, ${displayName}`;
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

//
// Login
//
export async function login(): Promise<string> {
  // 1. Load stored credential IDs from localStorage
  const credId = localStorage.getItem(authStorageKey);

  if (!credId) {
    return "No registered credentials found.";
  }

  //
  // 2. Ask the server for the challenge
  //
  const start = await fetch("/auth/start-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // important for session cookie
    body: JSON.stringify({ credId })
  }).then((r) => r.json());

  // Convert base64url challenge back to Uint8Array
  const challengeBase64 = start.challenge.replace(/-/g, '+').replace(/_/g, '/');
  const paddedChallenge = challengeBase64 + '='.repeat((4 - challengeBase64.length % 4) % 4);
  const challenge = new Uint8Array(
    atob(paddedChallenge)
      .split('')
      .map(c => c.charCodeAt(0))
  );

  //
  // 3. Convert credId to raw bytes
  //
  const rawId = Uint8Array.from(
    atob(credId.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );

  //
  // 4. Ask WebAuthn to sign the challenge
  //
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: rawId, type: "public-key" }],
        userVerification: "required"
      }
    });

    if (!assertion) {
      return "Authentication cancelled.";
    }

    //
    // 5. Send the signed challenge back to the server
    //
    const res = await fetch("/auth/finish-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: assertion.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
        response: {
          authenticatorData: btoa(String.fromCharCode(...new Uint8Array(assertion.response.authenticatorData))),
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(assertion.response.clientDataJSON))),
          signature: btoa(String.fromCharCode(...new Uint8Array(assertion.response.signature)))
        },
        type: assertion.type
      })
    });

    if (res.ok) {
      // Check for return URL parameter and redirect
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('return');
      
      if (returnUrl) {
        setTimeout(() => {
          window.location.href = returnUrl;
        }, 1000);
        return "Welcome back! Redirecting...";
      }
      
      return "Welcome back!";
    }

    const errorText = await res.text();
    return `Login failed: ${errorText}`;
  } catch (error) {
    return `Authentication error: ${error instanceof Error ? error.message : String(error)}`;
  }
}
