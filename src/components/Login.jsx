export default function Login() {
  async function handleClick() {
    const { login } = await import("../util/tools.js");
    login();
  }

  return <button onClick={handleClick}>Login foo</button>;
}
/*
  <script client:load>
    import { login } from "../util/tools.ts";

    const button = document.getElementById("login-btn");
    const resultDiv = document.getElementById("result");
    const registerLink = document.getElementById("register-link");

    // Pass return parameter to register page
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get("return");
    if (returnUrl) {
      registerLink.href = `/register?return=${encodeURIComponent(returnUrl)}`;
    }

    button.addEventListener("click", async () => {
      const result = await login(); // pass credId into login()
      resultDiv.textContent = result;

      // If login successful and we have a return URL, redirect
      if (result === "Login successful!" && returnUrl) {
        window.location.href = returnUrl;
      }
    });
  </script>
	*/
