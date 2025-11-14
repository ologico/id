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
      return `Welcome, ${displayName}`;
    } else {
      return "Registration cancelled.";
    }
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}
