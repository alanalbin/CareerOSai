import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import DevicePreview3D from "@/components/DevicePreview3D";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  ClipboardCheck,
  Github,
  GraduationCap,
  Menu,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  X,
  User,
  LogIn,
  Building2,
  Briefcase
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";

const roles = [
  { title: "Student portal", copy: "Turn your work into a clear, evidence-backed career story.", href: "/student", icon: GraduationCap },
  { title: "College intelligence", copy: "See readiness across departments and act before placement season.", href: "/college", icon: BarChart3 },
  { title: "Recruiter workspace", copy: "Find relevant, consented talent by demonstrated capability.", href: "/recruiter", icon: UsersRound },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const userWorkspaceLink = user?.role === "STUDENT" ? "/student" : user?.role === "COLLEGE_ADMIN" ? "/college" : "/recruiter";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f8f5] text-[#14221f]">
      <header className="sticky top-0 z-40 border-b border-[#dfe8e2]/80 bg-[#f7f8f5]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Career OS home">
            <img
              src="/logo.svg"
              alt="Career OS"
              className="h-10 w-auto object-contain transition-transform hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold tracking-tight text-[#14221f]">
                Career OS<span className="text-[#135f52]">.</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#688177]">
                Intelligence Platform
              </span>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-[#5f706a] md:flex" aria-label="Main navigation">
            <a href="#how-it-works" className="transition-colors hover:text-[#135f52]">How it works</a>
            <a href="#for-teams" className="transition-colors hover:text-[#135f52]">For teams</a>
            <a href="#passport" className="transition-colors hover:text-[#135f52]">Employability Passport</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link href={userWorkspaceLink} asChild>
                  <motion.a whileHover={{ rotateX: 2, rotateY: -2, scale: 1.02, z: 20 }} transition={{ type: "spring", stiffness: 300 }}
                    className="flex items-center gap-2 rounded-md bg-[#eaf2ee] px-3.5 py-2 text-xs font-semibold text-[#135f52] hover:bg-[#dce9e3]"
                  >
                    <User size={14} />
                    <span>{user.firstName} ({user.role.replace("_", " ")})</span>
                  </motion.a>
                </Link>
                <Link href={userWorkspaceLink} asChild>
                  <motion.a whileHover={{ rotateX: 2, rotateY: -2, scale: 1.02, z: 20 }} transition={{ type: "spring", stiffness: 300 }}
                    className="rounded-md bg-[#135f52] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d5146]"
                  >
                    Go to Workspace <ArrowRight className="ml-1 inline" size={15} />
                  </motion.a>
                </Link>
              </div>
            ) : (
              <>
                {/* Clear Login Dropdown Option */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold text-[#135f52] transition hover:bg-[#e7f0ec]">
                    <LogIn size={15} />
                    <span>Login</span>
                    <ChevronDown size={14} className="opacity-70" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white p-1.5 shadow-xl border border-[#dce7e1]">
                    <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#73837c]">
                      Choose your portal
                    </div>
                    <DropdownMenuItem
                      onClick={() => setLocation("/login/github")}
                      className="cursor-pointer gap-2.5 py-2 text-xs font-medium hover:bg-[#f0f6f3] border-b border-[#eef4f1] mb-1"
                    >
                      <Github size={16} className="text-[#24292f]" />
                      <div>
                        <p className="font-semibold text-[#14221f] flex items-center gap-1.5">
                          GitHub Login <span className="text-[9px] bg-[#e4b85c] text-[#30220c] font-bold px-1.5 py-0.2 rounded">Analyze Data</span>
                        </p>
                        <p className="text-[11px] text-[#73837c]">Codebase & repo audit</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setLocation("/login/student")}
                      className="cursor-pointer gap-2.5 py-2 text-xs font-medium hover:bg-[#f0f6f3]"
                    >
                      <GraduationCap size={16} className="text-[#135f52]" />
                      <div>
                        <p className="font-semibold text-[#14221f]">Student Login</p>
                        <p className="text-[11px] text-[#73837c]">Access student workspace</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setLocation("/login/college")}
                      className="cursor-pointer gap-2.5 py-2 text-xs font-medium hover:bg-[#f0f6f3]"
                    >
                      <Building2 size={16} className="text-[#135f52]" />
                      <div>
                        <p className="font-semibold text-[#14221f]">College Login</p>
                        <p className="text-[11px] text-[#73837c]">Institution administration</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setLocation("/login/recruiter")}
                      className="cursor-pointer gap-2.5 py-2 text-xs font-medium hover:bg-[#f0f6f3]"
                    >
                      <Briefcase size={16} className="text-[#135f52]" />
                      <div>
                        <p className="font-semibold text-[#14221f]">Recruiter Login</p>
                        <p className="text-[11px] text-[#73837c]">Talent search & jobs</p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Registration Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md bg-[#135f52] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d5146]">
                    <span>Get started</span>
                    <ChevronDown size={14} className="opacity-80" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white p-1.5 shadow-xl border border-[#dce7e1]">
                    <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#73837c]">
                      Create new account
                    </div>
                    <DropdownMenuItem
                      onClick={() => setLocation("/register/student")}
                      className="cursor-pointer gap-2.5 py-2 text-xs font-medium hover:bg-[#f0f6f3]"
                    >
                      <GraduationCap size={16} className="text-[#135f52]" />
                      <div>
                        <p className="font-semibold text-[#14221f]">Student Account</p>
                        <p className="text-[11px] text-[#73837c]">Track career readiness</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setLocation("/register/college")}
                      className="cursor-pointer gap-2.5 py-2 text-xs font-medium hover:bg-[#f0f6f3]"
                    >
                      <Building2 size={16} className="text-[#135f52]" />
                      <div>
                        <p className="font-semibold text-[#14221f]">College Partner</p>
                        <p className="text-[11px] text-[#73837c]">Register college portal</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setLocation("/register/recruiter")}
                      className="cursor-pointer gap-2.5 py-2 text-xs font-medium hover:bg-[#f0f6f3]"
                    >
                      <Briefcase size={16} className="text-[#135f52]" />
                      <div>
                        <p className="font-semibold text-[#14221f]">Recruiter Account</p>
                        <p className="text-[11px] text-[#73837c]">Hire demonstrated talent</p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
          <button className="rounded-md p-2 md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-[#dfe8e2] px-5 py-4 md:hidden bg-white">
            <div className="flex flex-col gap-3 text-sm">
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-[#5f706a]">How it works</a>
              <a href="#for-teams" onClick={() => setMenuOpen(false)} className="text-[#5f706a]">For teams</a>
              <a href="#passport" onClick={() => setMenuOpen(false)} className="text-[#5f706a]">Employability Passport</a>
              
              <div className="my-2 border-t border-[#edf2ef] pt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#73837c]">Access Portals</p>
                <div className="mt-2 space-y-1">
                  <Link href="/login/github" onClick={() => setMenuOpen(false)} asChild>
                    <motion.a whileHover={{ rotateX: 2, rotateY: -2, scale: 1.02, z: 20 }} transition={{ type: "spring", stiffness: 300 }}
                      className="flex items-center gap-2 py-1.5 font-semibold text-[#14221f]"
                    >
                      <Github size={16} /> GitHub Login (Analyze Data)
                    </motion.a>
                  </Link>
                  <Link href="/login/student" onClick={() => setMenuOpen(false)} asChild>
                    <motion.a whileHover={{ rotateX: 2, rotateY: -2, scale: 1.02, z: 20 }} transition={{ type: "spring", stiffness: 300 }}
                      className="flex items-center gap-2 py-1.5 font-semibold text-[#135f52]"
                    >
                      <GraduationCap size={16} /> Student Login
                    </motion.a>
                  </Link>
                  <Link href="/login/college" onClick={() => setMenuOpen(false)} asChild>
                    <motion.a whileHover={{ rotateX: 2, rotateY: -2, scale: 1.02, z: 20 }} transition={{ type: "spring", stiffness: 300 }}
                      className="flex items-center gap-2 py-1.5 font-semibold text-[#135f52]"
                    >
                      <Building2 size={16} /> College Login
                    </motion.a>
                  </Link>
                  <Link href="/login/recruiter" onClick={() => setMenuOpen(false)} asChild>
                    <motion.a whileHover={{ rotateX: 2, rotateY: -2, scale: 1.02, z: 20 }} transition={{ type: "spring", stiffness: 300 }}
                      className="flex items-center gap-2 py-1.5 font-semibold text-[#135f52]"
                    >
                      <Briefcase size={16} /> Recruiter Login
                    </motion.a>
                  </Link>
                </div>
              </div>

              {isAuthenticated ? (
                <Link href={userWorkspaceLink} onClick={() => setMenuOpen(false)} asChild>
                  <motion.a whileHover={{ rotateX: 2, rotateY: -2, scale: 1.02, z: 20 }} transition={{ type: "spring", stiffness: 300 }} className="rounded-md bg-[#135f52] p-2.5 text-center font-semibold text-white">
                    Go to Workspace
                  </motion.a>
                </Link>
              ) : (
                <Link href="/register/student" onClick={() => setMenuOpen(false)} asChild>
                  <motion.a whileHover={{ rotateX: 2, rotateY: -2, scale: 1.02, z: 20 }} transition={{ type: "spring", stiffness: 300 }} className="rounded-md bg-[#135f52] p-2.5 text-center font-semibold text-white">
                    Get Started (Student)
                  </motion.a>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="overflow-hidden">
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="app-grid relative overflow-hidden border-b border-[#dfe8e2]">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 lg:grid-cols-[.92fr_1.08fr] lg:px-8 lg:pb-28 lg:pt-24">
            <div className="animate-in max-w-xl self-center">
              <div className="eyebrow mb-6 flex items-center gap-2">
                <span className="h-px w-7 bg-[#d29e38]" /> CAREER READINESS INTELLIGENCE
              </div>
              <h1 className="font-display text-5xl font-semibold leading-[1.06] tracking-[-.045em] text-[#14221f] md:text-6xl">
                Measure skills.<br />
                <span className="text-[#135f52]">Discover gaps.</span><br />
                Build your career.
              </h1>
              <p className="mt-7 max-w-lg text-lg leading-8 text-[#5f706a]">
                An evidence-based career readiness platform that helps students understand what they can demonstrate — backed by real academic records, verified artifacts, and transparent intelligence.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                {isAuthenticated ? (
                  <Link href={userWorkspaceLink} asChild>
                    <motion.a whileHover={{ rotateX: 2, rotateY: -2, scale: 1.02, z: 20 }} transition={{ type: "spring", stiffness: 300 }}
                      className="rounded-md bg-[#135f52] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#135f52]/15 transition hover:-translate-y-0.5 hover:bg-[#0d5146]"
                    >
                      Open my workspace <ArrowRight className="ml-2 inline" size={16} />
                    </motion.a>
                  </Link>
                ) : (
                  <Link href="/register/student" asChild>
                    <motion.a whileHover={{ rotateX: 2, rotateY: -2, scale: 1.02, z: 20 }} transition={{ type: "spring", stiffness: 300 }}
                      className="rounded-md bg-[#135f52] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#135f52]/15 transition hover:-translate-y-0.5 hover:bg-[#0d5146]"
                    >
                      Check my readiness <ArrowRight className="ml-2 inline" size={16} />
                    </motion.a>
                  </Link>
                )}
                <a
                  href="#how-it-works"
                  className="rounded-md border border-[#cbdad3] bg-white/50 px-5 py-3.5 text-sm font-semibold text-[#31574d] transition hover:bg-white"
                >
                  Explore platform
                </a>
              </div>
              <div className="mt-10 flex items-center gap-5 text-xs text-[#72847d]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-[#135f52]" /> Verified evidence
                </span>
                <span className="flex items-center gap-1.5">
                  <ClipboardCheck size={15} className="text-[#135f52]" /> Explainable scoring
                </span>
              </div>
            </div>
            
            {/* Apple-inspired 3D Interactive Device & Card Preview */}
            <DevicePreview3D className="animate-in [animation-delay:120ms] lg:pl-4" />
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="mx-auto max-w-7xl px-5 py-20 lg:px-8" id="how-it-works">
          <div className="max-w-2xl">
            <div className="eyebrow">From raw data to readiness</div>
            <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              A better signal for the work beyond the transcript.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#64756e]">
              Career OS brings scattered proof of capability into one explainable profile — so a student knows what to work on, a college knows where to intervene, and a recruiter knows what they are seeing.
            </p>
          </div>
          <div className="mt-12 grid border-y border-[#dce7e1] md:grid-cols-4">
            {[
              ["01", "Collect", "Academic, project, certification, internship, and OCR document data."],
              ["02", "Validate", "Keep source, hash, and human verification status attached to every claim."],
              ["03", "Map", "Compare demonstrated capability with the requirements of a target role."],
              ["04", "Improve", "Turn gaps into a focused roadmap and reassess as new evidence arrives."],
            ].map(([num, title, copy]) => (
              <div key={num} className="border-b border-[#dce7e1] p-6 last:border-0 md:border-b-0 md:border-r md:last:border-r-0">
                <div className="font-display text-sm font-semibold text-[#d29e38]">{num}</div>
                <h3 className="mt-10 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#71817b]">{copy}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="border-y border-[#dce7e1] bg-[#edf3ef]" id="for-teams">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <div className="eyebrow">One shared evidence layer</div>
                <h2 className="font-display mt-4 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
                  Different perspectives. One trusted profile.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#64756e]">
                Built for the students, administrators, and hiring teams who value demonstrated capability.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3" style={{ perspective: "1000px" }}>
              {roles.map(({ title, copy, href, icon: Icon }) => (
                <Link key={href} href={href} asChild>
                  <motion.a whileHover={{ rotateX: 2, rotateY: -2, scale: 1.02, z: 20 }} transition={{ type: "spring", stiffness: 300 }}
                    className="group rounded-xl border border-[#d5e2da] bg-white p-6 transition-all hover:-translate-y-1 hover:border-[#a8c6b9] hover:shadow-xl relative"
                  >
                    <div className="flex items-start justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#e6f1ec] text-[#135f52]">
                        <Icon size={19} />
                      </span>
                      <ArrowRight size={18} className="text-[#9aaba3] transition group-hover:translate-x-1 group-hover:text-[#135f52]" />
                    </div>
                    <h3 className="mt-12 font-display text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#6f8079]">{copy}</p>
                  </motion.a>
                </Link>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8" id="passport">
          <div>
            <div className="eyebrow">Employability Passport</div>
            <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              The story behind the score.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#64756e]">
              A shareable profile that keeps evidence, consent, verification, skill signals, and career direction together — designed to be actionable in interviews, not just on paper.
            </p>
            <ul className="mt-7 space-y-3 text-sm text-[#49635a]">
              {[
                "Evidence is always linked with its source and verification status.",
                "Students control recruiter sharing consent at all times.",
                "Public view separates demonstrated work from private academic transcripts.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check size={17} className="mt-0.5 shrink-0 text-[#187563]" /> {item}
                </li>
              ))}
            </ul>
            <Link
              href="/student"
              className="mt-8 inline-flex items-center rounded-md border border-[#bfd3c8] bg-white px-4 py-3 text-sm font-semibold text-[#135f52] hover:bg-[#f0f6f2]"
            >
              Explore Employability Passport <ArrowRight className="ml-2" size={15} />
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-[#d6e2db] bg-white p-6 soft-shadow">
            <div className="flex items-center justify-between border-b border-[#e8eeeb] pb-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#135f52] text-white">
                  <GraduationCap size={17} />
                </span>
                <div>
                  <p className="text-sm font-semibold">Candidate Passport</p>
                  <p className="text-xs text-[#7e8d87]">Target Role · Class of 2026</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#187563]">
                <ShieldCheck size={14} /> Consent-enabled
              </span>
            </div>
            <div className="grid gap-4 py-5 sm:grid-cols-3">
              <div>
                <p className="eyebrow">Readiness</p>
                <p className="mt-2 font-display text-3xl font-semibold">
                  78<span className="text-base text-[#8a9a93]">/100</span>
                </p>
              </div>
              <div>
                <p className="eyebrow">Verified Claims</p>
                <p className="mt-2 font-display text-3xl font-semibold">08</p>
              </div>
              <div>
                <p className="eyebrow">Role Alignment</p>
                <p className="mt-2 font-display text-3xl font-semibold">84%</p>
              </div>
            </div>
            <div className="border-t border-[#e8eeeb] pt-4">
              <p className="eyebrow">Demonstrated skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Python", "React", "FastAPI", "OCR", "SQL", "AWS", "Communication"].map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-[#dce8e1] bg-[#f6faf7] px-2.5 py-1 text-xs text-[#45655a]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="bg-[#143a32] text-white">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 py-16 md:flex-row md:items-center lg:px-8">
            <div>
              <div className="eyebrow text-[#b8d4c8]">Start with a clearer signal</div>
              <h2 className="font-display mt-4 max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
                Your next opportunity deserves more than one number.
              </h2>
            </div>
            {isAuthenticated ? (
              <Link
                href={userWorkspaceLink}
                className="inline-flex shrink-0 items-center rounded-md bg-[#e4b85c] px-5 py-3.5 text-sm font-semibold text-[#30220c] hover:bg-[#f0c86f]"
              >
                Go to Workspace <ArrowRight className="ml-2" size={16} />
              </Link>
            ) : (
              <button
                onClick={() => startLogin("register", "STUDENT")}
                className="inline-flex shrink-0 items-center rounded-md bg-[#e4b85c] px-5 py-3.5 text-sm font-semibold text-[#30220c] hover:bg-[#f0c86f]"
              >
                Get Started Now <ArrowRight className="ml-2" size={16} />
              </button>
            )}
          </div>
        </motion.section>
      </main>
      <footer className="border-t border-[#dce7e1] bg-[#f7f8f5]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-[#75857e] md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© 2026 Career OS — Career Readiness Intelligence Platform</p>
          <p className="flex items-center gap-2">
            <Github size={14} /> Built for evidence, not optics <ChevronDown size={13} />
          </p>
        </div>
      </footer>
    </div>
  );
}
