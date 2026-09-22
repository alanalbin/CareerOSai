import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, Building2, Briefcase, ArrowRight, Loader2, Lock, Mail, ChevronLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

interface LoginProps {
  initialRole?: "student" | "college" | "recruiter";
}

export default function Login({ initialRole = "student" }: LoginProps) {
  const [location, setLocation] = useLocation();

  // Determine active tab from URL path or prop
  const getRoleFromPath = (): "student" | "college" | "recruiter" => {
    if (location.includes("/login/college")) return "college";
    if (location.includes("/login/recruiter")) return "recruiter";
    if (location.includes("/login/student")) return "student";
    return initialRole;
  };

  const [activeRole, setActiveRole] = useState<"student" | "college" | "recruiter">(getRoleFromPath());
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    setActiveRole(getRoleFromPath());
  }, [location]);

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      toast.success(`Welcome back, ${data.user.firstName}!`);
      // Update cache immediately to prevent unauthenticated flash
      utils.auth.me.setData(undefined, { user: data.user as any, profile: null });
      await utils.auth.me.invalidate();

      // Route directly to correct portal
      if (data.user.role === "STUDENT") {
        window.location.href = "/student";
      } else if (data.user.role === "COLLEGE_ADMIN") {
        window.location.href = "/college";
      } else if (data.user.role === "RECRUITER") {
        window.location.href = "/recruiter";
      } else {
        window.location.href = "/";
      }
    },
    onError: (err) => {
      toast.error(err.message || "Incorrect email or password.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const roleParam = activeRole === "student" ? "STUDENT" : activeRole === "college" ? "COLLEGE_ADMIN" : "RECRUITER";
    loginMutation.mutate({
      identifier,
      password,
      role: roleParam,
    });
  };

  const roleTitles = {
    student: {
      title: "Student Portal Login",
      subtitle: "Sign in with your email or Student ID to access your career readiness workspace.",
      label: "Email or Student ID",
      placeholder: "student@university.edu or STU10492",
      portalPath: "/student",
      regPath: "/register/student",
      icon: GraduationCap,
    },
    college: {
      title: "College Administration Login",
      subtitle: "Sign in with your official college email or institution code.",
      label: "Official College Email or College ID",
      placeholder: "admin@college.edu or COL-409",
      portalPath: "/college",
      regPath: "/register/college",
      icon: Building2,
    },
    recruiter: {
      title: "Recruiter Workspace Login",
      subtitle: "Sign in with your verified corporate recruiter email.",
      label: "Recruiter Email",
      placeholder: "recruiter@company.com",
      portalPath: "/recruiter",
      regPath: "/register/recruiter",
      icon: Briefcase,
    },
  };

  const currentRoleConfig = roleTitles[activeRole];
  const IconComponent = currentRoleConfig.icon;

  return (
    <div className="min-h-screen bg-[#f7f8f5] flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-[#dfe8e2]/80 bg-[#f7f8f5]/95 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="Career OS Logo" className="h-9 w-auto object-contain" />
            <span className="font-display text-lg font-semibold tracking-tight text-[#14221f]">
              Career OS
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#5f706a] hover:text-[#135f52] transition"
          >
            <ChevronLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#dce7e1] p-8 panel-shadow animate-in">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 rounded-xl bg-[#eaf2ee] text-[#135f52] flex items-center justify-center mb-3">
              <IconComponent size={24} />
            </div>
            <h1 className="font-display text-2xl font-bold text-[#14221f]">
              {currentRoleConfig.title}
            </h1>
            <p className="mt-1.5 text-xs text-[#62776e] leading-relaxed">
              {currentRoleConfig.subtitle}
            </p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#f0f5f2] rounded-lg mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveRole("student");
                setLocation("/login/student");
              }}
              className={`py-2 rounded-md transition text-center ${
                activeRole === "student"
                  ? "bg-white text-[#135f52] shadow-sm"
                  : "text-[#62776e] hover:text-[#14221f]"
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRole("college");
                setLocation("/login/college");
              }}
              className={`py-2 rounded-md transition text-center ${
                activeRole === "college"
                  ? "bg-white text-[#135f52] shadow-sm"
                  : "text-[#62776e] hover:text-[#14221f]"
              }`}
            >
              College
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRole("recruiter");
                setLocation("/login/recruiter");
              }}
              className={`py-2 rounded-md transition text-center ${
                activeRole === "recruiter"
                  ? "bg-white text-[#135f52] shadow-sm"
                  : "text-[#62776e] hover:text-[#14221f]"
              }`}
            >
              Recruiter
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-[#324b42]">
                {currentRoleConfig.label}
              </Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                <Input
                  type="text"
                  required
                  placeholder={currentRoleConfig.placeholder}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-[#324b42]">Password</Label>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                <Input
                  type="password"
                  required
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full mt-2 bg-[#135f52] text-white hover:bg-[#0d5146] font-semibold text-xs py-2.5 shadow-md shadow-[#135f52]/10 transition"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={14} /> Signing in...
                </>
              ) : (
                <>
                  Sign In to {activeRole.charAt(0).toUpperCase() + activeRole.slice(1)} <ArrowRight className="ml-1.5" size={14} />
                </>
              )}
            </Button>
          </form>

          {/* Registration link */}
          <div className="mt-6 pt-5 border-t border-[#e8eeeb] text-center">
            <p className="text-xs text-[#62776e]">
              Don't have an account?{" "}
              <Link
                href={currentRoleConfig.regPath}
                className="font-semibold text-[#135f52] hover:underline"
              >
                Register as {activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[#81928b]">
        <p>Â© 2026 Career OS â€” AI-Powered Student Employability & Profile Platform</p>
      </footer>
    </div>
  );
}
