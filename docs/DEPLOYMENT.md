# Deployment & Operations Guide

This guide outlines deployment procedures for the **Vantage Career Readiness Intelligence Platform** across staging and production environments.

---

## 🏗️ Architecture Overview

A production Vantage deployment consists of three primary layers:

```
                  [ TLS / Reverse Proxy (Nginx / Cloudflare / ALB) ]
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v                                   v
             [ Vantage App Node.js ]              [ PaddleOCR Service ]
            (Express + tRPC + React)               (FastAPI / Python)
              Port 3000 / Internal                Port 8000 / Internal
                        |                                   |
                        v                                   |
              [ PostgreSQL 15+ DB ] <-----------------------+
```

---

## 📦 Production Deployment Options

### Option A: Standard Linux Host / VM (Ubuntu 22.04 LTS)

#### 1. System Requirements
- 2 vCPU, 4GB RAM minimum (8GB recommended if running PaddleOCR on the same host)
- PostgreSQL 15 or 16 installed locally or via managed database (AWS RDS, GCP Cloud SQL, Supabase, Neon)
- Node.js 20+ LTS and pnpm
- Python 3.10+ (optional, for OCR microservice)

#### 2. Environment Setup
```bash
# Clone the repository
cd /opt
git clone https://github.com/vantage-org/career-readiness-platform.git vantage
cd vantage

# Install Node dependencies
pnpm install --frozen-lockfile

# Copy production environment file
cp .env.example .env
nano .env
```

Ensure the following variables are configured in `.env`:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://vantage_user:secure_password@postgres-host:5432/vantage_prod
JWT_SECRET=<generated-64-character-random-key>
UPLOAD_DIR=/var/data/vantage/uploads
OCR_SERVICE_URL=http://127.0.0.1:8000
QWEN_API_KEY=<your-dashscope-api-key>
```

#### 3. Build & Run Application
```bash
# Build Vite client and bundle server
npm run build

# Use PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name "vantage-platform" --instances 2 --max-memory-restart 500M
pm2 save
pm2 startup
```

#### 4. (Optional) Run Standalone PaddleOCR Microservice
```bash
cd /opt/vantage/services/ocr/python_service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run via Uvicorn under PM2 or systemd
pm2 start "uvicorn app:app --host 127.0.0.1 --port 8000 --workers 2" --name "vantage-ocr"
```

#### 5. Reverse Proxy Configuration (Nginx)
```nginx
server {
    listen 80;
    server_name platform.vantage.edu;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name platform.vantage.edu;

    ssl_certificate /etc/letsencrypt/live/platform.vantage.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/platform.vantage.edu/privkey.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### Option B: Docker & Containerized Deployment

#### 1. Vantage Main Application Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

#### 2. Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: vantage_db
      POSTGRES_USER: vantage_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  vantage-app:
    build: .
    restart: always
    depends_on:
      - postgres
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://vantage_user:${DB_PASSWORD}@postgres:5432/vantage_db
      JWT_SECRET: ${JWT_SECRET}
      OCR_SERVICE_URL: http://vantage-ocr:8000
      QWEN_API_KEY: ${QWEN_API_KEY}
    ports:
      - "3000:3000"
    volumes:
      - uploads_data:/app/uploads

  vantage-ocr:
    build: ./services/ocr/python_service
    restart: always
    ports:
      - "8000:8000"

volumes:
  pgdata:
  uploads_data:
```

---

## 🔄 Database Migrations & Seeding

Vantage uses an automated multi-statement schema bootstrap in `server/db.ts`:
- When the server starts up, it automatically executes DDL migrations creating all 21 tables, indexes, and constraints if they do not already exist (`CREATE TABLE IF NOT EXISTS`).
- It seeds normalized platform skills (Full-Stack Engineering, Python, Machine Learning, Docker, TypeScript, etc.) automatically upon boot.
- To execute custom migrations via Drizzle Kit:
  ```bash
  pnpm drizzle-kit push
  ```

---

## 📈 Health Checks & Monitoring

- **Application HTTP Status**: Verify `GET /` returns `200 OK`.
- **API Liveness**: Verify `GET /api/trpc/auth.me` responds with valid JSON.
- **OCR Liveness**: Verify `GET http://127.0.0.1:8000/health` returns `{"status": "healthy"}`.
- **Logs**:
  ```bash
  pm2 logs vantage-platform
  ```
