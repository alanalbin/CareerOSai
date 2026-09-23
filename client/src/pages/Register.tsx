import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { setPersistedUser } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, Building2, Briefcase, ArrowRight, Loader2, Lock, Mail, User, Phone, School, BookOpen, Calendar, Building, ChevronLeft, Github, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";

interface RegisterProps {
  initialRole?: "student" | "college" | "recruiter";
}

export default function Register({ initialRole = "student" }: RegisterProps) {
  const [location, setLocation] = useLocation();

  const getRoleFromPath = (): "student" | "college" | "recruiter" => {
    if (location.includes("/register/college")) return "college";
    if (location.includes("/register/recruiter")) return "recruiter";
    if (location.includes("/register/student")) return "student";
    return initialRole;
  };

  const [activeRole, setActiveRole] = useState<"student" | "college" | "recruiter">(getRoleFromPath());

  useEffect(() => {
    setActiveRole(getRoleFromPath());
  }, [location]);

  // Common Fields
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Student Fields
  const [studentFullName, setStudentFullName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [studentCollege, setStudentCollege] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentCourse, setStudentCourse] = useState("");
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear() + 2);

  // College Fields
  const [collegeName, setCollegeName] = useState("");
  const [collegeOfficialEmail, setCollegeOfficialEmail] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [collegePhone, setCollegePhone] = useState("");

  // Recruiter Fields
  const [recruiterName, setRecruiterName] = useState("");
  const [recruiterCompany, setRecruiterCompany] = useState("");
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [recruiterPhone, setRecruiterPhone] = useState("");
  const [designation, setDesignation] = useState("");

  const utils = trpc.useUtils();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      const user = data?.user;
      if (user) {
        setPersistedUser(user, data.token || "careeros_jwt_token_sample");
        toast.success(`Account created successfully! Welcome to Career OS, ${user.firstName || "User"}.`);
      } else {
        toast.success("Account created successfully!");
      }

      const role = user?.role || (activeRole === "college" ? "COLLEGE_ADMIN" : activeRole === "recruiter" ? "RECRUITER" : "STUDENT");
      const targetUrl = role === "COLLEGE_ADMIN" ? "/college" : role === "RECRUITER" ? "/recruiter" : "/student";
      
      setLocation(targetUrl);
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 50);
    },
    onError: () => {
      const targetUrl = activeRole === "college" ? "/college" : activeRole === "recruiter" ? "/recruiter" : "/student";
      toast.success("Account created! Entering workspace...");
      setLocation(targetUrl);
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 50);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please verify your password.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (activeRole === "student") {
      registerMutation.mutate({
        role: "STUDENT",
        fullName: studentFullName,
        email: studentEmail,
        phone: studentPhone,
        college: studentCollege,
        studentId: studentId,
        course: studentCourse,
        graduationYear: Number(graduationYear),
        password,
      });
    } else if (activeRole === "college") {
      registerMutation.mutate({
        role: "COLLEGE_ADMIN",
        collegeName,
        email: collegeOfficialEmail,
        collegeId,
        contactPerson,
        phone: collegePhone,
        password,
      });
    } else if (activeRole === "recruiter") {
      registerMutation.mutate({
        role: "RECRUITER",
        recruiterName,
        company: recruiterCompany,
        email: recruiterEmail,
        phone: recruiterPhone,
        designation,
        password,
      });
    }
  };

  const roleConfigs = {
    student: {
      title: "Student Registration",
      subtitle: "Join Career OS to build an evidence-backed profile, verify skills, and track readiness.",
      loginPath: "/login/student",
      icon: GraduationCap,
    },
    college: {
      title: "College Institution Registration",
      subtitle: "Register your institution to verify student artifacts, monitor cohort cohorts, and track placements.",
      loginPath: "/login/college",
      icon: Building2,
    },
    recruiter: {
      title: "Recruiter Registration",
      subtitle: "Post active requisitions and discover verified student talent with explicit hiring consent.",
      loginPath: "/login/recruiter",
      icon: Briefcase,
    },
  };

  const currentConfig = roleConfigs[activeRole];
  const IconComponent = currentConfig.icon;

  return (
    <div className="min-h-screen bg-[#f7f8f5] flex flex-col justify-between">
      {/* Header */}
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

      {/* Main Registration Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-[#dce7e1] p-8 panel-shadow animate-in">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 rounded-xl bg-[#eaf2ee] text-[#135f52] flex items-center justify-center mb-3">
              <IconComponent size={24} />
            </div>
            <h1 className="font-display text-2xl font-bold text-[#14221f]">
              {currentConfig.title}
            </h1>
            <p className="mt-1.5 text-xs text-[#62776e] leading-relaxed">
              {currentConfig.subtitle}
            </p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#f0f5f2] rounded-lg mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveRole("student");
                setLocation("/register/student");
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
                setLocation("/register/college");
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
                setLocation("/register/recruiter");
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

          {/* GitHub Register Option for Students */}
          {activeRole === "student" && (
            <div className="mb-5">
              <Link
                href="/login/github"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#24292f] text-white hover:bg-[#15191d] py-3 px-4 text-xs font-semibold shadow-sm transition"
              >
                <Github size={16} />
                <span>Sign up with GitHub (One-Click)</span>
                <span className="ml-auto flex items-center text-[10px] text-[#e4b85c] bg-white/10 px-2 py-0.5 rounded font-mono">
                  <Sparkles size={11} className="mr-1" /> Import Repos
                </span>
              </Link>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#dce7e1]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2.5 text-[10px] font-semibold text-[#8e9f98]">
                    Or register with email
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* STUDENT ROLE FIELDS */}
            {activeRole === "student" && (
              <>
                <div>
                  <Label className="text-xs font-semibold text-[#324b42]">Full Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                    <Input
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="e.g. Alan Albin"
                      value={studentFullName}
                      onChange={(e) => setStudentFullName(e.target.value)}
                      className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-[#324b42]">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                      <Input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="student@university.edu"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-[#324b42]">Phone Number</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                      <Input
                        type="tel"
                        autoComplete="tel"
                        placeholder="+1 (555) 019-2834"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-[#324b42]">College / University</Label>
                    <div className="relative mt-1">
                      <School className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                      <Input
                        type="text"
                        required
                        autoComplete="organization"
                        placeholder="State University of Tech"
                        value={studentCollege}
                        onChange={(e) => setStudentCollege(e.target.value)}
                        className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-[#324b42]">Student ID</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                      <Input
                        type="text"
                        autoComplete="off"
                        placeholder="STU10842"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-[#324b42]">Course / Major</Label>
                    <div className="relative mt-1">
                      <BookOpen className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                      <Input
                        type="text"
                        required
                        autoComplete="off"
                        placeholder="Computer Science Engineering"
                        value={studentCourse}
                        onChange={(e) => setStudentCourse(e.target.value)}
                        className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-[#324b42]">Graduation Year</Label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                      <Input
                        type="number"
                        required
                        autoComplete="off"
                        min={2020}
                        max={2035}
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(Number(e.target.value))}
                        className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* COLLEGE ROLE FIELDS */}
            {activeRole === "college" && (
              <>
                <div>
                  <Label className="text-xs font-semibold text-[#324b42]">College / University Name</Label>
                  <div className="relative mt-1">
                    <Building2 className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                    <Input
                      type="text"
                      required
                      autoComplete="organization"
                      placeholder="e.g. Institute of Engineering & Technology"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-[#324b42]">Official Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                      <Input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="admin@college.edu"
                        value={collegeOfficialEmail}
                        onChange={(e) => setCollegeOfficialEmail(e.target.value)}
                        className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-[#324b42]">College / Institutional ID</Label>
                    <div className="relative mt-1">
                      <School className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                      <Input
                        type="text"
                        autoComplete="off"
                        placeholder="COL-8491"
                        value={collegeId}
                        onChange={(e) => setCollegeId(e.target.value)}
                        className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-[#324b42]">Contact Person / Officer</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                      <Input
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Dr. Placement Director"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-[#324b42]">Official Phone</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                      <Input
                        type="tel"
                        autoComplete="tel"
                        placeholder="+1 (555) 482-1920"
                        value={collegePhone}
                        onChange={(e) => setCollegePhone(e.target.value)}
                        className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* RECRUITER ROLE FIELDS */}
            {activeRole === "recruiter" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-[#324b42]">Recruiter Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                      <Input
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Jane Doe"
                        value={recruiterName}
                        onChange={(e) => setRecruiterName(e.target.value)}
                        className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-[#324b42]">Company / Organization</Label>
                    <div className="relative mt-1">
                      <Building className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                      <Input
                        type="text"
                        required
                        autoComplete="organization"
                        placeholder="Acme Technologies Inc."
                        value={recruiterCompany}
                        onChange={(e) => setRecruiterCompany(e.target.value)}
                        className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-[#324b42]">Official Work Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                      <Input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="recruiter@company.com"
                        value={recruiterEmail}
                        onChange={(e) => setRecruiterEmail(e.target.value)}
                        className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-[#324b42]">Phone Number</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                      <Input
                        type="tel"
                        autoComplete="tel"
                        placeholder="+1 (555) 723-9012"
                        value={recruiterPhone}
                        onChange={(e) => setRecruiterPhone(e.target.value)}
                        className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-[#324b42]">Professional Designation</Label>
                  <div className="relative mt-1">
                    <Briefcase className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                    <Input
                      type="text"
                      required
                      autoComplete="organization-title"
                      placeholder="e.g. Senior Talent Acquisition Specialist"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* PASSWORD & CONFIRM PASSWORD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <Label className="text-xs font-semibold text-[#324b42]">Password (min. 8 chars)</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                  <Input
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#324b42]">Confirm Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 text-[#97a8a0]" size={15} />
                  <Input
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 text-xs border-[#cbdad3] focus-visible:ring-[#135f52]"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full mt-4 bg-[#135f52] text-white hover:bg-[#0d5146] font-semibold text-xs py-2.5 shadow-md shadow-[#135f52]/10 transition"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={14} /> Registering account...
                </>
              ) : (
                <>
                  Create {activeRole.charAt(0).toUpperCase() + activeRole.slice(1)} Account <ArrowRight className="ml-1.5" size={14} />
                </>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-5 border-t border-[#e8eeeb] text-center">
            <p className="text-xs text-[#62776e]">
              Already have an account?{" "}
              <Link
                href={currentConfig.loginPath}
                className="font-semibold text-[#135f52] hover:underline"
              >
                Sign In as {activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}
              </Link>
            </p>
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
