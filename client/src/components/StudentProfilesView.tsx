import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Github,
  Linkedin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  ShieldCheck,
  Star,
  GitFork,
  ArrowRight,
  Database
} from "lucide-react";

export default function StudentProfilesView() {
  const utils = trpc.useUtils();
  const profilesQuery = trpc.student.getProfessionalProfiles.useQuery();

  // Auto-Resume Modal
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [resumeMarkdown, setResumeMarkdown] = useState("");
  
  const generateResumeMutation = trpc.student.generateResume.useMutation({
    onSuccess: (data) => {
      setResumeMarkdown(data.resumeMarkdown);
      toast.success("Resume generated successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate resume.");
    }
  });

  const handleGenerateResume = () => {
    setResumeModalOpen(true);
    if (!resumeMarkdown) {
      generateResumeMutation.mutate();
    }
  };

  // GitHub Modal
  const [ghModalOpen, setGhModalOpen] = useState(false);
  const [ghUsername, setGhUsername] = useState("");

  // LinkedIn Modal
  const [liModalOpen, setLiModalOpen] = useState(false);
  const [liUrl, setLiUrl] = useState("");

  const connectGithubMutation = trpc.student.connectGithub.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setGhModalOpen(false);
      setGhUsername("");
      utils.student.getProfessionalProfiles.invalidate();
      utils.student.getDashboardData.invalidate();
      utils.verification.getMatrix.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to connect GitHub profile.");
    },
  });

  const disconnectGithubMutation = trpc.student.disconnectGithub.useMutation({
    onSuccess: () => {
      toast.success("GitHub disconnected successfully.");
      utils.student.getProfessionalProfiles.invalidate();
      utils.student.getDashboardData.invalidate();
      utils.verification.getMatrix.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const connectLinkedinMutation = trpc.student.connectLinkedin.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setLiModalOpen(false);
      setLiUrl("");
      utils.student.getProfessionalProfiles.invalidate();
      utils.student.getDashboardData.invalidate();
      utils.verification.getMatrix.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to connect LinkedIn profile.");
    },
  });

  const disconnectLinkedinMutation = trpc.student.disconnectLinkedin.useMutation({
    onSuccess: () => {
      toast.success("LinkedIn disconnected successfully.");
      utils.student.getProfessionalProfiles.invalidate();
      utils.student.getDashboardData.invalidate();
      utils.verification.getMatrix.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const profiles = profilesQuery.data;
  const github = profiles?.github;
  const linkedin = profiles?.linkedin;

  const handleConnectGithub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghUsername.trim()) return;
    connectGithubMutation.mutate({ username: ghUsername.trim() });
  };

  const handleConnectLinkedin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liUrl.trim()) return;
    connectLinkedinMutation.mutate({ profileUrl: liUrl.trim() });
  };

  if (profilesQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-[#135f52]" size={32} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl animate-in space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="eyebrow">Connected Identity & Artifacts</div>
          <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight">Professional Profiles</h2>
          <p className="mt-1.5 text-sm text-[#71817b]">
            Connect your official external accounts to import verified code repositories, demonstrated technologies, and public career history.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateResume}
            className="inline-flex items-center gap-2 rounded-lg bg-[#6366f1] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4f46e5]"
          >
            <Sparkles size={15} /> Auto-Generate Resume
          </Button>
          <Link
            href="/student/profile-data"
            className="inline-flex items-center gap-2 rounded-lg bg-[#135f52] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0d5146]"
          >
            <Database size={15} /> Open Profile Data & Verification <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* GitHub Card */}
        <section className="rounded-xl border border-[#dce7e1] bg-white p-6 panel-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b border-[#e7eeea] pb-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#24292f] text-white">
                  <Github size={22} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-[#14221f]">GitHub Integration</h3>
                  <p className="text-xs text-[#71817b]">Source: Official GitHub REST API</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  github
                    ? "bg-[#e5f1ec] text-[#176b5a] border border-[#c4ded4]"
                    : "bg-[#eef2f0] text-[#64756e] border border-[#d6e0db]"
                }`}
              >
                {github ? "Connected" : "Not connected"}
              </span>
            </div>

            {github ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-[#f7f9f8] p-3 border border-[#dce7e1]">
                  <div>
                    <span className="eyebrow">GitHub Username</span>
                    <p className="font-semibold text-sm text-[#14221f]">@{github.username}</p>
                    <p className="text-[11px] text-[#71817b] mt-0.5">
                      Last synced: {new Date(github.connectedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <a
                    href={github.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#135f52] hover:underline"
                  >
                    View Profile <ExternalLink size={13} />
                  </a>
                </div>

                {/* GitHub Metadata Stats */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-[#e7eeea] p-3 bg-white">
                    <span className="eyebrow">Public Repositories</span>
                    <p className="font-display text-xl font-semibold text-[#14221f] mt-1">
                      {github.data?.public_repos ?? (github.data?.repos?.length || 0)}
                    </p>
                    <p className="text-[11px] text-[#71817b]">Live from GitHub API</p>
                  </div>
                  <div className="rounded-lg border border-[#e7eeea] p-3 bg-white">
                    <span className="eyebrow">Followers</span>
                    <p className="font-display text-xl font-semibold text-[#14221f] mt-1">
                      {github.data?.followers ?? 0}
                    </p>
                    <p className="text-[11px] text-[#71817b]">Verified audience</p>
                  </div>
                </div>

                {/* Recent Repositories */}
                {github.data?.repos && github.data.repos.length > 0 ? (
                  <div>
                    <span className="eyebrow">Sample Public Repositories</span>
                    <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
                      {github.data.repos.slice(0, 4).map((repo: any) => (
                        <div key={repo.name} className="rounded-lg border border-[#e7eeea] p-3 bg-white text-xs">
                          <div className="flex items-center justify-between">
                            <a
                              href={repo.html_url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-[#135f52] hover:underline"
                            >
                              {repo.name}
                            </a>
                            {repo.language && (
                              <span className="rounded bg-[#f0f5f1] px-2 py-0.5 text-[10px] font-semibold text-[#31574d]">
                                {repo.language}
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-[11px] text-[#657770] mt-1 line-clamp-1">{repo.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-[#86958e] mt-1.5">
                            <span className="flex items-center gap-1">
                              <Star size={11} /> {repo.stargazers_count ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <GitFork size={11} /> {repo.forks_count ?? 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#71817b]">No public repositories detected on this profile.</p>
                )}
              </div>
            ) : (
              <div className="mt-6 py-6 text-center">
                <p className="text-sm text-[#71817b] max-w-sm mx-auto">
                  Not connected. Connect your GitHub account to import and cross-verify repositories, languages, and technical contributions.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-[#e7eeea] pt-4">
            {github ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnectGithubMutation.mutate()}
                disabled={disconnectGithubMutation.isPending}
                className="w-full border-[#f5c6c2] text-xs text-[#a33f3f] hover:bg-[#fce9e7]"
              >
                {disconnectGithubMutation.isPending ? <Loader2 className="mr-1.5 animate-spin" size={14} /> : <Trash2 className="mr-1.5" size={14} />}
                Disconnect GitHub
              </Button>
            ) : (
              <Button
                onClick={() => setGhModalOpen(true)}
                className="w-full bg-[#24292f] text-xs font-semibold text-white hover:bg-[#1a1e22]"
              >
                <Plus className="mr-1.5" size={14} /> Connect GitHub
              </Button>
            )}
          </div>
        </section>

        {/* LinkedIn Card */}
        <section className="rounded-xl border border-[#dce7e1] bg-white p-6 panel-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b border-[#e7eeea] pb-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0a66c2] text-white">
                  <Linkedin size={22} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-[#14221f]">LinkedIn Integration</h3>
                  <p className="text-xs text-[#71817b]">Source: LinkedIn Public Profile</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  linkedin
                    ? "bg-[#e5f1ec] text-[#176b5a] border border-[#c4ded4]"
                    : "bg-[#eef2f0] text-[#64756e] border border-[#d6e0db]"
                }`}
              >
                {linkedin ? "Connected" : "Not connected"}
              </span>
            </div>

            {linkedin ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-lg bg-[#f7f9f8] p-3 border border-[#dce7e1]">
                  <span className="eyebrow">Profile URL</span>
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-semibold text-sm text-[#14221f] truncate max-w-[280px]">
                      {linkedin.profileUrl}
                    </p>
                    <a
                      href={linkedin.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a66c2] hover:underline"
                    >
                      View Profile <ExternalLink size={13} />
                    </a>
                  </div>
                  <p className="text-[11px] text-[#71817b] mt-1">
                    Connected: {new Date(linkedin.connectedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="rounded-lg border border-[#e7eeea] p-4 bg-white text-xs space-y-2">
                  <div className="flex items-center gap-2 text-[#187563] font-semibold">
                    <CheckCircle2 size={16} /> URL Verified with Student Identity
                  </div>
                  <p className="text-[#657770] text-[11px] leading-relaxed">
                    Where authorized LinkedIn member APIs are connected, positions, education, and credentials are automatically compared with college records in the Verification Matrix.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 py-6 text-center">
                <p className="text-sm text-[#71817b] max-w-sm mx-auto">
                  Not connected. Connect your LinkedIn profile to cross-reference educational institutions, degrees, and career timeline.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-[#e7eeea] pt-4">
            {linkedin ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnectLinkedinMutation.mutate()}
                disabled={disconnectLinkedinMutation.isPending}
                className="w-full border-[#f5c6c2] text-xs text-[#a33f3f] hover:bg-[#fce9e7]"
              >
                {disconnectLinkedinMutation.isPending ? <Loader2 className="mr-1.5 animate-spin" size={14} /> : <Trash2 className="mr-1.5" size={14} />}
                Disconnect LinkedIn
              </Button>
            ) : (
              <Button
                onClick={() => setLiModalOpen(true)}
                className="w-full bg-[#0a66c2] text-xs font-semibold text-white hover:bg-[#084e96]"
              >
                <Plus className="mr-1.5" size={14} /> Connect LinkedIn
              </Button>
            )}
          </div>
        </section>
      </div>

      {/* Connect GitHub Dialog */}
      <Dialog open={ghModalOpen} onOpenChange={setGhModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Connect GitHub Profile</DialogTitle>
            <DialogDescription>
              Enter your public GitHub username. We fetch public repositories, language statistics, and stars via the official GitHub API without requesting your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConnectGithub} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">GitHub Username</Label>
              <Input
                required
                placeholder="e.g. torvalds or your-username"
                value={ghUsername}
                onChange={(e) => setGhUsername(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={connectGithubMutation.isPending}
              className="w-full bg-[#135f52] font-semibold text-white"
            >
              {connectGithubMutation.isPending ? <Loader2 className="mr-2 animate-spin" size={15} /> : <Github className="mr-2" size={15} />}
              Verify & Connect GitHub
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Connect LinkedIn Dialog */}
      <Dialog open={liModalOpen} onOpenChange={setLiModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Connect LinkedIn Profile</DialogTitle>
            <DialogDescription>
              Enter your public LinkedIn profile URL. We will link this profile to your Career OS identity for recruiter verification.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConnectLinkedin} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">LinkedIn Profile URL</Label>
              <Input
                required
                type="url"
                placeholder="https://linkedin.com/in/your-profile"
                value={liUrl}
                onChange={(e) => setLiUrl(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={connectLinkedinMutation.isPending}
              className="w-full bg-[#0a66c2] font-semibold text-white hover:bg-[#084e96]"
            >
              {connectLinkedinMutation.isPending ? <Loader2 className="mr-2 animate-spin" size={15} /> : <Linkedin className="mr-2" size={15} />}
              Link LinkedIn Profile
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Auto-Resume Dialog */}
      <Dialog open={resumeModalOpen} onOpenChange={setResumeModalOpen}>
        <DialogContent className="sm:max-w-3xl bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="text-[#6366f1]" size={20} /> 
              AI Auto-Generated Resume
            </DialogTitle>
            <DialogDescription>
              This resume was intelligently structured by AI based on your connected GitHub repositories, LinkedIn profile, verified skills, and academic records.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 border border-[#e7eeea] rounded-xl p-6 bg-[#fafafa]">
            {generateResumeMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#71817b]">
                <Loader2 className="animate-spin text-[#6366f1] mb-3" size={32} />
                <p className="font-medium text-sm">Analyzing your digital footprints...</p>
                <p className="text-xs mt-1">Extracting skills, assessing projects, and drafting bullets.</p>
              </div>
            ) : resumeMarkdown ? (
              <pre className="whitespace-pre-wrap font-sans text-sm text-[#14221f]">
                {resumeMarkdown}
              </pre>
            ) : (
              <div className="py-8 text-center text-sm text-[#71817b]">
                No resume generated yet.
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setResumeModalOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(resumeMarkdown);
                toast.success("Resume copied to clipboard!");
              }}
              disabled={!resumeMarkdown || generateResumeMutation.isPending}
              className="bg-[#135f52] hover:bg-[#0d5146] text-white"
            >
              <FileText className="mr-2" size={15} /> Copy Markdown
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
