from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, readiness, platform, ocr, ai, student, verification

app = FastAPI(title="Career Readiness API")

# Configure CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(student.router, prefix="/api")
app.include_router(verification.router, prefix="/api")
app.include_router(readiness.router, prefix="/api")
app.include_router(platform.router, prefix="/api")
app.include_router(ocr.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "FastAPI backend is running"}
