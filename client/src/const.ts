export const COOKIE_NAME = "vantage_session";
export const ONE_YEAR_MS = 31536000000;

// Custom event to trigger authentication modal anywhere in the application
export const startLogin = (mode: "login" | "register" = "login", role: string = "STUDENT") => {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("vantage:open-auth", {
      detail: { mode, role },
    });
    window.dispatchEvent(event);
  }
};
