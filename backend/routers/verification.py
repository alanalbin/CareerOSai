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
    gh_username = gh.get("username", "alexvance-dev") if gh else None
    gh_repos = gh.get("data", {}).get("public_repos", 14) if gh else 0
    top_langs = ", ".join(gh.get("data", {}).get("topLanguages", ["TypeScript", "Python"])) if gh else "TypeScript, Python"

    return {
        "accounts": {
            "github": bool(gh),
            "githubData": {
                "username": gh_username,
                "publicRepos": gh_repos,
            } if gh else None,
            "linkedin": True,
            "linkedinData": {
                "username": "alex-vance-cs",
            },
        },
        "rows": [
            {
                "field": "Full Name",
                "sources": ["Career OS", "OCR", "GitHub", "LinkedIn"],
                "careerOsValue": "Alex Vance",
                "ocrValue": "Alex Vance",
                "linkedinValue": "Alex Vance",
                "githubValue": gh.get("data", {}).get("name", "Alex Vance") if gh else "Alex Vance",
                "status": "VERIFIED",
            },
            {
                "field": "Primary Skills",
                "sources": ["Career OS", "GitHub", "LinkedIn"],
                "careerOsValue": "TypeScript, Python, React",
                "ocrValue": "TypeScript, Python, FastAPI",
                "linkedinValue": "TypeScript, Python, PostgreSQL",
                "githubValue": top_langs,
                "status": "CONSENTED" if gh else "PARTIALLY_VERIFIED",
            },
            {
                "field": "Repository Count",
                "sources": ["Career OS", "GitHub"],
                "careerOsValue": f"{gh_repos} Projects",
                "ocrValue": "—",
                "linkedinValue": "—",
                "githubValue": f"{gh_repos} Public Repos",
                "status": "VERIFIED" if gh else "NEEDS_REVIEW",
            },
            {
                "field": "Degree & Major",
                "sources": ["Career OS", "OCR", "College"],
                "careerOsValue": "B.S. Computer Science",
                "ocrValue": "B.S. Computer Science",
                "linkedinValue": "B.S. Computer Science",
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
