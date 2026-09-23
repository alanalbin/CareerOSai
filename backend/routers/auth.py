from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import requests

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory session store for current active session
current_session: Dict[str, Any] = {
    "user": {
        "id": 1,
        "email": "student@university.edu",
        "firstName": "Alex",
        "lastName": "Vance",
        "role": "STUDENT",
    },
    "profile": None,
    "github_profile": None,
}

class LoginRequest(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = "STUDENT"

class GitHubAuthRequest(BaseModel):
    username: str
    token: Optional[str] = None
    code: Optional[str] = None

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = "STUDENT"
    firstName: Optional[str] = "Student"
    lastName: Optional[str] = "User"
    department: Optional[str] = None
    targetRole: Optional[str] = None
    institutionName: Optional[str] = None
    companyName: Optional[str] = None

@router.get("/me")
@router.post("/me")
def get_current_user():
    return {
        "user": current_session["user"],
        "profile": current_session["profile"],
    }

@router.post("/login")
def login(payload: Optional[LoginRequest] = None):
    role = "STUDENT"
    email = "student@university.edu"
    first_name = "Alex"
    last_name = "Vance"

    if payload:
        if payload.role:
            role = payload.role.upper()
        if payload.identifier:
            email = payload.identifier
            parts = payload.identifier.split("@")[0].split(".")
            first_name = parts[0].capitalize()
            if len(parts) > 1:
                last_name = parts[1].capitalize()
        elif payload.email:
            email = payload.email
            parts = payload.email.split("@")[0].split(".")
            first_name = parts[0].capitalize()
            if len(parts) > 1:
                last_name = parts[1].capitalize()

    user_obj = {
        "id": 1,
        "email": email,
        "firstName": first_name,
        "lastName": last_name,
        "role": role,
    }
    current_session["user"] = user_obj

    return {
        "token": "careeros_jwt_token_sample",
        "user": user_obj,
    }

@router.post("/github")
def login_with_github(payload: GitHubAuthRequest):
    username = payload.username.strip().replace("https://github.com/", "").replace("/", "")
    if not username:
        raise HTTPException(status_code=400, detail="GitHub username is required.")

    # Query official GitHub API
    headers = {
        "User-Agent": "Career-OS-Platform",
        "Accept": "application/vnd.github.v3+json",
    }
    if payload.token and payload.token.strip():
        headers["Authorization"] = f"Bearer {payload.token.strip()}"

    try:
        gh_res = requests.get(f"https://api.github.com/users/{username}", headers=headers, timeout=10)
        if gh_res.status_code == 404:
            raise HTTPException(status_code=404, detail=f'GitHub user "{username}" not found.')
        if gh_res.status_code in [403, 429]:
            # Rate limited by GitHub unauthenticated API
            raise HTTPException(status_code=429, detail="GitHub API rate limit reached. Please provide a Personal Access Token (PAT) or use demo handles.")
        if gh_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Unable to verify GitHub account. Please try again.")

        gh_data = gh_res.json()

        # Fetch repositories
        repos_res = requests.get(f"https://api.github.com/users/{username}/repos?sort=updated&per_page=10", headers=headers, timeout=10)
        repos = []
        languages = {}
        if repos_res.status_code == 200:
            for r in repos_res.json():
                lang = r.get("language")
                if lang:
                    languages[lang] = languages.get(lang, 0) + 1
                repos.append({
                    "id": r.get("id"),
                    "name": r.get("name"),
                    "description": r.get("description") or "No description provided",
                    "language": lang or "Other",
                    "stars": r.get("stargazers_count", 0),
                    "forks": r.get("forks_count", 0),
                    "html_url": r.get("html_url"),
                    "updated_at": r.get("updated_at"),
                })

        top_langs = sorted(languages.keys(), key=lambda l: languages[l], reverse=True)[:5]

        # Extract name
        full_name = gh_data.get("name") or username
        parts = full_name.split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else "Dev"

        user_obj = {
            "id": 1,
            "email": gh_data.get("email") or f"{username}@users.noreply.github.com",
            "firstName": first_name,
            "lastName": last_name,
            "role": "STUDENT",
            "avatarUrl": gh_data.get("avatar_url"),
            "githubUsername": username,
        }
        current_session["user"] = user_obj

        github_profile = {
            "id": 1,
            "username": username,
            "profileUrl": gh_data.get("html_url") or f"https://github.com/{username}",
            "verified": True,
            "connectedAt": "2026-09-23T11:00:00Z",
            "data": {
                "name": full_name,
                "bio": gh_data.get("bio") or "",
                "avatar_url": gh_data.get("avatar_url"),
                "public_repos": gh_data.get("public_repos", len(repos)),
                "followers": gh_data.get("followers", 0),
                "following": gh_data.get("following", 0),
                "topLanguages": top_langs,
                "repos": repos,
            }
        }
        current_session["github_profile"] = github_profile

        return {
            "token": "careeros_jwt_token_sample",
            "user": user_obj,
            "github": github_profile,
            "message": f"Successfully authenticated as @{username} via GitHub!"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to access GitHub data: {str(e)}")

@router.post("/register")
def register(payload: Optional[RegisterRequest] = None):
    role = "STUDENT"
    first_name = "Jane"
    last_name = "Doe"
    email = "newuser@domain.com"

    if payload:
        if payload.role:
            role = payload.role.upper()
        if payload.firstName:
            first_name = payload.firstName
        if payload.lastName:
            last_name = payload.lastName
        if payload.email:
            email = payload.email

    user_obj = {
        "id": 1,
        "email": email,
        "firstName": first_name,
        "lastName": last_name,
        "role": role,
    }
    current_session["user"] = user_obj

    return {
        "status": "success",
        "token": "careeros_jwt_token_sample",
        "user": user_obj,
    }

@router.post("/logout")
def logout():
    current_session["user"] = None
    return {"status": "success"}

@router.post("/requestPasswordReset")
def request_password_reset():
    return {"message": "Password reset instructions have been sent to your email."}
