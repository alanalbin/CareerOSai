# Environment Configuration & Secret Management

This document provides a comprehensive reference for all environment variables supported by the **Vantage Career Readiness Intelligence Platform**.

---

## 📋 Environment Variables Reference

| Variable | Type | Default | Required in Prod? | Description |
| :--- | :---: | :---: | :---: | :--- |
| `NODE_ENV` | String | `development` | Yes | Set to `production` in staging/production deployments. |
| `PORT` | Number | `3000` | No | HTTP port where Express server binds. Auto-increments if port is busy. |
| `DATABASE_URL` | String | *Empty* | Yes (Prod) | PostgreSQL connection URI. If omitted, Vantage defaults to local PGlite in `./data/vantage_pg`. |
| `JWT_SECRET` | String | *Internal Dev Key* | **Critical** | Cryptographic secret used to sign Jose JWT session tokens (min 256 bits). |
| `JWT_EXPIRES_IN` | String | `7d` | No | Expiration duration for user sessions (e.g. `1d`, `7d`, `30d`). |
| `UPLOAD_DIR` | String | `./uploads` | No | Local directory where user evidence files, transcripts, and portfolios are stored. |
| `MAX_FILE_SIZE_MB` | Number | `25` | No | Maximum allowed upload size per file in megabytes. |
| `OCR_SERVICE_URL` | String | `http://localhost:8000` | No | Base URL of the Python PaddleOCR FastAPI microservice. |
| `OCR_CONFIDENCE_THRESHOLD` | Number | `0.85` | No | Minimum confidence score to mark OCR output as high-fidelity without warning. |
| `QWEN_API_KEY` | String | *Empty* | Yes (AI Features) | API key for Qwen3 / Alibaba Cloud DashScope. |
| `QWEN_BASE_URL` | String | DashScope Default | No | Base URL for OpenAI-compatible Qwen3 endpoint. |
| `QWEN_MODEL` | String | `qwen-max` | No | Model name (`qwen-max`, `qwen-plus`, `qwen-turbo`). |
| `SMTP_HOST` | String | `smtp.mailtrap.io` | Optional | SMTP mail server hostname for transactional emails. |
| `SMTP_PORT` | Number | `587` | Optional | SMTP mail server port (587 for TLS, 465 for SSL). |
| `SMTP_USER` | String | *Empty* | Optional | SMTP username. |
| `SMTP_PASS` | String | *Empty* | Optional | SMTP password. |
| `SMTP_FROM` | String | *Vantage Platform* | Optional | From email address for system emails. |

---

## 🔐 Generating Production Secrets

Run the following command in terminal to generate a secure random 64-character secret for `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ⚙️ Example Configurations

### 1. Minimal Zero-Config Local Development
```env
NODE_ENV=development
PORT=3000
# Database automatically initializes in ./data/vantage_pg
```

### 2. Full Production Configuration
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://vantage_user:StrongPass123!@db.internal:5432/vantage_prod
JWT_SECRET=8f5b4a974b78912304918e90abdf094719082358071295871239085712930485
JWT_EXPIRES_IN=7d
UPLOAD_DIR=/var/data/vantage/uploads
OCR_SERVICE_URL=http://vantage-ocr.internal:8000
QWEN_API_KEY=sk-dashscope-live-key-xyz
QWEN_MODEL=qwen-max
```
