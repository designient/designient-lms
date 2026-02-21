# Vercel Deployment Guide

This guide details how to deploy the Designient Workspace to Vercel on the Hobby plan.

## Prerequisites

1.  **GitHub Repository**: Ensure your code is pushed to GitHub (already done).
2.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
3.  **Neon Database**: You are already using Neon (`neondb`). Ensure your database is accessible from the internet (Neon is by default).

## Deployment Steps

### 1. Import Project to Vercel

1.  Log in to Vercel.
2.  Click **"Add New..."** -> **"Project"**.
3.  Connect your GitHub account and select the `designient-workspace` repository.

### 2. Configure Project Settings

In the "Configure Project" screen:

*   **Framework Preset**: Next.js (should be auto-detected).
*   **Root Directory**: `./` (default).
*   **Build Command**: `prisma generate && next build` (We updated `package.json` to handle this, but verify overrides if needed).
    *   *Note*: If you see "Build Command" override, leave it empty to use `package.json` script, or enter `npm run build`.

### 3. Environment Variables (Critical)

You must add the following environment variables in the **Environment Variables** section. Copy them from your local `.env` file.

| Variable Name | Description | Example / Note |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection string for Neon DB | `postgresql://neondb_owner:...?sslmode=require` |
| `AUTH_SECRET` | Secret for NextAuth | Generate with `openssl rand -base64 32` or copy from `.env` |
| `NEXTAUTH_URL` | URL of your deployed app | Vercel sets this automatically for Next.js, but adding it explicitly (e.g. `https://your-app.vercel.app`) is recommended for production. |
| `APP_URL` | Public URL for email links | Same as `NEXTAUTH_URL` (e.g. `https://your-app.vercel.app`) |

#### Optional Services (For Full Functionality)

To enable **File Uploads** (Recordings/Materials) and **Emails** (Invites/Reset Password), you need external services. Vercel Hobby plan does not host storage or email.

**File Storage (S3 Compatible)**:
*   Use AWS S3, Cloudflare R2, or DigitalOcean Spaces.
*   Variables:
    *   `S3_ENDPOINT` (e.g. `https://s3.us-east-1.amazonaws.com`)
    *   `S3_REGION` (e.g. `us-east-1`)
    *   `S3_BUCKET` (e.g. `workspace-uploads`)
    *   `S3_ACCESS_KEY`
    *   `S3_SECRET_KEY`

**Email (SMTP)**:
*   Use Resend, SendGrid, or AWS SES.
*   Variables:
    *   `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

### 4. Deploy

Click **"Deploy"**. Vercel will:
1.  Clone the repo.
2.  Install dependencies (`npm install`).
3.  Run the build script (`prisma generate && next build`).
4.  Deploy the artifacts.

## Post-Deployment

1.  **Database Migration**:
    The build command generates the client but *does not* migrate the database.
    *   **Option A (Recommended)**: Connect to your Neon DB from your local machine and run:
        ```bash
        npx prisma migrate deploy
        ```
        (Ensure your local `.env` points to the *same* production database URL).
    *   **Option B (Vercel Build Command)**: You can change the build command to `npx prisma migrate deploy && prisma generate && next build` - *Warning*: This runs migration on every build, which can be risky if multiple builds run.

2.  **Verify Access**:
    *   Visit your Vercel URL (e.g., `https://designient-workspace.vercel.app`).
    *   Log in with your Admin credentials.

## Troubleshooting

*   **Build Failures**: Check the "Build Logs" tab in Vercel. Common issues are missing env vars or TypeScript errors (completed verification locally fixes this).
*   **Database Errors**: Ensure `DATABASE_URL` is correct and has `?sslmode=require` for Neon.
*   **Upload Errors**: If S3 vars are missing, uploads will fail.
