import { useState, useEffect } from "react";

export default function Logout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  async function checkLoginStatus() {
    const { whoami } = await import("../util/tools.js");
    const humanId = await whoami();

    if (
      humanId &&
      humanId !== "Not logged in" &&
      humanId !== "Failed to get user info"
    ) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }

  async function handleLogout() {
    const { logout } = await import("../util/tools.js");
    const result = await logout();
    if (result.includes("successfully")) {
      window.location.href = "/";
    }
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px"
      }}
    >
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
