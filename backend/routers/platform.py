from fastapi import APIRouter

router = APIRouter(prefix="/platform", tags=["platform"])

@router.post("/evidence")
def submit_evidence():
    return {"status": "submitted"}

@router.get("/roster")
def get_roster():
    return {"students": []}
