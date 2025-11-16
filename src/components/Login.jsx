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
    const { login } = await import("../util/tools.js");
    const loginResult = await login();
    setResult(loginResult);

    // If login successful and we have a return URL, redirect
    if (loginResult === "Login successful!" && returnUrl) {
      window.location.href = returnUrl;
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
