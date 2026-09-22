import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import Platform from "@/pages/Platform";
import AuthModal from "@/components/auth/AuthModal";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ProfileDataVerification from "@/pages/ProfileDataVerification";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={() => <Login />} />
      <Route path="/login/student" component={() => <Login initialRole="student" />} />
      <Route path="/login/college" component={() => <Login initialRole="college" />} />
      <Route path="/login/recruiter" component={() => <Login initialRole="recruiter" />} />
      <Route path="/register" component={() => <Register />} />
      <Route path="/register/student" component={() => <Register initialRole="student" />} />
      <Route path="/register/college" component={() => <Register initialRole="college" />} />
      <Route path="/register/recruiter" component={() => <Register initialRole="recruiter" />} />
      <Route path="/student/profile-data" component={ProfileDataVerification} />
      <Route path="/student" component={() => <Platform role="student" />} />
      <Route path="/college" component={() => <Platform role="college" />} />
      <Route path="/recruiter" component={() => <Platform role="recruiter" />} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authRole, setAuthRole] = useState<"STUDENT" | "COLLEGE_ADMIN" | "RECRUITER">("STUDENT");

  useEffect(() => {
    const handleOpenAuth = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: "login" | "register"; role?: "STUDENT" | "COLLEGE_ADMIN" | "RECRUITER" }>;
      if (customEvent.detail) {
        if (customEvent.detail.mode) setAuthMode(customEvent.detail.mode);
        if (customEvent.detail.role) setAuthRole(customEvent.detail.role);
      }
      setAuthOpen(true);
    };

    window.addEventListener("vantage:open-auth", handleOpenAuth);
    return () => window.removeEventListener("vantage:open-auth", handleOpenAuth);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AuthModal
            open={authOpen}
            onOpenChange={setAuthOpen}
            defaultMode={authMode}
            defaultRole={authRole}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
