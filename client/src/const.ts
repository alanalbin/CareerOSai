export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Custom event to trigger authentication modal anywhere in the application
export const startLogin = (mode: "login" | "register" = "login", role: string = "STUDENT") => {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("vantage:open-auth", {
      detail: { mode, role },
    });
    window.dispatchEvent(event);
  }
};
