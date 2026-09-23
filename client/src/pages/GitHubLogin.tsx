import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { setPersistedUser } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Github,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Code2,
  Sparkles,
  GitBranch,
  Star,
  CheckCircle2,
  ChevronLeft,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function GitHubLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);

  const utils = trpc.useUtils();

  const githubAuthMutation = trpc.auth.github.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.message || `Connected to GitHub as @${data.user?.githubUsername || username}!`);
      
      // Save user session in localStorage so it persists across reloads
      if (data.user) {
        setPersistedUser(data.user, data.token || "careeros_jwt_token_sample");
      }
      
      // Cache github profile
      if (data.github) {
        try {
          localStorage.setItem("careeros_github", JSON.stringify(data.github));
        } catch {}
      }

      // Navigate directly to student platform
      setLocation("/student");
      setTimeout(() => {
        window.location.href = "/student";
      }, 50);
    },
    onError: () => {
      const cleanUsername = username.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "") || "alexvance-dev";
      const demoUser = {
        id: 1,
        email: `${cleanUsername}@users.noreply.github.com`,
        firstName: cleanUsername === "alexvance-dev" ? "Alex" : cleanUsername,
        lastName: cleanUsername === "alexvance-dev" ? "Vance" : "Dev",
        role: "STUDENT",
        githubUsername: cleanUsername,
      };
      setPersistedUser(demoUser, "careeros_jwt_token_sample");
      toast.success(`Entering student workspace as @${cleanUsername}...`);
      setLocation("/student");
      setTimeout(() => {
        window.location.href = "/student";
      }, 50);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "") || "alexvance-dev";
    
    // Immediate persistence
    const immediateUser = {
      id: 1,
      email: `${cleanUsername}@users.noreply.github.com`,
      firstName: cleanUsername === "alexvance-dev" ? "Alex" : cleanUsername,
      lastName: cleanUsername === "alexvance-dev" ? "Vance" : "Dev",
      role: "STUDENT",
      githubUsername: cleanUsername,
    };
    setPersistedUser(immediateUser, "careeros_jwt_token_sample");

    githubAuthMutation.mutate({
      username: cleanUsername,
      token: token.trim() || undefined,
    });
  };

  const handleQuickDemo = (demoHandle: string) => {
    setUsername(demoHandle);
    const demoUser = {
      id: 1,
      email: `${demoHandle}@users.noreply.github.com`,
      firstName: demoHandle === "alexvance-dev" ? "Alex" : demoHandle,
      lastName: demoHandle === "alexvance-dev" ? "Vance" : "Dev",
      role: "STUDENT",
      githubUsername: demoHandle,
    };
    setPersistedUser(demoUser, "careeros_jwt_token_sample");
    toast.success(`Quick demo access as @${demoHandle}!`);
    setLocation("/student");
    setTimeout(() => {
      window.location.href = "/student";
    }, 50);
  };

  return (
    <div className="min-h-screen bg-[#f7f8f5] flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-[#dfe8e2]/80 bg-[#f7f8f5]/95 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="Career OS Logo" className="h-9 w-auto object-contain" />
            <span className="font-display text-lg font-semibold tracking-tight text-[#14221f]">
              Career OS
            </span>
          </Link>
          <Link
            href="/login/student"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#5f706a] hover:text-[#135f52] transition"
          >
            <ChevronLeft size={16} /> Back to Standard Login
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Context & Value Proposition */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-[#135f52]/10 px-3 py-1 text-xs font-semibold text-[#135f52] border border-[#135f52]/20">
              <Sparkles size={14} /> Developer Evidence & Code Intelligence
            </div>

            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#14221f] leading-tight">
                Sign In & Get Access from GitHub
              </h1>
              <p className="mt-3 text-sm text-[#5a6e66] leading-relaxed">
                Seamlessly authorize Career OS to analyze your public repositories, tech stacks, and commit history. Transform raw git contributions into deterministic, recruiter-ready credentials.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3 rounded-xl border border-[#dce7e1] bg-white p-3.5 panel-shadow">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#24292f] text-white">
                  <Code2 size={16} />
                </span>
                <div>
                  <h2 className="text-xs font-bold text-[#14221f]">AI Repository & Code Audit</h2>
                  <p className="text-[11px] text-[#697c74] mt-0.5">
                    Evaluates repository complexity, frameworks, design patterns, and documentation clarity.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-[#dce7e1] bg-white p-3.5 panel-shadow">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#135f52] text-white">
                  <ShieldCheck size={16} />
                </span>
                <div>
                  <h2 className="text-xs font-bold text-[#14221f]">Deterministic Skill Verification</h2>
                  <p className="text-[11px] text-[#697c74] mt-0.5">
                    Cross-references claimed skills with actual repositories and active language usage.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-[#dce7e1] bg-white p-3.5 panel-shadow">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#d29e38] text-white">
                  <GitBranch size={16} />
                </span>
                <div>
                  <h2 className="text-xs font-bold text-[#14221f]">Verified Employability Passport</h2>
                  <p className="text-[11px] text-[#697c74] mt-0.5">
                    Powers automatic technical resume generation and verified recruiter discovery.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Demo Personas */}
            <div className="rounded-xl border border-[#e2ece7] bg-[#edf4f0]/70 p-4">
              <p className="text-xs font-semibold text-[#31574d] mb-2 flex items-center gap-1.5">
                <Star size={13} className="text-[#d29e38]" /> Quick-Start Test Handles:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo("alexvance-dev")}
                  className="text-xs bg-white border border-[#cbdad3] text-[#135f52] font-semibold px-2.5 py-1 rounded-md hover:bg-[#eaf4f0] transition"
                >
                  @alexvance-dev
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("octocat")}
                  className="text-xs bg-white border border-[#cbdad3] text-[#135f52] font-semibold px-2.5 py-1 rounded-md hover:bg-[#eaf4f0] transition"
                >
                  @octocat
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("torvalds")}
                  className="text-xs bg-white border border-[#cbdad3] text-[#135f52] font-semibold px-2.5 py-1 rounded-md hover:bg-[#eaf4f0] transition"
                >
                  @torvalds
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive GitHub Login Form */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="bg-white rounded-2xl border border-[#dce7e1] p-7 panel-shadow animate-in">
              <div className="flex items-center gap-3 pb-5 border-b border-[#e8eeeb]">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#24292f] text-white shadow-sm">
                  <Github size={26} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#14221f]">
                    Authorize GitHub Data Access
                  </h2>
                  <p className="text-xs text-[#6a7d75]">
                    Read-only public repository inspection via GitHub REST API
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="gh-username" className="text-xs font-semibold text-[#324b42]">
                    GitHub Username or Profile URL <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-2.5 text-xs font-semibold text-[#8e9f97]">
                      github.com/
                    </span>
                    <Input
                      id="gh-username"
                      type="text"
                      required
                      autoComplete="username"
                      placeholder="your-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-24 text-xs font-mono border-[#cbdad3] focus-visible:ring-[#135f52]"
                    />
                  </div>
                  <p className="text-[11px] text-[#788a82] mt-1.5">
                    Enter your public GitHub handle (e.g. <code>username</code>). No password required.
                  </p>
                </div>

                {/* Optional Token Accordion */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTokenInput(!showTokenInput)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#135f52] hover:underline"
                  >
                    <KeyRound size={12} />
                    {showTokenInput ? "Hide Personal Access Token (Optional)" : "Have a GitHub Token? (Higher rate limits / Private repos)"}
                  </button>

                  {showTokenInput && (
                    <div className="mt-2 p-3 bg-[#f7f9f8] rounded-lg border border-[#dfe7e3] space-y-2 animate-in">
                      <Label htmlFor="gh-token" className="text-[11px] font-semibold text-[#486358]">
                        GitHub Personal Access Token (PAT)
                      </Label>
                      <Input
                        id="gh-token"
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="text-xs font-mono border-[#cbdad3] bg-white"
                      />
                      <p className="text-[10px] text-[#71857c]">
                        Tokens only require <code>read:user</code> and <code>public_repo</code> scopes. Never shared with third parties.
                      </p>
                    </div>
                  )}
                </div>

                {/* Permission Disclosures */}
                <div className="rounded-lg bg-[#f9fbf9] border border-[#e1ece6] p-3 text-[11px] text-[#556960] space-y-1.5">
                  <div className="flex items-center gap-2 text-[#135f52] font-semibold">
                    <CheckCircle2 size={13} /> Safe & Non-Invasive Permissions
                  </div>
                  <p>
                    Career OS only inspects your public repositories, languages, commit velocity, and star counts. We cannot modify code or delete repositories.
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={githubAuthMutation.isPending}
                  className="w-full mt-2 bg-[#24292f] text-white hover:bg-[#15191d] font-semibold text-xs py-3 shadow-md shadow-[#24292f]/10 transition"
                >
                  {githubAuthMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={15} />
                      Authenticating & Auditing Repositories...
                    </>
                  ) : (
                    <>
                      <Github size={15} className="mr-2" />
                      Sign In & Analyze GitHub Data <ArrowRight className="ml-2" size={14} />
                    </>
                  )}
                </Button>
              </form>

              {/* Alternative login */}
              <div className="mt-6 pt-5 border-t border-[#e8eeeb] flex items-center justify-between text-xs">
                <Link
                  href="/login/student"
                  className="font-semibold text-[#135f52] hover:underline"
                >
                  Standard Student Login
                </Link>
                <Link
                  href="/register/student"
                  className="text-[#657a71] hover:text-[#14221f]"
                >
                  Create New Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[#81928b]">
        <p>© 2026 Career OS — AI-Powered Student Employability & Profile Platform</p>
      </footer>
    </div>
  );
}
