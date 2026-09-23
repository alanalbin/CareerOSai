# Document Intelligence & PaddleOCR Architecture

**Platform**: Vantage — Career Readiness Intelligence Platform  
**Component**: Document Ingestion, Text Extraction, and Structure Parsing  
**Core Technologies**: PaddleOCR (Python 3.10+), FastAPI, Node.js, pdf-parse  

---

## 🏛️ 1. Architecture & Design

Vantage handles high-volume academic records, transcripts, certificates, and resumes through a decoupled document intelligence pipeline:

```
[ Client Upload (PDF / PNG / JPG) ]
                  |
                  v
       [ Storage Service ] (UUIDv4 Sanitization)
                  |
                  v
       [ Document Status: PENDING ]
                  |
                  v
       [ OCR Service Dispatcher ] (server/services/ocr/ocrService.ts)
                  |
         +--------+--------+
         |                 |
     (Remote OK)      (Remote Unreachable)
         |                 |
         v                 v
[ PaddleOCR Microservice ] [ Local Resilient Fallback ]
  (services/ocr/app.py)     (pdf-parse / heuristic regex)
         |                 |
         +--------+--------+
                  |
                  v
[ Extracted Text & Confidence Score ]
                  |
                  v
[ Document Status: COMPLETED ]
                  |
                  v
[ Trigger: Qwen3 Entity Extraction ]
```

---

## 🐍 2. Standalone PaddleOCR Microservice

The microservice is located at `services/ocr/python_service/`:
- **Framework**: FastAPI + Uvicorn
- **Engine**: PaddleOCR with PP-OCRv4 detection and recognition models
- **Capabilities**:
  - Multilingual character recognition (English, Latin, Asian scripts).
  - Rotated and orientation-skewed text correction (`use_angle_cls=True`).
  - Table structure detection for academic grade sheets and transcripts.

### API Endpoints

#### `GET /health`
Returns service readiness:
```json
{
  "status": "healthy",
  "engine": "PaddleOCR",
  "version": "2.7+",
  "gpu_available": false
}
```

#### `POST /ocr/process`
Accepts multipart form file upload (`file: UploadFile`):
```json
{
  "success": true,
  "filename": "transcript_fall_2025.pdf",
  "text": "STATE UNIVERSITY\nDepartment of Computer Science\nFall 2025 Semester Grade Report\n...",
  "confidence": 0.94,
  "line_count": 42,
  "metadata": {
    "processing_time_ms": 320,
    "angle_corrected": true
  }
}
```

---

## 🛡️ 3. Resilient Fallback Engine

To guarantee zero developer friction and 100% uptime:
1. When `OCR_SERVICE_URL` is configured and online, Vantage routes files to the PaddleOCR microservice.
2. If the Python microservice is offline or encounters a connection timeout:
   - For PDF documents: Vantage executes in-process text extraction via `pdf-parse`.
   - For images/scans: Vantage applies structured regex-based token extraction.
   - Processing completes with a warning flag, allowing development and testing to proceed uninterrupted.

---

## 🚀 4. Setting Up the PaddleOCR Microservice

### Ubuntu / Debian:
```bash
sudo apt-get update
sudo apt-get install -y libgl1-mesa-glx libgomp1

cd services/ocr/python_service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run on port 8000
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 2
```

### Windows:
```powershell
cd services\ocr\python_service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Run on port 8000
uvicorn app:app --host 127.0.0.1 --port 8000
```
