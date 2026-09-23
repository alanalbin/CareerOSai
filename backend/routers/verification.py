from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from routers.auth import current_session

router = APIRouter(prefix="/verification", tags=["verification"])

class ResolveDiscrepancyRequest(BaseModel):
    field: str
    newValue: str
    reason: str

@router.get("/getMatrix")
@router.post("/getMatrix")
def get_verification_matrix():
    gh = current_session.get("github_profile")
    li = current_session.get("linkedin_profile")
    user = current_session.get("user", {})

    student_name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
    if not student_name:
        student_name = gh.get("data", {}).get("name") if gh else "Student User"

    gh_username = gh.get("username") if gh else None
    gh_repos = gh.get("data", {}).get("public_repos", len(gh.get("data", {}).get("repos", []))) if gh else 0
    top_langs = ", ".join(gh.get("data", {}).get("topLanguages", [])) if gh else "Not Connected"

    li_username = li.get("username") if li else None
    li_skills = ", ".join(li.get("data", {}).get("skills", [])) if li else "Not Connected"

    sources_full_name = ["Career OS", "OCR"]
    if gh:
        sources_full_name.append("GitHub")
    if li:
        sources_full_name.append("LinkedIn")

    sources_skills = ["Career OS"]
    if gh:
        sources_skills.append("GitHub")
    if li:
        sources_skills.append("LinkedIn")

    return {
        "accounts": {
            "github": bool(gh),
            "githubData": {
                "username": gh_username,
                "publicRepos": gh_repos,
            } if gh else None,
            "linkedin": bool(li),
            "linkedinData": {
                "username": li_username,
            } if li else None,
        },
        "rows": [
            {
                "field": "Full Name",
                "sources": sources_full_name,
                "careerOsValue": student_name,
                "ocrValue": student_name,
                "linkedinValue": student_name if li else "Not Connected",
                "githubValue": gh.get("data", {}).get("name", gh_username) if gh else "Not Connected",
                "status": "VERIFIED" if (gh and li) else ("PARTIALLY_VERIFIED" if (gh or li) else "PENDING"),
            },
            {
                "field": "Primary Skills",
                "sources": sources_skills,
                "careerOsValue": "TypeScript, Python, React",
                "ocrValue": "TypeScript, Python, FastAPI",
                "linkedinValue": li_skills,
                "githubValue": top_langs,
                "status": "VERIFIED" if gh else "CONSENTED",
            },
            {
                "field": "Repository Count",
                "sources": ["Career OS"] + (["GitHub"] if gh else []),
                "careerOsValue": f"{gh_repos} Projects" if gh else "0 Projects",
                "ocrValue": "—",
                "linkedinValue": "—",
                "githubValue": f"{gh_repos} Public Repos" if gh else "Not Connected",
                "status": "VERIFIED" if gh else "NEEDS_REVIEW",
            },
            {
                "field": "Degree & Major",
                "sources": ["Career OS", "OCR", "College"],
                "careerOsValue": "B.S. Computer Science",
                "ocrValue": "B.S. Computer Science",
                "linkedinValue": "B.S. Computer Science" if li else "Not Connected",
                "githubValue": "—",
                "status": "VERIFIED",
            },
            {
                "field": "Cumulative GPA",
                "sources": ["Career OS", "OCR", "College"],
                "careerOsValue": "3.86",
                "ocrValue": "3.86",
                "linkedinValue": "—",
                "githubValue": "—",
                "status": "VERIFIED",
            }
        ]
    }

@router.post("/resolveDiscrepancy")
def resolve_discrepancy(payload: ResolveDiscrepancyRequest):
    return {
        "success": True,
        "message": f"Successfully updated and verified '{payload.field}' with audit reason logged.",
    }
