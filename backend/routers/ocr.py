from fastapi import APIRouter

router = APIRouter(prefix="/ocr", tags=["ocr"])

@router.post("/parse")
def parse_document():
    return {"text": "mock parsed text data"}
