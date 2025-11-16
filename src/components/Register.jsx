import { useState, useEffect } from "react";

export default function Register() {
  const [result, setResult] = useState("");
  const [returnUrl, setReturnUrl] = useState("");

  useEffect(() => {
    // Get return parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const returnParam = urlParams.get("return");
    if (returnParam) {
      setReturnUrl(returnParam);
    }
  }, []);

  async function handleClick() {
    try {
      setResult("Registering...");
      const { register } = await import("../util/tools.js");
      const registerResult = await register();
      setResult(registerResult);

      // Only redirect if registration was actually successful
      if (registerResult === "Welcome, Human") {
        if (returnUrl) {
          window.location.href = `/login?return=${encodeURIComponent(returnUrl)}`;
        } else {
          window.location.href = "/login";
        }
      } else if (registerResult.includes("error") || registerResult.includes("failed") || registerResult.includes("Error")) {
        // Don't redirect on errors, just show the error message
        console.error("Registration failed:", registerResult);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setResult(`Registration failed: ${error.message}`);
    }
  }

  return (
    <div>
      <button onClick={handleClick}>Register</button>
      {result && <div id="result">{result}</div>}
      <p>
        Already have an account?{" "}
        <a
          id="login-link"
          href={
            returnUrl
              ? `/login?return=${encodeURIComponent(returnUrl)}`
              : "/login"
          }
        >
          Login here
        </a>
      </p>
    </div>
  );
}
