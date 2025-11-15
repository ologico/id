//
// Registration
//
//
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
    const locale = navigator.language || "eo-001";

    localStorage.setItem(`${authStorageKey}`, credId);

    // Send credential record to your API
    await fetch("http://localhost:4321/creds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: credId,
        locale: locale
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

  const challenge = new Uint8Array(start.challenge);

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
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ id: rawId, type: "public-key" }],
      userVerification: "required"
    }
  });

  //
  // 5. Send the signed challenge back to the server
  //
  const res = await fetch("/auth/finish-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(assertion)
  });

  if (res.ok) {
    return "Welcome back!";
  }

  return "Login failed.";
}
