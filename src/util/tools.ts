export async function register(
  name?: string,
  displayName?: string
): Promise<string> {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const userId = new Uint8Array(16);
  crypto.getRandomValues(userId);

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
    {
      challenge,
      rp: {
        name: "Infinite Logic",
        id: window.location.hostname,
      },
      user: {
        id: userId,
        name: name || "human",
        displayName: displayName || name || "Human",
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: 60000,
      attestation: "direct",
    };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });
    if (credential) {
      return `Registration successful! Credential ID: ${credential.id}`;
    } else {
      return "Registration cancelled.";
    }
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}
