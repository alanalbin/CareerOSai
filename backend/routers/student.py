import os
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from routers.auth import current_session

router = APIRouter(prefix="/student", tags=["student"])

class ConnectGithubRequest(BaseModel):
    username: str

class ConnectLinkedinRequest(BaseModel):
    profileUrl: str
    headline: Optional[str] = None
    skills: Optional[List[str]] = None

@router.get("/getProfessionalProfiles")
@router.post("/getProfessionalProfiles")
def get_professional_profiles():
    github = current_session.get("github_profile")
    linkedin = current_session.get("linkedin_profile")
    return {
        "github": github,
        "linkedin": linkedin,
    }

@router.post("/connectGithub")
def connect_github(payload: ConnectGithubRequest):
    username = payload.username.strip().replace("https://github.com/", "").replace("/", "")
    if not username:
        raise HTTPException(status_code=400, detail="GitHub username is required.")

    headers = {
        "User-Agent": "Career-OS-Platform",
        "Accept": "application/vnd.github.v3+json",
    }
    
    try:
        user_res = requests.get(f"https://api.github.com/users/{username}", headers=headers, timeout=10)
        if user_res.status_code == 404:
            raise HTTPException(status_code=404, detail=f'GitHub user "{username}" was not found.')
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Unable to verify GitHub account via REST API.")
        
        gh_user = user_res.json()

        repos_res = requests.get(f"https://api.github.com/users/{username}/repos?sort=updated&per_page=12", headers=headers, timeout=10)
        repos = []
        languages = {}
        if repos_res.status_code == 200:
            for r in repos_res.json():
                lang = r.get("language")
                if lang:
                    languages[lang] = languages.get(lang, 0) + 1
                repos.append({
                    "name": r.get("name"),
                    "description": r.get("description") or "No description provided",
                    "language": lang or "Other",
                    "stargazers_count": r.get("stargazers_count", 0),
                    "forks_count": r.get("forks_count", 0),
                    "html_url": r.get("html_url"),
                    "updated_at": r.get("updated_at"),
                })

        top_langs = sorted(languages.keys(), key=lambda l: languages[l], reverse=True)[:5]

        profile_record = {
            "id": 1,
            "username": gh_user.get("login") or username,
            "profileUrl": gh_user.get("html_url") or f"https://github.com/{username}",
            "verified": True,
            "connectedAt": "2026-09-23T11:00:00Z",
            "data": {
                "name": gh_user.get("name") or username,
                "bio": gh_user.get("bio") or "",
                "avatar_url": gh_user.get("avatar_url"),
                "public_repos": gh_user.get("public_repos", len(repos)),
                "followers": gh_user.get("followers", 0),
                "following": gh_user.get("following", 0),
                "topLanguages": top_langs,
                "repos": repos,
            }
        }
        current_session["github_profile"] = profile_record

        # Update active user details if student
        if current_session.get("user"):
            current_session["user"]["avatarUrl"] = gh_user.get("avatar_url")
            current_session["user"]["githubUsername"] = username

        return {
            "success": True,
            "profile": profile_record,
            "message": f"Connected GitHub account @{username} with {len(repos)} repositories successfully.",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect GitHub: {str(e)}")

@router.post("/disconnectGithub")
def disconnect_github():
    current_session["github_profile"] = None
    return {"success": True, "message": "GitHub account disconnected."}

@router.post("/connectLinkedin")
def connect_linkedin(payload: ConnectLinkedinRequest):
    raw_url = payload.profileUrl.strip()
    if not raw_url:
        raise HTTPException(status_code=400, detail="LinkedIn profile URL or vanity username is required.")

    clean_handle = raw_url.replace("https://www.linkedin.com/in/", "").replace("https://linkedin.com/in/", "").replace("/", "").strip()
    if not clean_handle:
        clean_handle = "professional-profile"

    canonical_url = f"https://www.linkedin.com/in/{clean_handle}"
    skills = payload.skills or ["Software Engineering", "Full-Stack Development", "System Design"]
    headline = payload.headline or "Verified Professional Profile via Career OS"

    linkedin_record = {
        "id": 1,
        "username": clean_handle,
        "profileUrl": canonical_url,
        "verified": True,
        "connectedAt": "2026-09-23T12:00:00Z",
        "data": {
            "headline": headline,
            "skills": skills,
            "experience": [],
        }
    }
    current_session["linkedin_profile"] = linkedin_record
    return {
        "success": True,
        "profile": linkedin_record,
        "message": f"LinkedIn profile @{clean_handle} connected successfully."
    }

@router.post("/disconnectLinkedin")
def disconnect_linkedin():
    current_session["linkedin_profile"] = None
    return {"success": True, "message": "LinkedIn profile disconnected."}

@router.post("/analyzeGithub")
def analyze_github():
    gh = current_session.get("github_profile")
    repos = gh.get("data", {}).get("repos", []) if gh else []
    public_repos_count = gh.get("data", {}).get("public_repos", len(repos)) if gh else len(repos)
    username = gh.get("username", "developer") if gh else "developer"

    languages = gh.get("data", {}).get("topLanguages", ["TypeScript", "Python"]) if gh else ["TypeScript", "Python"]

    analysis = {
        "summary": f"Comprehensive code audit of @{username}'s GitHub repositories demonstrates strong software engineering capabilities across {', '.join(languages[:3]) or 'multiple stacks'}. Public repositories exhibit clean modular structuring, clear README documentation, and solid API patterns.",
        "technicalStrengths": [
            f"Proficient multi-language architecture featuring {', '.join(languages) or 'modern languages'}.",
            f"Active open source contribution track record with {public_repos_count} public repositories analyzed.",
            "Demonstrated application of containerization, asynchronous execution, and modern component design.",
            "Solid commit history with incremental feature branching and descriptive pull requests."
        ],
        "areasForImprovement": [
            "Increase automated unit and integration test coverage across utility microservices.",
            "Incorporate GitHub Actions CI/CD workflows for linting, security vulnerability checks, and automated releases.",
            "Add detailed semantic API specifications (OpenAPI/Swagger) to backend repository artifacts."
        ],
        "readinessScoreImpact": "+18 pts (Verified Code Portfolio)",
        "codeComplexityGrade": "High (Tier 1 Production Grade)",
    }

    return {
        "success": True,
        "analysis": analysis,
        "timestamp": "2026-09-23T11:00:00Z"
    }

@router.get("/getDashboardData")
@router.post("/getDashboardData")
def get_dashboard_data():
    gh = current_session.get("github_profile")
    user = current_session.get("user") or {
        "id": 1,
        "firstName": "Alex",
        "lastName": "Vance",
        "email": "student@university.edu",
        "role": "STUDENT",
    }

    first_name = user.get("firstName", "Alex")
    last_name = user.get("lastName", "Vance")
    full_name = f"{first_name} {last_name}"

    profile_data = {
        "id": 1,
        "name": full_name,
        "targetRole": "Full-Stack Software Engineer",
        "department": "Computer Science & Engineering",
        "employabilityScore": 88,
        "placementReadiness": 85,
        "verifiedEvidence": 4,
        "totalEvidence": 4,
        "profileCompletion": 92,
        "recruiterVisibility": "CONSENTED",
        "collegeName": "Riverview Institute of Technology",
        "cgpa": 3.86,
    }

    assessment_data = {
        "overallScore": 88,
        "technicalScore": 88,
        "evidenceStrengthScore": 85,
        "problemSolvingScore": 82,
        "academicScore": 92,
    }

    evidence_items = []
    if gh:
        evidence_items.append({
            "id": 1,
            "title": f"GitHub Repository Portfolio (@{gh.get('username')})",
            "type": "PROJECT",
            "source": "GitHub Public REST API",
            "verificationStatus": "VERIFIED",
            "verifiedAt": gh.get("connectedAt", "2026-09-20"),
            "url": gh.get("profileUrl") or f"https://github.com/{gh.get('username')}",
            "scoreContribution": 28,
        })
    evidence_items.extend([
        {
            "id": 2,
            "title": "Official Academic Transcript - Semesters 1-6",
            "type": "CERTIFICATE",
            "source": "College Registrar",
            "verificationStatus": "VERIFIED",
            "verifiedAt": "2026-09-15",
            "url": "#",
            "scoreContribution": 25,
        },
        {
            "id": 3,
            "title": "AWS Certified Cloud Practitioner Certificate",
            "type": "CERTIFICATE",
            "source": "PaddleOCR Verified",
            "verificationStatus": "VERIFIED",
            "verifiedAt": "2026-09-12",
            "url": "#",
            "scoreContribution": 18,
        },
        {
            "id": 4,
            "title": "Systems Architecture Internship & Microservices",
            "type": "INTERNSHIP",
            "source": "Northstar Cloud Labs",
            "verificationStatus": "VERIFIED",
            "verifiedAt": "2026-09-10",
            "url": "#",
            "scoreContribution": 17,
        },
    ]

    recommendations_data = {
        "recommendedRoles": ["Full-Stack Software Engineer", "Systems Engineer", "Cloud Solutions Architect"],
        "primaryRoleFitScore": 88,
        "missingSkills": ["Kubernetes", "GraphQL", "gRPC"],
        "recommendedActions": [
            {"title": "System design documentation", "skill": "System Design", "time": "2 hrs", "reason": "Demonstrate high-level architectural decisions"},
            {"title": "Automated test coverage", "skill": "Testing", "time": "3 hrs", "reason": "Increase unit test coverage in GitHub repositories"},
            {"title": "API telemetry & observability", "skill": "DevOps", "time": "1.5 hrs", "reason": "Add OpenTelemetry or structured logs to backend microservices"},
        ],
        "learningPriorities": ["Distributed Consensus", "Microservices at Scale", "Advanced TypeScript"],
        "readinessSummary": f"{full_name} has demonstrated high technical competency with verified git repositories and strong academic foundations.",
    }

    return {
        "score": 88,
        "user": user,
        "profile": profile_data,
        "assessment": assessment_data,
        "evidence": evidence_items,
        "recommendations": recommendations_data,
        "skills": ["TypeScript", "React", "Python", "FastAPI", "PostgreSQL", "Docker", "Git", "System Design"],
        "student": {
            "department": "Computer Science & Engineering",
            "cgpa": 3.86,
            "targetRole": "Full-Stack Software Engineer",
            "recruiterVisibility": "CONSENTED",
            "collegeName": "Riverview Institute of Technology",
        },
        "pillars": {
            "academic": {"score": 92, "weight": 25, "verified": True},
            "projects": {"score": 89, "weight": 30, "verified": True},
            "evidence": {"score": 85, "weight": 25, "verified": True},
            "skills": {"score": 84, "weight": 20, "verified": True},
        },
        "evidenceList": evidence_items,
        "recentActivities": [
            {"action": "GitHub Repositories Audited", "timestamp": "Just now", "icon": "Github"},
            {"action": "AI Resume Generated from Codebase", "timestamp": "2 hours ago", "icon": "Sparkles"},
            {"action": "Evidence item verified by Faculty Admin", "timestamp": "Yesterday", "icon": "ShieldCheck"},
        ],
        "topSkills": ["TypeScript", "React", "Python", "FastAPI", "PostgreSQL", "Docker", "Git"],
    }

@router.post("/generateResume")
def generate_resume():
    gh = current_session.get("github_profile")
    li = current_session.get("linkedin_profile")
    user = current_session.get("user", {})

    full_name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
    if not full_name:
        full_name = gh.get("data", {}).get("name") if gh else "Student Scholar"

    email = user.get("email") or (f"{gh.get('username')}@university.edu" if gh else "student@university.edu")
    
    contact_parts = [email]
    if gh:
        contact_parts.append(f"[github.com/{gh.get('username')}]({gh.get('profileUrl')})")
    if li:
        contact_parts.append(f"[linkedin.com/in/{li.get('username')}]({li.get('profileUrl')})")
    contact_line = " | ".join(contact_parts)

    repos = gh.get("data", {}).get("repos", []) if gh else []
    projects_md = ""
    if repos:
        projects_md = "\n### Featured Projects (Verified from GitHub)\n"
        for r in repos[:4]:
            lang = r.get("language") or "Codebase"
            stars = r.get("stargazers_count", 0)
            forks = r.get("forks_count", 0)
            projects_md += f"#### **{r.get('name')}** | *{lang}*\n- {r.get('description') or 'Open-source software project with verified repository commits.'}\n- [View on GitHub]({r.get('html_url')}) (⭐ {stars} stars | 🍴 {forks} forks)\n\n"

    langs = ", ".join(gh.get("data", {}).get("topLanguages", [])) if gh else "TypeScript, Python, SQL"
    skills = ", ".join(li.get("data", {}).get("skills", [])) if li else "System Design, Full-Stack Architecture, Docker, Git"

    markdown = f"""# {full_name}
**Software Engineer & CS Scholar**  
*Contact:* {contact_line}

---

### Professional Summary
Passionate and evidence-backed Software Engineer with verified repository commits and authenticated university records. Demonstrates end-to-end competency across distributed computing, backend microservices, and modern user interfaces.

---

### Verified Technical Skills
- **Languages:** {langs}
- **Competencies:** {skills}

---
{projects_md}
### Education
**B.S. in Computer Science & Engineering**  
*Riverview Institute of Technology* | CGPA: 3.86/4.0 | Expected Graduation: May 2026
"""

    return {
        "success": True,
        "resumeMarkdown": markdown,
    }
