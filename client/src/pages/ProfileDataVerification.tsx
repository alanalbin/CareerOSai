import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle, XCircle, FileText, Github, Linkedin, Building2, User, ChevronLeft, Loader2, RefreshCw, Sparkles, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function ProfileDataVerification() {
  const { user, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login/student",
  });

  const matrixQuery = trpc.verification.getMatrix.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();

  // Review Dialog State
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedField, setSelectedField] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [resolvedValue, setResolvedValue] = useState("");
  const [resolutionReason, setResolutionReason] = useState("");

  const resolveMutation = trpc.verification.resolveDiscrepancy.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setReviewOpen(false);
      utils.verification.getMatrix.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to resolve discrepancy.");
    },
  });

  const handleOpenReview = (field: string, val: string) => {
    setSelectedField(field);
    setCurrentValue(val);
    setResolvedValue(val !== "â€”" ? val : "");
    setResolutionReason("");
    setReviewOpen(true);
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedValue.trim()) {
      toast.error("Please enter the verified value.");
      return;
    }
    if (!resolutionReason.trim()) {
      toast.error("Please provide a reason for the discrepancy resolution.");
      return;
    }

    resolveMutation.mutate({
      field: selectedField,
      newValue: resolvedValue,
      reason: resolutionReason,
    });
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#e3f4ec] text-[#0f5f4f] border border-[#bce4d3]">
            <CheckCircle2 size={12} /> Verified
          </span>
        );
      case "CONSISTENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#eaf4f0] text-[#135f52] border border-[#d2e8dd]">
            <ShieldCheck size={12} /> Consistent
          </span>
        );
      case "PARTIALLY_VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#fef7e9] text-[#935f0a] border border-[#fae2b8]">
            <HelpCircle size={12} /> Partially Verified
          </span>
        );
      case "MISMATCH":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#fdeeee] text-[#b91c1c] border border-[#f8c8c8]">
            <XCircle size={12} /> Mismatch
          </span>
        );
      case "NEEDS_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#fff4e5] text-[#b45309] border border-[#fed7aa]">
            <AlertTriangle size={12} /> Needs Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#f0f3f1] text-[#63756e]">
            <HelpCircle size={12} /> Unable to Verify
          </span>
        );
    }
  };

  const matrixData = matrixQuery.data?.matrix || [];
  const summary = matrixQuery.data?.summary || { total: 0, consistent: 0, needsReview: 0 };
  const accounts = matrixQuery.data?.connectedAccounts;

  return (
    <div className="min-h-screen bg-[#f7f8f5] flex flex-col">
      {/* Top Header */}
      <header className="border-b border-[#dfe8e2]/80 bg-[#f7f8f5]/95 backdrop-blur px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/student" className="p-2 rounded-lg hover:bg-[#eaf2ee] transition text-[#5f706a]">
              <ChevronLeft size={18} />
            </Link>
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Career OS Logo" className="h-8 w-auto object-contain" />
              <div>
                <h1 className="font-display text-base font-bold text-[#14221f]">
                  Profile Data & Verification
                </h1>
                <p className="text-[11px] text-[#62776e]">
                  Cross-source consistency analysis and credential verification matrix
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => matrixQuery.refetch()}
              disabled={matrixQuery.isFetching}
              className="text-xs border-[#cbdad3] text-[#31574d] hover:bg-white"
            >
              <RefreshCw size={13} className={`mr-1.5 ${matrixQuery.isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link
              href="/student"
              className="rounded-md bg-[#135f52] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0d5146] transition"
            >
              Back to Student Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-5 py-8 space-y-8 animate-in">
        {/* Source Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-[#dce7e1] p-5 panel-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#62776e]">Career OS Account</span>
              <User size={16} className="text-[#135f52]" />
            </div>
            <p className="mt-2 text-xl font-bold font-display text-[#14221f]">
              {user ? `${user.firstName} ${user.lastName}` : "Active"}
            </p>
            <span className="mt-1 inline-block text-[11px] font-semibold text-[#135f52] bg-[#eaf4f0] px-2 py-0.5 rounded">
              Primary Identity
            </span>
          </div>

          <div className="bg-white rounded-xl border border-[#dce7e1] p-5 panel-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#62776e]">PaddleOCR Extractor</span>
              <FileText size={16} className="text-[#135f52]" />
            </div>
            <p className="mt-2 text-xl font-bold font-display text-[#14221f]">
              Document Text
            </p>
            <span className="mt-1 inline-block text-[11px] text-[#62776e]">
              Confidence: 88% - 98%
            </span>
          </div>

          <div className="bg-white rounded-xl border border-[#dce7e1] p-5 panel-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#62776e]">Connected GitHub</span>
              <Github size={16} className="text-[#14221f]" />
            </div>
            <p className="mt-2 text-xl font-bold font-display text-[#14221f]">
              {accounts?.github ? `@${accounts.githubData?.username}` : "Not Connected"}
            </p>
            <span className={`mt-1 inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
              accounts?.github ? "bg-[#eaf4f0] text-[#135f52]" : "bg-[#f4f4f2] text-[#71817b]"
            }`}>
              {accounts?.github ? `${accounts.githubData?.publicRepos} Public Repos` : "Connect in Portal"}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-[#dce7e1] p-5 panel-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#62776e]">Connected LinkedIn</span>
              <Linkedin size={16} className="text-[#0a66c2]" />
            </div>
            <p className="mt-2 text-xl font-bold font-display text-[#14221f]">
              {accounts?.linkedin ? "Profile Linked" : "Not Connected"}
            </p>
            <span className={`mt-1 inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
              accounts?.linkedin ? "bg-[#eaf4f0] text-[#135f52]" : "bg-[#f4f4f2] text-[#71817b]"
            }`}>
              {accounts?.linkedin ? "Authorized Link" : "Connect in Portal"}
            </span>
          </div>
        </div>

        {/* Verification Matrix Section */}
        <div className="bg-white rounded-2xl border border-[#dce7e1] p-6 panel-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8eeeb] pb-5">
            <div>
              <div className="eyebrow text-[#135f52]">Cross-Source Verification Matrix</div>
              <h2 className="font-display text-xl font-bold text-[#14221f] mt-1">
                Field-by-Field Evidence Comparison
              </h2>
              <p className="text-xs text-[#62776e] mt-0.5">
                Compares actual verified data across Career OS, PaddleOCR extractions, LinkedIn, GitHub, and College records.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-bold text-[#135f52]">{summary.consistent} of {summary.total}</span>
                <p className="text-[10px] text-[#71817b]">Consistent or Verified</p>
              </div>
              {summary.needsReview > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#fef2e8] text-[#c25e00] border border-[#fbd38d]">
                  {summary.needsReview} Need Review
                </span>
              )}
            </div>
          </div>

          {matrixQuery.isLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="animate-spin mx-auto text-[#135f52]" size={30} />
              <p className="text-xs text-[#62776e] mt-3">Analyzing cross-source evidence...</p>
            </div>
          ) : matrixData.length === 0 ? (
            <div className="py-16 text-center">
              <ShieldCheck className="mx-auto text-[#9fb3a9]" size={36} />
              <p className="text-sm font-semibold text-[#14221f] mt-3">No verification data available yet.</p>
              <p className="text-xs text-[#62776e] mt-1">
                Upload your resume, connect GitHub, and add projects to generate the verification matrix.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e8eeeb] text-[11px] font-bold uppercase tracking-wider text-[#73837c] bg-[#f8faf8]">
                    <th className="py-3 px-4">Field</th>
                    <th className="py-3 px-4">Career OS</th>
                    <th className="py-3 px-4">OCR (Resume)</th>
                    <th className="py-3 px-4">LinkedIn</th>
                    <th className="py-3 px-4">GitHub</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2ef]">
                  {matrixData.map((row) => (
                    <tr key={row.field} className="hover:bg-[#f9fbf9] transition">
                      <td className="py-3.5 px-4 font-semibold text-[#14221f]">
                        {row.field}
                        <div className="flex gap-1 mt-1">
                          {row.sources.map((src) => (
                            <span key={src} className="text-[9px] px-1.5 py-0.2 rounded bg-[#eef4f0] text-[#4d695d] font-medium">
                              {src}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#2d4039] max-w-[160px] truncate" title={row.careerOsValue}>
                        {row.careerOsValue}
                      </td>
                      <td className="py-3.5 px-4 text-[#50665e] max-w-[160px] truncate" title={row.ocrValue}>
                        {row.ocrValue}
                      </td>
                      <td className="py-3.5 px-4 text-[#50665e] max-w-[140px] truncate" title={row.linkedinValue}>
                        {row.linkedinValue}
                      </td>
                      <td className="py-3.5 px-4 text-[#50665e] max-w-[140px] truncate" title={row.githubValue}>
                        {row.githubValue}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(row.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {(row.status === "NEEDS_REVIEW" || row.status === "MISMATCH" || row.status === "PARTIALLY_VERIFIED") ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReview(row.field, row.careerOsValue)}
                            className="text-[11px] h-7 px-2.5 border-[#cbdad3] text-[#135f52] hover:bg-[#eaf4f0]"
                          >
                            Review
                          </Button>
                        ) : (
                          <span className="text-[11px] text-[#97a8a0]">â€”</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Explanatory Note on OCR Confidence & Truthfulness */}
        <div className="rounded-xl border border-[#d8e3dc] bg-[#f0f6f2] p-4 text-xs text-[#4e6d60] flex items-start gap-3">
          <ShieldCheck size={20} className="shrink-0 text-[#135f52] mt-0.5" />
          <div>
            <p className="font-semibold text-[#14221f]">About Credential Verification & OCR Confidence</p>
            <p className="mt-1 leading-relaxed">
              OCR confidence measures the mathematical extraction fidelity of characters from uploaded documents, not the legal or factual truthfulness of claims. Fields marked as <strong>Verified</strong> have been confirmed by institutional faculty review or direct API integrations. Discrepancies between sources are flagged for human review and recorded into an immutable audit trail.
            </p>
          </div>
        </div>
      </main>

      {/* Human Review Resolution Modal */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-md bg-white border border-[#dce7e1] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-[#14221f]">
              Resolve Discrepancy: {selectedField}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#62776e]">
              Correct conflicting values across sources. All changes are logged into the institutional audit trail with your timestamp and stated reason.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResolveSubmit} className="space-y-4 mt-3">
            <div>
              <Label className="text-xs font-semibold text-[#324b42]">Current Stored Value</Label>
              <div className="p-2.5 rounded-lg bg-[#f7f9f8] border border-[#e2ebe6] text-xs text-[#62776e] mt-1 font-medium">
                {currentValue || "No value stored"}
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-[#324b42]">Verified Correct Value</Label>
              <Input
                type="text"
                required
                value={resolvedValue}
                onChange={(e) => setResolvedValue(e.target.value)}
                placeholder="Enter correct value..."
                className="mt-1 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-[#324b42]">Resolution Reason / Supporting Document</Label>
              <Input
                type="text"
                required
                value={resolutionReason}
                onChange={(e) => setResolutionReason(e.target.value)}
                placeholder="e.g. Official graduation certificate confirms 2026."
                className="mt-1 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#edf2ef]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReviewOpen(false)}
                className="text-xs border-[#cbdad3]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={resolveMutation.isPending}
                className="bg-[#135f52] text-white hover:bg-[#0d5146] text-xs font-semibold"
              >
                {resolveMutation.isPending ? "Resolving..." : "Confirm & Log to Audit Trail"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[#81928b] border-t border-[#dfe8e2]/60 mt-12">
        <p>Â© 2026 Career OS â€” AI-Powered Student Employability & Profile Platform</p>
      </footer>
    </div>
  );
}
