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
    const { register } = await import("../util/tools.js");
    const registerResult = await register();
    setResult(registerResult);

    // If registration successful, redirect to login with return parameter
    if (registerResult === "Welcome, Human") {
      if (returnUrl) {
        window.location.href = `/login?return=${encodeURIComponent(returnUrl)}`;
      } else {
        window.location.href = "/login";
      }
    }
  }

  return (
    <div>
      <button onClick={handleClick}>Register foo</button>
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
