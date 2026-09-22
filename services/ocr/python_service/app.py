"""
Vantage PaddleOCR Document Processing Microservice
Provides production OCR and structured text extraction for resumes, transcripts, and certificates.
"""

import os
import io
import re
import tempfile
from typing import Dict, Any, List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Vantage PaddleOCR Microservice",
    description="Dedicated OCR extraction service for Career Readiness documents",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy PaddleOCR loader
_ocr_instance = None

def get_ocr():
    global _ocr_instance
    if _ocr_instance is None:
        try:
            from paddleocr import PaddleOCR
            _ocr_instance = PaddleOCR(use_angle_cls=True, lang='en')
        except Exception as e:
            print(f"[PaddleOCR] Warning: Could not initialize PaddleOCR: {e}")
            _ocr_instance = None
    return _ocr_instance

class OCRResponse(BaseModel):
    success: bool
    extractedText: str
    confidence: float
    lineCount: int
    structuredFields: Dict[str, Any]

def extract_structured_fields(text: str) -> Dict[str, Any]:
    fields: Dict[str, Any] = {
        "candidateName": None,
        "email": None,
        "phone": None,
        "detectedSkills": [],
        "detectedEducation": [],
        "detectedProjects": [],
        "cgpa": None,
    }

    # Extract email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    if email_match:
        fields["email"] = email_match.group(0)

    # Extract phone
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    if phone_match:
        fields["phone"] = phone_match.group(0)

    # Extract CGPA / GPA
    cgpa_match = re.search(r'(?:CGPA|GPA|Grade Point)[:\s]*([0-9]\.[0-9]{1,2})', text, re.IGNORECASE)
    if cgpa_match:
        try:
            fields["cgpa"] = float(cgpa_match.group(1))
        except ValueError:
            pass

    # Normalized skills scanner
    common_skills = [
        "Python", "React", "TypeScript", "JavaScript", "Node.js", "Express",
        "FastAPI", "Django", "SQL", "PostgreSQL", "MySQL", "MongoDB",
        "AWS", "Docker", "Kubernetes", "Git", "GitHub", "Linux",
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
        "Data Analysis", "System Design", "Testing", "QA", "CI/CD",
        "HTML", "CSS", "TailwindCSS", "REST API", "GraphQL"
    ]
    for skill in common_skills:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text, re.IGNORECASE):
            fields["detectedSkills"].append(skill)

    return fields

@app.get("/health")
def health_check():
    ocr_available = get_ocr() is not None
    return {
        "status": "healthy",
        "service": "Vantage PaddleOCR",
        "ocrEngineReady": ocr_available
    }

@app.post("/ocr/process", response_model=OCRResponse)
async def process_document(file: UploadFile = File(...)):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    filename = file.filename or "unknown"
    mime = file.content_type or ""
    extracted_lines: List[str] = []
    total_score = 0.0
    scored_items = 0

    ocr = get_ocr()

    if ocr is not None:
        try:
            # Write to temporary file for PaddleOCR processing
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp:
                tmp.write(contents)
                tmp_path = tmp.name

            try:
                results = ocr.ocr(tmp_path, cls=True)
                if results and len(results) > 0 and results[0]:
                    for line in results[0]:
                        text_part = line[1][0]
                        conf_part = float(line[1][1])
                        extracted_lines.append(text_part)
                        total_score += conf_part
                        scored_items += 1
            finally:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
        except Exception as e:
            print(f"[PaddleOCR] Execution error: {e}")

    # Fallback to plain text / PyPDF2 if PDF and PaddleOCR had 0 lines
    if len(extracted_lines) == 0:
        if "pdf" in mime.lower() or filename.lower().endswith(".pdf"):
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(contents))
                for page in reader.pages:
                    p_text = page.extract_text()
                    if p_text:
                        extracted_lines.append(p_text)
                total_score = 0.90
                scored_items = 1
            except Exception:
                pass
        elif "text" in mime.lower() or filename.lower().endswith(".txt"):
            try:
                extracted_lines.append(contents.decode('utf-8', errors='ignore'))
                total_score = 0.95
                scored_items = 1
            except Exception:
                pass

    full_text = "\n".join(extracted_lines).strip()
    avg_confidence = (total_score / scored_items) if scored_items > 0 else 0.0

    structured = extract_structured_fields(full_text)

    return OCRResponse(
        success=len(full_text) > 0,
        extractedText=full_text,
        confidence=round(avg_confidence, 2),
        lineCount=len(extracted_lines),
        structuredFields=structured
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("OCR_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
