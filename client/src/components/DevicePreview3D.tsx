import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Sparkles, ShieldCheck, CheckCircle2, Award, ArrowUpRight } from "lucide-react";

interface DevicePreview3DProps {
  className?: string;
}

export default function DevicePreview3D({ className = "" }: DevicePreview3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !cardRef.current) return;

    // Smooth subtle entrance animation with GSAP
    gsap.fromTo(
      cardRef.current,
      {
        opacity: 0,
        y: 40,
        rotateX: 12,
        scale: 0.94,
      },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        scale: 1,
        duration: 1.2,
        ease: "power3.out",
      }
    );
  }, [prefersReducedMotion]);

  // Subtle interactive 3D mouse parallax tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotX = -(y / (rect.height / 2)) * 8;
    const rotY = (x / (rect.width / 2)) * 8;

    setRotate({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative ${className}`}
      style={{ perspective: "1200px" }}
    >
      <div
        ref={cardRef}
        className="soft-shadow overflow-hidden rounded-2xl border border-[#d7e3dc] bg-white transition-transform duration-300 ease-out will-change-transform"
        style={{
          transform: prefersReducedMotion
            ? "none"
            : `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateZ(12px)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Top App Header Bar */}
        <div className="flex items-center justify-between border-b border-[#e8eeeb] px-6 py-4 bg-[#fafcfa]">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-[#e85e5e]" />
            <span className="h-3 w-3 rounded-full bg-[#f4be4f]" />
            <span className="h-3 w-3 rounded-full bg-[#60c454]" />
            <span className="ml-2 font-display text-xs font-semibold text-[#14221f]">
              Career OS · Passport View
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e5f1ec] px-2.5 py-1 text-[11px] font-semibold text-[#176b5a]">
            <ShieldCheck size={13} /> Live Verified
          </span>
        </div>

        {/* 3D Content Grid */}
        <div className="grid gap-0 md:grid-cols-[.9fr_1.1fr]">
          {/* Left: Mathematical Score Radial Ring */}
          <div className="border-b border-[#e8eeeb] p-6 md:border-b-0 md:border-r bg-gradient-to-b from-white to-[#fbfdfb]">
            <p className="eyebrow text-[#135f52]">Readiness Index</p>
            <div className="relative mx-auto mt-4 grid h-44 w-44 place-items-center rounded-full bg-[#f3f7f5] shadow-inner">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "conic-gradient(#135f52 0deg 295deg, #e4ece7 295deg 360deg)",
                }}
              />
              <div className="absolute inset-3 rounded-full bg-white grid place-items-center shadow-sm">
                <div className="text-center">
                  <div className="font-display text-4xl font-bold tracking-tight text-[#14221f]">
                    82
                  </div>
                  <div className="text-[11px] font-semibold text-[#73837c]">/ 100 Verified</div>
                </div>
              </div>
            </div>
            <div className="mt-5 text-center">
              <span className="text-xs font-semibold text-[#204d41] bg-[#eef5f1] px-2.5 py-1 rounded-full">
                High Employability Tier
              </span>
              <p className="mt-1.5 text-[11px] text-[#73837c]">
                Calculated across 4 audited credential pillars
              </p>
            </div>
          </div>

          {/* Right: Real Verified Signals Breakdown */}
          <div className="p-6 bg-white flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-bold text-[#14221f]">Credential Pillars</span>
                <span className="text-[11px] text-[#89968f]">Deterministic Weights</span>
              </div>
              <div className="space-y-3.5">
                {[
                  ["Project Portfolio", 92, "30%"],
                  ["Academic Performance", 84, "25%"],
                  ["Document Verification", 80, "25%"],
                  ["Platform Skill Depth", 72, "20%"],
                ].map(([label, value, weight]) => (
                  <div key={label as string}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-[#556961] font-medium">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#8da097]">{weight}</span>
                        <span className="font-bold text-[#135f52]">{value}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#edf2ef] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#135f52] transition-all duration-700"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Insight Pill */}
            <div className="mt-5 rounded-xl border border-[#e1ece5] bg-[#f8faf8] p-3">
              <div className="flex items-center gap-2 text-xs text-[#31574d]">
                <Sparkles size={14} className="text-[#d29e38] shrink-0" />
                <p className="text-[11px] leading-relaxed">
                  Cross-verified with <strong>GitHub Repos</strong> and <strong>PaddleOCR Transcripts</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
