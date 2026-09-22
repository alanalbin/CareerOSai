import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  LockKeyhole,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  FileText,
  Github,
  Linkedin,
  GraduationCap,
  Briefcase,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function StudentPrivacyView() {
  const utils = trpc.useUtils();
  const privacyQuery = trpc.student.getPrivacySettings.useQuery();

  const [settings, setSettings] = useState({
    recruiters: true,
    linkedin: true,
    github: true,
    resume: true,
    academicDocs: false,
  });

  useEffect(() => {
    if (privacyQuery.data) {
      setSettings(privacyQuery.data);
    }
  }, [privacyQuery.data]);

  const updateMutation = trpc.student.updatePrivacySettings.useMutation({
    onSuccess: () => {
      toast.success("Privacy controls updated successfully.");
      utils.student.getPrivacySettings.invalidate();
      utils.student.getDashboardData.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to update privacy settings"),
  });

  const handleToggle = (key: keyof typeof settings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    updateMutation.mutate(updated);
  };

  if (privacyQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-[#135f52]" size={32} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl animate-in space-y-6">
      <div>
        <div className="eyebrow">Deterministic Granular Consent</div>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight">Data Access & Privacy</h2>
        <p className="mt-1.5 text-sm text-[#71817b]">
          You have granular control over what verified evidence, external profiles, and academic records are visible to external recruiters.
        </p>
      </div>

      <div className="rounded-xl border border-[#dce7e1] bg-white p-6 panel-shadow space-y-6">
        <div className="border-b border-[#e7eeea] pb-4">
          <h3 className="font-display text-lg font-semibold text-[#14221f]">Visibility Controls</h3>
          <p className="text-xs text-[#71817b]">
            Changes take effect immediately across all candidate search queries.
          </p>
        </div>

        <div className="divide-y divide-[#edf2ef] space-y-4">
          {/* Recruiters Discovery */}
          <div className="flex items-center justify-between pt-4 first:pt-0">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#e6f1ec] text-[#135f52] shrink-0 mt-0.5">
                <Briefcase size={18} />
              </span>
              <div>
                <p className="font-semibold text-sm text-[#14221f]">Recruiter Discovery</p>
                <p className="text-xs text-[#71817b] mt-0.5 max-w-md">
                  Allow verified corporate recruiters to discover your demonstrated skills and readiness score in candidate searches.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.recruiters}
              onCheckedChange={() => handleToggle("recruiters")}
              disabled={updateMutation.isPending}
            />
          </div>

          {/* LinkedIn Profile */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#e8f1f8] text-[#0a66c2] shrink-0 mt-0.5">
                <Linkedin size={18} />
              </span>
              <div>
                <p className="font-semibold text-sm text-[#14221f]">LinkedIn Profile Visibility</p>
                <p className="text-xs text-[#71817b] mt-0.5 max-w-md">
                  Expose your connected public LinkedIn profile URL to recruiters viewing your candidate passport.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.linkedin}
              onCheckedChange={() => handleToggle("linkedin")}
              disabled={updateMutation.isPending}
            />
          </div>

          {/* GitHub Repositories */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#f0f2f4] text-[#24292f] shrink-0 mt-0.5">
                <Github size={18} />
              </span>
              <div>
                <p className="font-semibold text-sm text-[#14221f]">GitHub Repositories & Statistics</p>
                <p className="text-xs text-[#71817b] mt-0.5 max-w-md">
                  Allow recruiters to view your verified GitHub project code, language distribution, and star ratings.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.github}
              onCheckedChange={() => handleToggle("github")}
              disabled={updateMutation.isPending}
            />
          </div>

          {/* Resume Documents */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#fbf3e6] text-[#b87c14] shrink-0 mt-0.5">
                <FileText size={18} />
              </span>
              <div>
                <p className="font-semibold text-sm text-[#14221f]">Resume & Certificate Documents</p>
                <p className="text-xs text-[#71817b] mt-0.5 max-w-md">
                  Grant recruiters access to download and review your OCR-verified resume file and professional certificates.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.resume}
              onCheckedChange={() => handleToggle("resume")}
              disabled={updateMutation.isPending}
            />
          </div>

          {/* Academic Transcripts */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#fce9e7] text-[#a33f3f] shrink-0 mt-0.5">
                <GraduationCap size={18} />
              </span>
              <div>
                <p className="font-semibold text-sm text-[#14221f]">Academic Transcripts & Grades</p>
                <p className="text-xs text-[#71817b] mt-0.5 max-w-md">
                  Keep private GPA, term reports, and institutional records confidential unless explicitly required.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.academicDocs}
              onCheckedChange={() => handleToggle("academicDocs")}
              disabled={updateMutation.isPending}
            />
          </div>
        </div>

        <div className="rounded-lg bg-[#f6faf7] border border-[#cbe1d5] p-4 text-xs text-[#31574d] flex items-center gap-3">
          <ShieldCheck size={20} className="shrink-0 text-[#187563]" />
          <div>
            <span className="font-semibold">Career OS Privacy Guarantee:</span> Unconsented candidate data is never sold, indexed, or accessible to unauthenticated third parties.
          </div>
        </div>
      </div>
    </div>
  );
}
