import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Target, GraduationCap, Building2, Briefcase, ArrowRight, Loader2, Lock, Mail, User } from "lucide-react";
import { useLocation } from "wouter";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "login" | "register";
  defaultRole?: "STUDENT" | "COLLEGE_ADMIN" | "RECRUITER";
}

export default function AuthModal({
  open,
  onOpenChange,
  defaultMode = "login",
  defaultRole = "STUDENT",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">(defaultMode);
  const [role, setRole] = useState<"STUDENT" | "COLLEGE_ADMIN" | "RECRUITER">(defaultRole);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [department, setDepartment] = useState("");
  const [targetRole, setTargetRole] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome back, ${data.user.firstName}!`);
      utils.auth.me.invalidate();
      onOpenChange(false);
      // Navigate to role workspace
      if (data.user.role === "STUDENT") setLocation("/student");
      else if (data.user.role === "COLLEGE_ADMIN") setLocation("/college");
      else if (data.user.role === "RECRUITER") setLocation("/recruiter");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to sign in");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      toast.success(`Account created successfully! Welcome, ${data.user.firstName}.`);
      utils.auth.me.invalidate();
      onOpenChange(false);
      if (data.user.role === "STUDENT") setLocation("/student");
      else if (data.user.role === "COLLEGE_ADMIN") setLocation("/college");
      else if (data.user.role === "RECRUITER") setLocation("/recruiter");
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed");
    },
  });

  const resetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setMode("login");
    },
    onError: (err) => {
      toast.error(err.message || "Could not process password reset");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      loginMutation.mutate({ email, password });
    } else if (mode === "register") {
      registerMutation.mutate({
        email,
        password,
        role,
        firstName,
        lastName,
        institutionName: role === "COLLEGE_ADMIN" ? orgName : undefined,
        companyName: role === "RECRUITER" ? orgName : undefined,
        department: role === "STUDENT" ? department : undefined,
        targetRole: role === "STUDENT" ? targetRole : undefined,
      });
    } else if (mode === "forgot") {
      resetMutation.mutate({ email });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending || resetMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-[#fbfdfc] border-[#d8e5df] p-6 text-[#14221f]">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#135f52] text-white">
              <Target size={17} />
            </span>
            <DialogTitle className="font-display text-xl font-bold tracking-tight text-[#14221f]">
              Vantage<span className="text-[#d29e38]">.</span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#62776e]">
            {mode === "login" && "Sign in with your email and password to access your workspace."}
            {mode === "register" && "Create your production account with verified role-based access."}
            {mode === "forgot" && "Enter your registered email address to receive password reset instructions."}
          </DialogDescription>
        </DialogHeader>

        {/* Mode Switcher Tabs */}
        {mode !== "forgot" && (
          <div className="flex rounded-lg bg-[#edf4f0] p-1 text-xs font-semibold text-[#5a7167]">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-md py-2 transition ${
                mode === "login" ? "bg-white font-bold text-[#135f52] shadow-sm" : "hover:text-[#135f52]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-md py-2 transition ${
                mode === "register" ? "bg-white font-bold text-[#135f52] shadow-sm" : "hover:text-[#135f52]"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Role Selector on Register */}
        {mode === "register" && (
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold text-[#486358]">Select your role</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole("STUDENT")}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-center text-xs transition ${
                  role === "STUDENT"
                    ? "border-[#135f52] bg-[#e8f3ee] font-bold text-[#135f52]"
                    : "border-[#d8e5df] bg-white text-[#5f746b] hover:bg-[#f4f8f5]"
                }`}
              >
                <GraduationCap size={17} />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("COLLEGE_ADMIN")}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-center text-xs transition ${
                  role === "COLLEGE_ADMIN"
                    ? "border-[#135f52] bg-[#e8f3ee] font-bold text-[#135f52]"
                    : "border-[#d8e5df] bg-white text-[#5f746b] hover:bg-[#f4f8f5]"
                }`}
              >
                <Building2 size={17} />
                <span>College</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("RECRUITER")}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-center text-xs transition ${
                  role === "RECRUITER"
                    ? "border-[#135f52] bg-[#e8f3ee] font-bold text-[#135f52]"
                    : "border-[#d8e5df] bg-white text-[#5f746b] hover:bg-[#f4f8f5]"
                }`}
              >
                <Briefcase size={17} />
                <span>Recruiter</span>
              </button>
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs text-[#526a60]">First Name</Label>
                <Input
                  required
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border-[#cbdcd4] bg-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#526a60]">Last Name</Label>
                <Input
                  required
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border-[#cbdcd4] bg-white text-xs"
                />
              </div>
            </div>
          )}

          {mode === "register" && role === "STUDENT" && (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs text-[#526a60]">Department</Label>
                <Input
                  placeholder="Computer Science"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="border-[#cbdcd4] bg-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#526a60]">Target Role</Label>
                <Input
                  placeholder="Product Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="border-[#cbdcd4] bg-white text-xs"
                />
              </div>
            </div>
          )}

          {mode === "register" && (role === "COLLEGE_ADMIN" || role === "RECRUITER") && (
            <div className="space-y-1">
              <Label className="text-xs text-[#526a60]">
                {role === "COLLEGE_ADMIN" ? "Institution Name" : "Company Name"}
              </Label>
              <Input
                required
                placeholder={role === "COLLEGE_ADMIN" ? "Riverview Institute of Technology" : "Northstar Labs"}
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="border-[#cbdcd4] bg-white text-xs"
              />
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs text-[#526a60]">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 text-[#869b91]" size={15} />
              <Input
                required
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[#cbdcd4] bg-white pl-8 text-xs"
              />
            </div>
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#526a60]">Password</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-[11px] font-semibold text-[#135f52] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 text-[#869b91]" size={15} />
                <Input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-[#cbdcd4] bg-white pl-8 text-xs"
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#135f52] font-semibold text-white hover:bg-[#0d5146]"
          >
            {isLoading && <Loader2 className="mr-2 animate-spin" size={15} />}
            {mode === "login" && "Sign In to Workspace"}
            {mode === "register" && "Create Account"}
            {mode === "forgot" && "Send Reset Link"}
            {!isLoading && <ArrowRight className="ml-2" size={14} />}
          </Button>

          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="w-full text-center text-xs font-semibold text-[#135f52] hover:underline pt-1"
            >
              Back to Sign In
            </button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
