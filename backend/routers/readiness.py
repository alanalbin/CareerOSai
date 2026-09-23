from fastapi import APIRouter

router = APIRouter(prefix="/readiness", tags=["readiness"])

@router.get("/score/{user_id}")
def get_score(user_id: int):
    return {"score": 85, "breakdown": {"technical": 90, "soft": 80}}
