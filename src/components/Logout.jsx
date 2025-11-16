import { useState, useEffect } from "react";

export default function Logout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  async function checkLoginStatus() {
    try {
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
    } catch (error) {
      console.error("Error checking login status:", error);
      setIsLoggedIn(false);
    }
  }

  async function handleLogout() {
    try {
      const { logout } = await import("../util/tools.js");
      const result = await logout();
      if (result.includes("successfully")) {
        window.location.href = "/";
      } else {
        console.error("Logout failed:", result);
      }
    } catch (error) {
      console.error("Logout error:", error);
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
