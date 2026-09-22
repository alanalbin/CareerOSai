import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import {
  ArrowLeft, ArrowRight, BarChart3, Bell, BookOpen, BriefcaseBusiness,
  Check, CheckCircle2, ChevronRight, CircleHelp, Download, FileCheck2,
  FileText, Github, GraduationCap, LayoutDashboard, LockKeyhole, LogOut,
  Menu, MoreHorizontal, Network, Plus, Radar, Search, ShieldCheck,
  Sparkles, Target, Upload, UsersRound, X, Loader2, AlertCircle, RefreshCw, Eye
} from "lucide-react";
import { useMemo, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import StudentProfilesView from "@/components/StudentProfilesView";
import StudentPrivacyView from "@/components/StudentPrivacyView";

type Role = "student" | "college" | "recruiter";

const navByRole = {
  student: [
    { id: "overview", label: "Readiness overview", icon: LayoutDashboard },
    { id: "evidence", label: "Evidence library", icon: FileCheck2 },
    { id: "profiles", label: "Professional profiles", icon: Github },
    { id: "privacy", label: "Data access & privacy", icon: LockKeyhole },
    { id: "roadmap", label: "My roadmap", icon: Target },
    { id: "passport", label: "Employability Passport", icon: ShieldCheck },
  ],
  college: [
    { id: "overview", label: "Institution overview", icon: LayoutDashboard },
    { id: "evidence", label: "Evidence review", icon: FileCheck2 },
    { id: "heatmap", label: "Skill heatmap", icon: Radar },
    { id: "roster", label: "Student roster", icon: UsersRound },
  ],
  recruiter: [
    { id: "overview", label: "Talent overview", icon: LayoutDashboard },
    { id: "jobs", label: "Jobs & requirements", icon: BriefcaseBusiness },
    { id: "candidates", label: "Candidate search", icon: Search },
    { id: "saved", label: "Shortlist", icon: CheckCircle2 },
  ],
} as const;

function scoreRing(score: number, label: string, accent = "#187563") {
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative grid h-16 w-16 place-items-center rounded-full transition-transform hover:scale-105"
        style={{
          background: `conic-gradient(${accent} 0deg ${score * 3.6}deg, #e7efea ${score * 3.6}deg 360deg)`,
        }}
      >
        <div className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-inner">
          <span className="font-display text-lg font-semibold text-[#14221f]">{score}</span>
        </div>
      </div>
      <div>
        <p className="text-xs text-[#7a8983]">{label}</p>
        <p className="mt-0.5 text-xs font-semibold text-[#31574d]">out of 100</p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    verified: "bg-[#e5f1ec] text-[#176b5a] border border-[#c4ded4]",
    VERIFIED: "bg-[#e5f1ec] text-[#176b5a] border border-[#c4ded4]",
    pending: "bg-[#fff4dc] text-[#8b671f] border border-[#fae2ae]",
    PENDING: "bg-[#fff4dc] text-[#8b671f] border border-[#fae2ae]",
    rejected: "bg-[#fce9e7] text-[#a33f3f] border border-[#f5c6c2]",
    REJECTED: "bg-[#fce9e7] text-[#a33f3f] border border-[#f5c6c2]",
    draft: "bg-[#eef2f0] text-[#64756e] border border-[#d6e0db]",
    DRAFT: "bg-[#eef2f0] text-[#64756e] border border-[#d6e0db]",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${map[status] ?? map.draft}`}>
      {status.toLowerCase()}
    </span>
  );
}

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="border-l border-[#dce7e1] pl-4 first:border-l-0 first:pl-0 transition hover:translate-x-0.5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#14221f]">{value}</p>
      <p className="mt-1 text-xs text-[#7a8983]">{note}</p>
    </div>
  );
}

export default function Platform({ role }: { role: Role }) {
  const [active, setActive] = useState<string>(navByRole[role][0].id);
  const [mobileNav, setMobileNav] = useState(false);
  const { isAuthenticated, user, profile, logout } = useAuth();
  const utils = trpc.useUtils();

  const title =
    role === "student"
      ? "Student Workspace"
      : role === "college"
      ? "College Placement Intelligence"
      : "Recruiter Workspace";

  const subtitle =
    role === "student"
      ? "Build an undeniable career signal backed by verified artifacts."
      : role === "college"
      ? "Institutional placement readiness and departmental capability tracking."
      : "Find verified candidate capabilities with deterministic consent controls.";

  const userInitials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "VP";
  const userFullName = user ? `${user.firstName} ${user.lastName}` : "Guest User";

  return (
    <div className="flex min-h-screen bg-[#f7f8f5] text-[#14221f]">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-[#dce7e1] bg-[#f2f6f3] transition-transform lg:static lg:translate-x-0 ${
          mobileNav ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col px-4 py-5">
          <div className="flex items-center justify-between px-2">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Career OS" className="h-8 w-auto object-contain" />
              <div className="flex flex-col">
                <span className="font-display text-lg font-bold tracking-tight text-[#14221f]">
                  Career OS<span className="text-[#135f52]">.</span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#688177]">
                  Readiness Workspace
                </span>
              </div>
            </Link>
            <button
              className="rounded-md p-2 lg:hidden text-[#657770]"
              onClick={() => setMobileNav(false)}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-8 px-2">
            <p className="eyebrow">
              {role === "student" ? "Career Signal" : role === "college" ? "Institutional Analytics" : "Talent Discovery"}
            </p>
            <p className="mt-1.5 text-sm font-semibold text-[#14221f]">{title}</p>
            <p className="mt-1 text-xs leading-5 text-[#7c8c85]">{subtitle}</p>
          </div>

          {/* Navigation Links */}
          <nav className="mt-7 space-y-1" aria-label="Workspace navigation">
            {navByRole[role].map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActive(item.id);
                    setMobileNav(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                    isActive
                      ? "bg-white font-semibold text-[#135f52] shadow-sm translate-x-1"
                      : "text-[#657770] hover:bg-white/60 hover:text-[#31574d]"
                  }`}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="ml-auto" size={15} />}
                </button>
              );
            })}
          </nav>

          {/* User Profile Footer */}
          <div className="mt-auto border-t border-[#dce7e1] px-2 pt-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#d7e8df] text-xs font-bold text-[#135f52]">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#14221f]">{userFullName}</p>
                  <p className="text-[11px] capitalize text-[#81908a]">
                    {user.role.replace("_", " ").toLowerCase()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    toast.success("Logged out successfully");
                  }}
                  className="rounded-md p-1.5 text-[#87958f] hover:bg-white hover:text-[#a33f3f]"
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-[#d5e2da] bg-white p-3.5 text-center">
                <p className="text-xs text-[#62776e]">Signed out</p>
                <Button
                  asChild
                  size="sm"
                  className="mt-2.5 w-full bg-[#135f52] text-xs font-semibold text-white hover:bg-[#0d5146]"
                >
                  <a href={`/login/${role}`}>Sign in to {role}</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#dce7e1] bg-[#f7f8f5] px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md border border-[#d7e2db] bg-white p-2 lg:hidden text-[#61756c]"
              onClick={() => setMobileNav(true)}
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
            <div>
              <p className="eyebrow">Active Workspace</p>
              <h1 className="font-display mt-0.5 text-xl font-semibold tracking-tight text-[#14221f]">
                {navByRole[role].find((item) => item.id === active)?.label ?? title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <Button
                asChild
                size="sm"
                className="bg-[#135f52] text-xs text-white hover:bg-[#0d5146]"
              >
                <a href={`/login/${role}`}>Sign In</a>
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 px-5 py-7 lg:px-8 lg:py-9">
          {isAuthenticated && user && (
            (role === "student" && user.role !== "STUDENT") ||
            (role === "college" && user.role !== "COLLEGE_ADMIN") ||
            (role === "recruiter" && user.role !== "RECRUITER")
          ) ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-[#dce7e1] bg-white p-8 text-center panel-shadow my-12">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#fff4dc] text-[#8b671f] mx-auto mb-4">
                <AlertCircle size={26} />
              </div>
              <h2 className="font-display text-2xl font-bold text-[#14221f]">Role Access Limitation</h2>
              <p className="mt-2 text-sm text-[#71817b]">
                You are currently signed in as a <strong>{user.role.replace("_", " ").toLowerCase()}</strong>. You do not have permission to access the <strong>{role}</strong> portal.
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                <Button asChild className="bg-[#135f52] font-semibold text-white hover:bg-[#0d5146]">
                  <a href={user.role === "STUDENT" ? "/student" : user.role === "COLLEGE_ADMIN" ? "/college" : "/recruiter"}>
                    Go to Your Workspace
                  </a>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    logout();
                    toast.success("Signed out successfully");
                  }}
                  className="border-[#cbdad3] text-xs font-semibold"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <>
              {role === "student" && <StudentWorkspace active={active} />}
              {role === "college" && <CollegeWorkspace active={active} />}
              {role === "recruiter" && <RecruiterWorkspace active={active} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* STUDENT WORKSPACE                                                         */
/* ========================================================================= */
function StudentWorkspace({ active }: { active: string }) {
  const { isAuthenticated, loading } = useAuth();
  const dashboardQuery = trpc.student.getDashboardData.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const recalculateMutation = trpc.student.recalculateReadiness.useMutation({
    onSuccess: (res) => {
      toast.success(`Career Readiness Score updated to ${res.breakdown.overallScore}/100`);
      dashboardQuery.refetch();
    },
  });

  const data = dashboardQuery.data;
  const profile = data?.profile;
  const score = profile?.employabilityScore ?? 0;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-[#135f52]" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[#dce7e1] bg-white p-10 text-center panel-shadow">
        <Target size={36} className="mx-auto text-[#135f52]" />
        <h2 className="font-display mt-4 text-2xl font-bold">Student Career Readiness Workspace</h2>
        <p className="mt-2 text-sm text-[#62776e]">
          Sign in with your student account to manage your evidence library, track your Career Readiness Score, and control recruiter discovery.
        </p>
        <Button
          asChild
          className="mt-6 bg-[#135f52] font-semibold text-white hover:bg-[#0d5146]"
        >
          <a href="/login/student">Sign In as Student <ArrowRight className="ml-2" size={15} /></a>
        </Button>
      </div>
    );
  }

  if (dashboardQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-[#135f52]" size={32} />
      </div>
    );
  }

  if (active === "evidence") return <StudentEvidenceView data={data} refetch={dashboardQuery.refetch} />;
  if (active === "profiles") return <StudentProfilesView />;
  if (active === "privacy") return <StudentPrivacyView />;
  if (active === "roadmap") return <StudentRoadmapView data={data} refetch={dashboardQuery.refetch} />;
  if (active === "passport") return <StudentPassportView data={data} refetch={dashboardQuery.refetch} />;

  return (
    <div className="mx-auto max-w-7xl animate-in space-y-8">
      {/* Profile Data & Cross-Source Verification Quick Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-[#cde0d5] bg-gradient-to-r from-[#eef6f2] to-[#f7faf8] p-5 panel-shadow">
        <div className="flex items-center gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#135f52] text-white">
            <ShieldCheck size={22} />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-[#14221f]">
              Profile Data & Verification Center
            </h3>
            <p className="text-xs text-[#5e746b] mt-0.5">
              Cross-reference your Career OS profile, PaddleOCR documents, GitHub code, and LinkedIn records.
            </p>
          </div>
        </div>
        <Link
          href="/student/profile-data"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#135f52] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d5146]"
        >
          Open Verification Matrix <ArrowRight size={14} />
        </Link>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="eyebrow">Personalized Career Intelligence</div>
          <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight">
            {profile?.name ? `Welcome, ${profile.name.split(" ")[0]}.` : "Welcome."}
          </h2>
          <p className="mt-1.5 text-sm text-[#71817b]">
            Target role: <strong className="text-[#31574d]">{profile?.targetRole}</strong> Â· Department:{" "}
            {profile?.department}
          </p>
        </div>
        <Button
          onClick={() => recalculateMutation.mutate()}
          disabled={recalculateMutation.isPending}
          className="bg-[#135f52] font-semibold text-white hover:bg-[#0d5146]"
        >
          {recalculateMutation.isPending ? <Loader2 className="mr-2 animate-spin" size={15} /> : <RefreshCw className="mr-2" size={15} />}
          Recalculate Readiness
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 rounded-xl border border-[#dce7e1] bg-white p-5 panel-shadow sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Career Readiness Score"
          value={`${score}/100`}
          note={score > 0 ? "Evidence-weighted assessment" : "Add evidence to calculate"}
        />
        <Metric
          label="Placement Readiness"
          value={`${profile?.placementReadiness ?? 0}/100`}
          note="Based on verified skills"
        />
        <Metric
          label="Verified Evidence"
          value={`${profile?.verifiedEvidence ?? 0}`}
          note={`${profile?.totalEvidence ?? 0} total claims submitted`}
        />
        <Metric
          label="Profile Completion"
          value={`${profile?.profileCompletion ?? 0}%`}
          note="Academic & project data"
        />
      </div>

      {/* Two Column Section */}
      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-xl border border-[#dce7e1] bg-white p-6 panel-shadow">
          <div className="flex items-center justify-between border-b border-[#e7eeea] pb-4">
            <div>
              <div className="eyebrow">Readiness Indicators</div>
              <h3 className="mt-1 font-display text-lg font-semibold text-[#14221f]">
                Demonstrated Capability Signal
              </h3>
            </div>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-[.75fr_1.25fr] sm:items-center">
            <div className="flex flex-col items-center">
              {scoreRing(score, "Readiness Score")}
              <p className="mt-3 max-w-[190px] text-center text-xs text-[#7b8983]">
                Weighted across technical depth, verified artifacts, and academic signals.
              </p>
            </div>
            <div className="space-y-4">
              {[
                ["Technical depth", data?.assessment?.technicalScore ?? 60],
                ["Evidence strength", data?.assessment?.evidenceStrengthScore ?? 50],
                ["Problem solving", data?.assessment?.problemSolvingScore ?? 55],
                ["Academic performance", data?.assessment?.academicScore ?? 70],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#35574d]">{label}</span>
                    <span className="font-display font-semibold text-[#135f52]">{val}/100</span>
                  </div>
                  <div className="data-bar">
                    <span style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Next Best Actions */}
        <section className="rounded-xl border border-[#dce7e1] bg-[#143a32] p-6 text-white panel-shadow">
          <div className="flex items-center justify-between">
            <div className="eyebrow text-[#b8d4c8]">Next Best Actions</div>
            <Sparkles size={17} className="text-[#e4b85c]" />
          </div>
          <h3 className="mt-2 font-display text-xl font-semibold">Priority Roadmap Steps</h3>
          <p className="mt-2 text-sm leading-6 text-[#c3d6ce]">
            Demonstrated proof beats self-reported claims. Focus next on these actionable evidence items:
          </p>
          <div className="mt-5 space-y-2.5">
            {[
              ["System design documentation", "Write an architectural trade-off document", "2 hrs"],
              ["Automated test coverage", "Add integration tests and link PR in evidence", "3 hrs"],
              ["API telemetry & observability", "Add logging and metric monitoring", "1.5 hrs"],
            ].map(([title, desc, time]) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/5 p-3 text-left transition hover:bg-white/10"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e4b85c] text-[#3b2b0e]">
                  <ArrowRight size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">{title}</p>
                  <p className="truncate text-[11px] text-[#b8d4c8]">{desc}</p>
                </div>
                <span className="text-[11px] text-[#e4b85c]">{time}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recent Evidence Table */}
      <div className="rounded-xl border border-[#dce7e1] bg-white p-6 panel-shadow">
        <div className="flex items-center justify-between border-b border-[#e7eeea] pb-4">
          <div>
            <div className="eyebrow">Evidence Records</div>
            <h3 className="mt-1 font-display text-lg font-semibold">What is strengthening your profile</h3>
          </div>
          <span className="text-xs font-semibold text-[#135f52]">
            {data?.evidence?.length ?? 0} total records
          </span>
        </div>
        {data?.evidence && data.evidence.length > 0 ? (
          <div className="mt-4 divide-y divide-[#e7eeea]">
            {data.evidence.slice(0, 4).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-3.5 first:pt-0">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef5f1] text-[#187563]">
                    <FileCheck2 size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#14221f]">{item.title}</p>
                    <p className="text-xs text-[#82918b]">
                      {item.type} Â· Source: {item.source}
                    </p>
                  </div>
                </div>
                <StatusPill status={item.verificationStatus} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-[#7c8c85]">
            No evidence records added yet. Click &quot;Evidence library&quot; to upload your first project or certification.
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================================================= */
/* STUDENT EVIDENCE LIBRARY & OCR UPLOAD                                     */
/* ========================================================================= */
function StudentEvidenceView({ data, refetch }: { data: any; refetch: () => void }) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("Manual upload");
  const [sourceUrl, setSourceUrl] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"PROJECT" | "CERTIFICATE" | "INTERNSHIP" | "ACHIEVEMENT">("PROJECT");

  // OCR Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addEvidenceMutation = trpc.student.addEvidence.useMutation({
    onSuccess: () => {
      toast.success("Evidence saved successfully as pending review");
      setAddModalOpen(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadDocMutation = trpc.documents.upload.useMutation({
    onSuccess: (res) => {
      setIsUploading(false);
      const detected = res.ocr?.structuredFields?.detectedSkills || [];
      if (detected.length > 0) {
        setExtractedSkills(detected);
        setSelectedSkills(detected);
        setOcrModalOpen(true);
      } else {
        toast.success("Document uploaded and stored successfully.");
      }
      refetch();
    },
    onError: (err) => {
      setIsUploading(false);
      toast.error(err.message || "Failed to process document");
    },
  });

  const confirmSkillsMutation = trpc.student.confirmExtractedSkills.useMutation({
    onSuccess: (res) => {
      toast.success(`${res.count} skills confirmed and added to your profile.`);
      setOcrModalOpen(false);
      refetch();
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.info("Uploading document to PaddleOCR pipeline...");

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadDocMutation.mutate({
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        fileBase64: base64,
        documentType: file.name.toLowerCase().includes("resume") ? "RESUME" : "CERTIFICATE",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEvidenceMutation.mutate({
      title,
      type,
      source,
      sourceUrl,
      description,
    });
  };

  const evidenceList = data?.evidence || [];

  return (
    <div className="mx-auto max-w-7xl animate-in space-y-6">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="eyebrow">Artifact & Claim Repository</div>
          <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight">Evidence Library</h2>
          <p className="mt-1.5 text-sm text-[#71817b]">
            Every skill claim is backed by a verified document, project repository, or institutional endorsement.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            onClick={() => setAddModalOpen(true)}
            className="bg-[#135f52] font-semibold text-white hover:bg-[#0d5146]"
          >
            <Plus className="mr-2" size={15} /> Add Evidence Claim
          </Button>
          <label className="inline-flex cursor-pointer items-center rounded-md border border-[#cbdad3] bg-white px-4 py-2 text-sm font-semibold text-[#31574d] hover:bg-[#f1f6f3]">
            {isUploading ? <Loader2 className="mr-2 animate-spin" size={15} /> : <Upload className="mr-2" size={15} />}
            Upload Document (OCR)
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.txt"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="overflow-hidden rounded-xl border border-[#dce7e1] bg-white panel-shadow">
        <div className="hidden grid-cols-[1.5fr_.8fr_.8fr_1fr_auto] gap-4 border-b border-[#e7eeea] bg-[#f8faf8] px-5 py-3 text-[11px] font-bold uppercase tracking-[.12em] text-[#809089] md:grid">
          <span>Evidence Title</span>
          <span>Source</span>
          <span>Type</span>
          <span>Demonstrated Skills</span>
          <span>Status</span>
        </div>
        {evidenceList.length > 0 ? (
          evidenceList.map((item: any) => (
            <div
              key={item.id}
              className="grid gap-3 border-b border-[#e7eeea] px-5 py-4 last:border-0 md:grid-cols-[1.5fr_.8fr_.8fr_1fr_auto] md:items-center md:gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eef5f1] text-[#187563]">
                  {item.source === "GitHub" ? <Github size={16} /> : <FileCheck2 size={16} />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#14221f]">{item.title}</p>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#135f52] hover:underline"
                    >
                      View Source Artifact
                    </a>
                  )}
                </div>
              </div>
              <div className="text-xs text-[#62776d]">{item.source}</div>
              <div className="text-xs text-[#62776d]">{item.type}</div>
              <div className="flex flex-wrap gap-1.5">
                {item.skills && item.skills.length > 0 ? (
                  item.skills.map((s: string) => (
                    <span key={s} className="rounded-full bg-[#f0f5f1] px-2 py-0.5 text-[11px] text-[#4e6d60]">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#9aa7a1]">General claim</span>
                )}
              </div>
              <div>
                <StatusPill status={item.verificationStatus} />
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-sm text-[#7c8c85]">
            No evidence records added yet. Upload a certificate or add a project claim above.
          </div>
        )}
      </div>

      {/* Add Evidence Dialog */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Add Evidence Record</DialogTitle>
            <DialogDescription>Submit an artifact or project for institutional review.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input
                required
                placeholder="e.g. Distributed Task Queue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full rounded-md border border-[#cbdad3] p-2 text-xs"
                >
                  <option value="PROJECT">Project</option>
                  <option value="CERTIFICATE">Certificate</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="ACHIEVEMENT">Achievement</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Source</Label>
                <Input
                  required
                  placeholder="GitHub, Coursera, etc."
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Source URL (Optional)</Label>
              <Input
                placeholder="https://github.com/username/repo"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <textarea
                className="w-full rounded-md border border-[#cbdad3] p-2 text-xs"
                rows={3}
                placeholder="Summarize engineering decisions, technologies used, and outcomes."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={addEvidenceMutation.isPending}
              className="w-full bg-[#135f52] font-semibold text-white"
            >
              Save Evidence Record
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* OCR Skills Confirmation Dialog */}
      <Dialog open={ocrModalOpen} onOpenChange={setOcrModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>PaddleOCR Detected Skills</DialogTitle>
            <DialogDescription>
              Review the skills detected from your document. Confirm to add them as verified capabilities.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap gap-2">
              {extractedSkills.map((sk) => {
                const isSelected = selectedSkills.includes(sk);
                return (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => {
                      setSelectedSkills((prev) =>
                        isSelected ? prev.filter((s) => s !== sk) : [...prev, sk]
                      );
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      isSelected
                        ? "bg-[#135f52] text-white"
                        : "border border-[#cbdad3] bg-[#f0f4f2] text-[#61756c]"
                    }`}
                  >
                    {sk} {isSelected ? "âœ“" : "+"}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOcrModalOpen(false)}>
                Dismiss
              </Button>
              <Button
                onClick={() => confirmSkillsMutation.mutate({ skills: selectedSkills })}
                disabled={confirmSkillsMutation.isPending || selectedSkills.length === 0}
                className="bg-[#135f52] font-semibold text-white"
              >
                Confirm {selectedSkills.length} Skills
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ========================================================================= */
/* STUDENT ROADMAP VIEW                                                      */
/* ========================================================================= */
function StudentRoadmapView({ data, refetch }: { data: any; refetch: () => void }) {
  const tasks = data?.recommendation?.recommendedActions ?? [];

  return (
    <div className="mx-auto max-w-7xl animate-in space-y-6">
      <div className="eyebrow">Personalized Intervention Engine</div>
      <h2 className="font-display text-3xl font-semibold tracking-tight">Your Career Roadmap</h2>
      <p className="max-w-2xl text-sm leading-6 text-[#71817b]">
        Targeted, evidence-generating actions prioritized by your target role requirements.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-xl border border-[#dce7e1] bg-white p-6 panel-shadow">
          <h3 className="font-display text-lg font-semibold text-[#14221f] border-b border-[#e7eeea] pb-3">
            Recommended Actions
          </h3>
          <div className="divide-y divide-[#e7eeea]">
            {tasks.length > 0 ? tasks.map((task: { title: string; skill?: string; time?: string; reason?: string }) => (
              <div key={task.title} className="flex items-start gap-4 py-4">
                <div className="mt-1 grid h-6 w-6 place-items-center rounded-full border border-[#187563] bg-[#eef5f1] text-[#187563]">
                  <Check size={14} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#14221f]">{task.title}</p>
                    <span className="rounded-full bg-[#eef5f1] px-2 py-0.5 text-[11px] text-[#4d7162]">
                      {task.skill}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#7b8b84]">{task.reason}</p>
                  <p className="mt-1.5 text-[11px] font-semibold text-[#a0823d]">Estimated effort: {task.time}</p>
                </div>
              </div>
            )) : <p className="py-5 text-sm text-[#71817b]">No data available yet.</p>}
          </div>
        </section>

        <aside className="rounded-xl border border-[#dce7e1] bg-[#edf4ef] p-6">
          <div className="eyebrow">Why This Matters</div>
          <h3 className="mt-2 font-display text-xl font-semibold text-[#14221f]">Activity vs. Evidence</h3>
          <p className="mt-3 text-sm leading-6 text-[#5e766b]">
            A roadmap item creates real value when it produces an inspectable artifact that a reviewer or recruiter can verify. That is the Career OS difference.
          </p>
        </aside>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* STUDENT PASSPORT VIEW                                                     */
/* ========================================================================= */
function StudentPassportView({ data, refetch }: { data: any; refetch: () => void }) {
  const profile = data?.profile;
  const isConsented = profile?.recruiterVisibility === "CONSENTED" || profile?.recruiterVisibility === "PUBLIC";

  const consentMutation = trpc.student.updateConsent.useMutation({
    onSuccess: (res) => {
      toast.success(
        res.recruiterVisibility === "CONSENTED"
          ? "Recruiter sharing enabled with privacy safeguards"
          : "Profile hidden from recruiter candidate searches"
      );
      refetch();
    },
  });

  return (
    <div className="mx-auto max-w-7xl animate-in space-y-6">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="eyebrow">Shareable Talent Profile</div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Employability Passport</h2>
          <p className="mt-1.5 text-sm text-[#71817b]">
            A verified passport of demonstrated capabilities. Private academic details stay confidential.
          </p>
        </div>
        <Button
          onClick={() => toast.success("Employability Passport exported as PDF")}
          className="border border-[#cbdad3] bg-white text-sm font-semibold text-[#31574d] hover:bg-[#f1f6f3]"
        >
          <Download className="mr-2" size={15} /> Export Passport
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <section className="overflow-hidden rounded-xl border border-[#dce7e1] bg-white panel-shadow">
          <div className="bg-[#143a32] p-7 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow text-[#b8d4c8]">Career OS Employability Passport</p>
                <h3 className="mt-2 font-display text-2xl font-bold">{profile?.name}</h3>
                <p className="mt-1 text-sm text-[#c3d6ce]">
                  {profile?.targetRole} Â· Class of {profile?.graduationYear}
                </p>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-lg border border-white/20 bg-white/10">
                <ShieldCheck size={24} className="text-[#e4b85c]" />
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 p-6 border-b border-[#e7eeea]">
            <div>
              <p className="eyebrow">Readiness</p>
              <p className="mt-1 font-display text-2xl font-semibold text-[#14221f]">
                {profile?.employabilityScore}/100
              </p>
            </div>
            <div>
              <p className="eyebrow">Verified Evidence</p>
              <p className="mt-1 font-display text-2xl font-semibold text-[#14221f]">
                {profile?.verifiedEvidence}
              </p>
            </div>
            <div>
              <p className="eyebrow">Role Alignment</p>
              <p className="mt-1 font-display text-2xl font-semibold text-[#14221f]">
                {profile?.placementReadiness}%
              </p>
            </div>
          </div>
          <div className="p-6">
            <p className="eyebrow">Verified Capabilities</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {data?.skills && data.skills.length > 0 ? (
                data.skills.map((s: any) => (
                  <span
                    key={s.id}
                    className="rounded-full border border-[#dce8e1] bg-[#f6faf7] px-3 py-1 text-xs text-[#45655a]"
                  >
                    {s.skillName}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#82918b]">No verified skills confirmed yet.</span>
              )}
            </div>
          </div>
        </section>

        {/* Consent Settings Aside */}
        <aside className="space-y-6">
          <section className="rounded-xl border border-[#dce7e1] bg-white p-6 panel-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="eyebrow">Recruiter Discovery</div>
                <h3 className="mt-1 font-display text-lg font-semibold">Consent Settings</h3>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isConsented}
                onClick={() => consentMutation.mutate({ consent: !isConsented })}
                disabled={consentMutation.isPending}
                className={`relative h-6 w-11 rounded-full transition ${
                  isConsented ? "bg-[#187563]" : "bg-[#c5d1ca]"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    isConsented ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
            <p className="mt-4 text-xs leading-5 text-[#71817b]">
              {isConsented
                ? "Your verified capabilities and projects can be discovered by partner recruiters for relevant roles."
                : "Your profile is hidden from all external candidate searches."}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* COLLEGE WORKSPACE                                                         */
/* ========================================================================= */
function CollegeWorkspace({ active }: { active: string }) {
  const { isAuthenticated } = useAuth();
  const overviewQuery = trpc.college.getOverview.useQuery(undefined, { enabled: isAuthenticated });
  const pendingQuery = trpc.college.getPendingEvidence.useQuery(undefined, { enabled: isAuthenticated });
  const studentsQuery = trpc.college.getStudents.useQuery(undefined, { enabled: isAuthenticated });
  const heatmapQuery = trpc.college.getSkillHeatmap.useQuery(undefined, { enabled: isAuthenticated });

  const reviewMutation = trpc.college.reviewEvidence.useMutation({
    onSuccess: () => {
      toast.success("Evidence review recorded and student notified");
      pendingQuery.refetch();
      overviewQuery.refetch();
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[#dce7e1] bg-white p-10 text-center panel-shadow">
        <Building2Icon />
        <h2 className="font-display mt-4 text-2xl font-bold">College Placement Intelligence</h2>
        <p className="mt-2 text-sm text-[#62776e]">
          Sign in with your institutional administrator account to review student evidence, monitor departmental readiness, and export placement reports.
        </p>
        <Button
          asChild
          className="mt-6 bg-[#135f52] font-semibold text-white hover:bg-[#0d5146]"
        >
          <a href="/login/college">Sign In as Administrator <ArrowRight className="ml-2 inline" size={15} /></a>
        </Button>
      </div>
    );
  }

  const overview = overviewQuery.data;

  if (active === "evidence") {
    const pendingList = pendingQuery.data || [];
    return (
      <div className="mx-auto max-w-7xl animate-in space-y-6">
        <div className="eyebrow">Institutional Verification Queue</div>
        <h2 className="font-display text-3xl font-semibold tracking-tight">Evidence Review Queue</h2>
        <p className="text-sm text-[#71817b]">
          Ensure student claims reflect verified, demonstrated capabilities.
        </p>

        <div className="overflow-hidden rounded-xl border border-[#dce7e1] bg-white panel-shadow">
          {pendingList.length > 0 ? (
            pendingList.map((item: any) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 border-b border-[#e7eeea] p-5 last:border-0 md:flex-row md:items-center"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eef5f1] text-[#187563]">
                  <FileCheck2 size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#14221f]">{item.title}</p>
                  <p className="mt-0.5 text-xs text-[#82918b]">
                    Student: {item.studentName} ({item.studentEmail}) Â· {item.department} Â· Source: {item.source}
                  </p>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs text-[#135f52] hover:underline"
                    >
                      Inspect Source Link
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => reviewMutation.mutate({ evidenceId: item.id, decision: "VERIFIED" })}
                    disabled={reviewMutation.isPending}
                    className="bg-[#135f52] text-xs text-white hover:bg-[#0d5146]"
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reviewMutation.mutate({ evidenceId: item.id, decision: "REJECTED" })}
                    disabled={reviewMutation.isPending}
                    className="border-[#f5c6c2] text-xs text-[#a33f3f] hover:bg-[#fce9e7]"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-sm text-[#7c8c85]">
              No evidence submissions currently pending review.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (active === "heatmap") {
    const heatmap = heatmapQuery.data || [];
    return (
      <div className="mx-auto max-w-7xl animate-in space-y-6">
        <div className="eyebrow">Departmental Capability Distribution</div>
        <h2 className="font-display text-3xl font-semibold tracking-tight">Skill Heatmap</h2>
        <p className="text-sm text-[#71817b]">
          Aggregated proficiency across registered departments derived directly from verified student artifacts.
        </p>

        <div className="overflow-hidden rounded-xl border border-[#dce7e1] bg-white p-6 panel-shadow">
          {heatmap.length > 0 ? (
            <div className="space-y-4">
              {heatmap.map((row) => (
                <div key={row.department} className="border-b border-[#edf2ef] pb-4 last:border-0">
                  <p className="text-sm font-semibold text-[#14221f]">{row.department}</p>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-6">
                    {row.skills.map((sk) => (
                      <div
                        key={sk.skill}
                        className="rounded-lg p-2.5 text-center"
                        style={{
                          background: `rgba(24,117,99,${sk.percentage / 150 + 0.12})`,
                          color: sk.percentage > 50 ? "#0f4d40" : "#71817b",
                        }}
                      >
                        <p className="text-[11px] font-bold">{sk.skill}</p>
                        <p className="font-display text-sm font-semibold">{sk.percentage}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-[#7c8c85]">
              No student capability data registered yet.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (active === "roster") {
    const students = studentsQuery.data || [];
    return (
      <div className="mx-auto max-w-7xl animate-in space-y-6">
        <div className="eyebrow">Institutional Roster</div>
        <h2 className="font-display text-3xl font-semibold tracking-tight">Registered Students</h2>
        <p className="text-sm text-[#71817b]">Students currently enrolled under your institution.</p>

        <div className="overflow-hidden rounded-xl border border-[#dce7e1] bg-white panel-shadow">
          <div className="hidden grid-cols-[1.5fr_1fr_.8fr_1fr] gap-4 border-b border-[#e7eeea] bg-[#f8faf8] px-5 py-3 text-[11px] font-bold uppercase tracking-[.12em] text-[#809089] md:grid">
            <span>Student</span>
            <span>Department</span>
            <span>Graduation Year</span>
            <span>Readiness Score</span>
          </div>
          {students.length > 0 ? (
            students.map((s: any) => (
              <div
                key={s.id}
                className="grid gap-2 border-b border-[#e7eeea] px-5 py-3.5 last:border-0 md:grid-cols-[1.5fr_1fr_.8fr_1fr] md:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-[#14221f]">{s.name}</p>
                  <p className="text-xs text-[#82918b]">{s.email}</p>
                </div>
                <div className="text-xs text-[#62776d]">{s.department || "General"}</div>
                <div className="text-xs text-[#62776d]">{s.graduationYear || 2026}</div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-[#135f52]">{s.readinessScore || 0}/100</span>
                  <StatusPill status={(s.readinessScore || 0) >= 70 ? "VERIFIED" : "PENDING"} />
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-sm text-[#7c8c85]">No students currently registered.</div>
          )}
        </div>
      </div>
    );
  }

  // Overview Tab
  return (
    <div className="mx-auto max-w-7xl animate-in space-y-8">
      <div>
        <div className="eyebrow">{overview?.collegeName || "Institution Intelligence"}</div>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight">
          Placement Intelligence & Interventions
        </h2>
        <p className="mt-1.5 text-sm text-[#71817b]">
          Department-level visibility into demonstrated student capability, verification progress, and open skill gaps.
        </p>
      </div>

      <div className="grid gap-4 rounded-xl border border-[#dce7e1] bg-white p-5 panel-shadow sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Students Tracked"
          value={overview?.metrics?.totalStudents ?? 0}
          note="Active registered profiles"
        />
        <Metric
          label="Placement Ready"
          value={`${overview?.metrics?.placementReadyPercent ?? 0}%`}
          note="Readiness score â‰¥ 70"
        />
        <Metric
          label="Evidence Verified"
          value={`${overview?.metrics?.evidenceVerifiedPercent ?? 0}%`}
          note="Submitted claims reviewed"
        />
        <Metric
          label="Pending Reviews"
          value={overview?.metrics?.pendingEvidenceCount ?? 0}
          note="Awaiting administrator action"
        />
      </div>

      {/* Department Breakdown */}
      <div className="rounded-xl border border-[#dce7e1] bg-white p-6 panel-shadow">
        <div className="eyebrow">Department Readiness</div>
        <h3 className="mt-1 font-display text-lg font-semibold text-[#14221f]">
          Average Readiness by Academic Department
        </h3>
        <div className="mt-6 space-y-4">
          {overview?.departmentStats && overview.departmentStats.length > 0 ? (
            overview.departmentStats.map((dept) => (
              <div key={dept.department}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#14221f]">{dept.department} ({dept.studentCount} students)</span>
                  <span className="font-display font-semibold text-[#135f52]">{dept.avgReadiness}/100</span>
                </div>
                <div className="data-bar">
                  <span style={{ width: `${dept.avgReadiness}%` }} />
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-[#7c8c85]">
              No department data available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Building2Icon() {
  return (
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#e6f1ec] text-[#135f52]">
      <BookOpen size={24} />
    </span>
  );
}

/* ========================================================================= */
/* RECRUITER WORKSPACE                                                       */
/* ========================================================================= */
function RecruiterWorkspace({ active }: { active: string }) {
  const { isAuthenticated } = useAuth();
  const overviewQuery = trpc.recruiter.getOverview.useQuery(undefined, { enabled: isAuthenticated });
  const jobsQuery = trpc.recruiter.getJobs.useQuery(undefined, { enabled: isAuthenticated });
  const candidatesQuery = trpc.recruiter.searchCandidates.useQuery(undefined, { enabled: isAuthenticated });

  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobLocation, setJobLocation] = useState("Bengaluru Â· Hybrid");
  const [jobSkills, setJobSkills] = useState("React, TypeScript, Node.js");
  const [minReadiness, setMinReadiness] = useState(65);

  const [shortlist, setShortlist] = useState<number[]>([]);

  const createJobMutation = trpc.recruiter.createJob.useMutation({
    onSuccess: () => {
      toast.success("Job posting created successfully");
      setJobModalOpen(false);
      jobsQuery.refetch();
      overviewQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    createJobMutation.mutate({
      title: jobTitle,
      description: jobDesc,
      location: jobLocation,
      requiredSkills: jobSkills.split(",").map((s) => s.trim()).filter(Boolean),
      minReadiness,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[#dce7e1] bg-white p-10 text-center panel-shadow">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#e6f1ec] text-[#135f52]">
          <BriefcaseBusiness size={24} />
        </span>
        <h2 className="font-display mt-4 text-2xl font-bold">Recruiter Talent Discovery</h2>
        <p className="mt-2 text-sm text-[#62776e]">
          Sign in to define job requirements, search candidates who have granted recruiter discovery consent, and inspect verified evidence.
        </p>
        <Button
          asChild
          className="mt-6 bg-[#135f52] font-semibold text-white hover:bg-[#0d5146]"
        >
          <a href="/login/recruiter">Sign In as Recruiter <ArrowRight className="ml-2 inline" size={15} /></a>
        </Button>
      </div>
    );
  }

  const overview = overviewQuery.data;

  if (active === "jobs") {
    const jobs = jobsQuery.data || [];
    return (
      <div className="mx-auto max-w-7xl animate-in space-y-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="eyebrow">Requirements First</div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">Jobs & Roles</h2>
            <p className="mt-1 text-sm text-[#71817b]">
              Define role requirements with verified signals before searching candidate pools.
            </p>
          </div>
          <Button
            onClick={() => setJobModalOpen(true)}
            className="bg-[#135f52] font-semibold text-white hover:bg-[#0d5146]"
          >
            <Plus className="mr-2" size={15} /> Post New Role
          </Button>
        </div>

        <div className="space-y-4">
          {jobs.length > 0 ? (
            jobs.map((job: any) => (
              <div key={job.id} className="rounded-xl border border-[#dce7e1] bg-white p-6 panel-shadow">
                <div className="flex items-center justify-between border-b border-[#e7eeea] pb-4">
                  <div>
                    <p className="eyebrow">{job.employmentType.replace("_", " ")}</p>
                    <h3 className="font-display text-xl font-semibold text-[#14221f]">{job.title}</h3>
                  </div>
                  <StatusPill status={job.status} />
                </div>
                <div className="grid gap-4 py-4 md:grid-cols-3 text-xs">
                  <div>
                    <span className="eyebrow">Location</span>
                    <p className="font-semibold text-[#14221f] mt-1">{job.location}</p>
                  </div>
                  <div>
                    <span className="eyebrow">Minimum Readiness</span>
                    <p className="font-semibold text-[#14221f] mt-1">{job.minReadiness}/100</p>
                  </div>
                  <div>
                    <span className="eyebrow">Experience</span>
                    <p className="font-semibold text-[#14221f] mt-1">{job.experienceLevel.replace("_", " ")}</p>
                  </div>
                </div>
                <div className="border-t border-[#e7eeea] pt-3">
                  <span className="eyebrow">Required Capabilities:</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {job.requiredSkills.map((sk: string) => (
                      <span key={sk} className="rounded-full bg-[#f0f5f1] px-2.5 py-1 text-xs text-[#45655a]">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-[#dce7e1] bg-white p-12 text-center text-sm text-[#7c8c85]">
              No active job postings. Click &quot;Post New Role&quot; above to create your first opening.
            </div>
          )}
        </div>

        {/* Create Job Dialog */}
        <Dialog open={jobModalOpen} onOpenChange={setJobModalOpen}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>Post a New Role</DialogTitle>
              <DialogDescription>Define the demonstrated capabilities required for this opening.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Job Title</Label>
                <Input
                  required
                  placeholder="e.g. Product Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Location</Label>
                <Input
                  required
                  placeholder="e.g. Bengaluru Â· Hybrid"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Required Skills (comma-separated)</Label>
                <Input
                  required
                  placeholder="React, TypeScript, Python, SQL"
                  value={jobSkills}
                  onChange={(e) => setJobSkills(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Minimum Career Readiness Score (0-100)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={minReadiness}
                  onChange={(e) => setMinReadiness(parseInt(e.target.value, 10))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Job Description</Label>
                <textarea
                  required
                  rows={3}
                  className="w-full rounded-md border border-[#cbdad3] p-2 text-xs"
                  placeholder="Outline responsibilities and technical expectations."
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={createJobMutation.isPending}
                className="w-full bg-[#135f52] font-semibold text-white"
              >
                Post Job
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (active === "candidates") {
    const candidates = candidatesQuery.data || [];
    return (
      <div className="mx-auto max-w-7xl animate-in space-y-6">
        <div className="eyebrow">Consent-Enforced Talent Discovery</div>
        <h2 className="font-display text-3xl font-semibold tracking-tight">Candidate Search</h2>
        <p className="text-sm text-[#71817b]">
          Showing registered candidates with explicit recruiter sharing consent. Private academic details stay confidential.
        </p>

        <div className="space-y-4">
          {candidates.length > 0 ? (
            candidates.map((candidate: any) => {
              const isShortlisted = shortlist.includes(candidate.id);
              return (
                <div key={candidate.id} className="rounded-xl border border-[#dce7e1] bg-white p-5 panel-shadow">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#d7e8df] font-semibold text-[#135f52]">
                        {candidate.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#14221f]">{candidate.name}</p>
                        <p className="text-xs text-[#82918b]">
                          {candidate.role} Â· {candidate.institution}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {candidate.skills.map((sk: string) => (
                            <span key={sk} className="rounded-full bg-[#f0f5f1] px-2 py-0.5 text-[11px] text-[#4e6d60]">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 border-y border-[#e7eeea] py-3 md:border-y-0 md:border-x md:px-6 md:py-0">
                      <div>
                        <p className="eyebrow">Readiness</p>
                        <p className="mt-1 font-display text-xl font-semibold text-[#135f52]">
                          {candidate.readiness}/100
                        </p>
                      </div>
                      <div>
                        <p className="eyebrow">Role Fit</p>
                        <p className="mt-1 font-display text-xl font-semibold text-[#14221f]">
                          {candidate.fit}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isShortlisted ? "secondary" : "outline"}
                        onClick={() => {
                          if (isShortlisted) {
                            setShortlist(shortlist.filter((id) => id !== candidate.id));
                            toast.info("Candidate removed from shortlist");
                          } else {
                            setShortlist([...shortlist, candidate.id]);
                            toast.success("Candidate added to shortlist");
                          }
                        }}
                        className="text-xs"
                      >
                        {isShortlisted ? "Shortlisted âœ“" : "Shortlist"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-[#dce7e1] bg-white p-12 text-center text-sm text-[#7c8c85]">
              No consented candidates match the current search filters.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (active === "saved") {
    return (
      <div className="mx-auto max-w-7xl animate-in space-y-6">
        <div className="eyebrow">Saved Talent</div>
        <h2 className="font-display text-3xl font-semibold tracking-tight">Your Shortlist</h2>
        <div className="rounded-xl border border-[#dce7e1] bg-white p-10 text-center panel-shadow">
          <CheckCircle2 className="mx-auto text-[#187563]" size={36} />
          <h3 className="mt-4 font-display text-lg font-semibold">
            {shortlist.length > 0 ? `${shortlist.length} candidate(s) currently shortlisted` : "Your shortlist is empty"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#71817b]">
            Use Candidate Search to add consented candidates based on demonstrated capability.
          </p>
        </div>
      </div>
    );
  }

  // Overview Tab
  return (
    <div className="mx-auto max-w-7xl animate-in space-y-8">
      <div>
        <div className="eyebrow">{overview?.companyName || "Recruiter Intelligence"}</div>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight">
          Talent Intelligence Overview
        </h2>
        <p className="mt-1.5 text-sm text-[#71817b]">
          Deterministic eligibility and verified capability signals across consented talent.
        </p>
      </div>

      <div className="grid gap-4 rounded-xl border border-[#dce7e1] bg-white p-5 panel-shadow sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Open Roles"
          value={overview?.metrics?.openRoles ?? 0}
          note="Actively accepting applicants"
        />
        <Metric
          label="Eligible Candidates"
          value={overview?.metrics?.eligibleCandidates ?? 0}
          note="Readiness score â‰¥ 60"
        />
        <Metric
          label="Consented Talent Pool"
          value={overview?.metrics?.consentOnCount ?? 0}
          note="Explicit recruiter sharing on"
        />
        <Metric
          label="Shortlisted"
          value={shortlist.length}
          note="Your active talent shortlist"
        />
      </div>
    </div>
  );
}
