export async function register(
  name?: string,
  displayName?: string
): Promise<string> {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const userId = new Uint8Array(16);
  crypto.getRandomValues(userId);
  displayName = displayName || name || "Human";
  name = name || "human";

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
    {
      challenge,
      rp: {
        name: "Infinite Logic",
        id: window.location.hostname
      },
      user: {
        id: userId,
        name: name,
        displayName: displayName
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required"
      },
      timeout: 60000,
      attestation: "direct"
    };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    });
    if (credential) {
      localStorage.setItem(credential.id, displayName);
      return `Welcome, ${displayName}`;
    } else {
      return "Registration cancelled.";
    }
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function login(): Promise<string> {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    allowCredentials: [],
    userVerification: "required",
    timeout: 60000
  };

  try {
    const credential = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    });
    if (credential) {
      const stored = localStorage.getItem(credential.id);
      return `Welcome back, ${stored || credential.id}`;
    } else {
      return "Login cancelled.";
    }
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}
