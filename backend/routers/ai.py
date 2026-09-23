import os
from fastapi import APIRouter
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/ai", tags=["ai"])

API_KEY = os.getenv("QWEN_API_KEY")

@router.post("/analyze")
def analyze_project():
    # Ready to use API_KEY for Qwen AI calls here
    return {"complexity": "high", "entities": ["React", "Python"], "api_key_loaded": bool(API_KEY)}
