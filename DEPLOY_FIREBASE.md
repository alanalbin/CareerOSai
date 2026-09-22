# Deploy Career OS with Firebase

## Architecture

Deploy the React application to **Firebase Hosting** and route `/api/**` to the
Express/tRPC API on **Cloud Run**. Use **Cloud SQL for PostgreSQL** for the
application database. Firebase Hosting cannot run this server, persist a
PostgreSQL database, or host PaddleOCR by itself.

`firebase.json` is already configured for a Cloud Run service named
`career-os-api` in `asia-south1`. Change the region and service id together if
you use another region.

## Before deploying

1. Create a Firebase project on the Blaze plan, then install and authenticate
   both CLIs:

   ```powershell
   npm install -g firebase-tools
   gcloud auth login
   firebase login
   gcloud config set project YOUR_PROJECT_ID
   firebase use --add
   ```

2. Enable Cloud Run, Cloud Build, Artifact Registry, Cloud SQL Admin, Secret
   Manager, Firebase Hosting, and Cloud Storage APIs. Create a PostgreSQL
   Cloud SQL instance in the same region and a database/user for Career OS.

3. Store `AUTH_SECRET`, `DATABASE_URL`, OAuth client secrets, Qwen credentials,
   and SMTP credentials in Secret Manager. Do not put production secrets in
   `.env`, the Firebase client configuration, or source control.

4. Create a Firebase Storage bucket for documents. **Important:** the current
   document service writes to the local filesystem for development. Cloud Run's
   filesystem is ephemeral, so production document uploads must be moved to a
   Cloud Storage-backed adapter before enabling uploads. Do not launch with
   document uploads enabled until that migration is complete.

5. Deploy the PaddleOCR Python service separately to Cloud Run and set its
   authenticated HTTPS endpoint as `OCR_SERVICE_URL`. Configure GitHub and
   LinkedIn callback URLs using your final Hosting domain.

## Deploy the API

From the repository root:

```powershell
gcloud run deploy career-os-api --source . --region asia-south1 --allow-unauthenticated --port 8080
```

Grant the Cloud Run service account access to Cloud SQL and Secret Manager.
Attach secrets as environment variables in Cloud Run, then redeploy. Set:

```text
NODE_ENV=production
DATABASE_URL=<Cloud SQL PostgreSQL connection string>
AUTH_SECRET=<Secret Manager secret>
OCR_SERVICE_URL=<PaddleOCR Cloud Run URL>
QWEN_API_KEY=<Secret Manager secret>
QWEN_API_URL=<provider URL>
GITHUB_CLIENT_ID=<OAuth client id>
GITHUB_CLIENT_SECRET=<Secret Manager secret>
LINKEDIN_CLIENT_ID=<OAuth client id>
LINKEDIN_CLIENT_SECRET=<Secret Manager secret>
```

The application now refuses to fall back to local PGlite when `NODE_ENV` is
`production`, preventing accidental deployment with an embedded database.

## Deploy Hosting

Build the static site, then deploy only Hosting:

```powershell
corepack pnpm run build
firebase deploy --only hosting
```

Firebase Hosting serves `dist/public`, sends SPA routes to `index.html`, and
forwards `/api/**` requests to Cloud Run under the same origin. This preserves
the app's HTTP-only session cookies without introducing browser CORS concerns.

## Go-live checks

- Verify registration, login, logout, and direct dashboard URL protection.
- Verify `/api/trpc/auth.me` returns the correct role through the Hosting URL.
- Confirm Cloud SQL backups, point-in-time recovery, and least-privilege users.
- Confirm secret values are attached from Secret Manager, not plaintext env
  files.
- Configure a custom domain, HTTPS, OAuth redirect URLs, and SMTP sender
  domain.
- Enable Cloud Monitoring alerts for 5xx rate, Cloud Run latency, and database
  connection errors.
- Complete the Cloud Storage document adapter and test document authorization
  before enabling uploads for users.
