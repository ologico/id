import { useState, useEffect } from "react";

export default function Login() {
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
      setResult("Logging in...");
      const { login } = await import("../util/tools.js");
      const loginResult = await login();
      setResult(loginResult);

      // Only redirect if login was actually successful
      if (loginResult === "Login successful!" && returnUrl) {
        window.location.href = returnUrl;
      } else if (loginResult.includes("error") || loginResult.includes("failed") || loginResult.includes("Error")) {
        // Don't redirect on errors, just show the error message
        console.error("Login failed:", loginResult);
      }
    } catch (error) {
      console.error("Login error:", error);
      setResult(`Login failed: ${error.message}`);
    }
  }

  return (
    <div>
      <button onClick={handleClick}>Login</button>
      {result && <div id="result">{result}</div>}
      <a
        id="register-link"
        href={
          returnUrl
            ? `/register?return=${encodeURIComponent(returnUrl)}`
            : "/register"
        }
      >
        Register
      </a>
    </div>
  );
}
