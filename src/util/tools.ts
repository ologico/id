//
// Registration
//
//
export const authStorageKey = "webauthn:id:";

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

    localStorage.setItem(`${authStorageKey}${credId}`, locale);

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
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  // Gather known credential IDs from localStorage
  const storedCredentialIds = Object.keys(localStorage)
    .filter((key) => key.startsWith(authStorageKey))
    .map((key) => key.replace(authStorageKey, ""));

    console.log(storedCredentialIds);
  // Convert each credential ID into the format expected by WebAuthn
  const allowCredentials = storedCredentialIds.map((id) => {
    // Convert base64url or plain string into bytes
    const rawId = Uint8Array.from(
      atob(id.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );

    return {
      id: rawId,
      type: "public-key"
    };
  });

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    allowCredentials,
    userVerification: "required",
    timeout: 60000
  };

  try {
    const credential = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    });

    if (!credential) {
      return "Login cancelled.";
    }
    return `Welcome back`;
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}
