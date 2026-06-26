# Clariva — Invoice Intelligence SaaS

Clariva is an AI-powered invoice management platform that predicts payment risk, automates reminder emails, and gives real-time cash-flow insights so businesses get paid on time. Built for the **AWS × Vercel Hackathon**, it uses Groq AI (llama-3.3-70b) to analyze client payment history and surface risk factors before invoices go unpaid.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.7 |
| Auth | NextAuth v5 — Credentials + JWT |
| Database ORM | Drizzle ORM 0.45 |
| AI | Groq API — llama-3.3-70b-versatile |
| Styling | Tailwind CSS v4 |
| Charts | Recharts 3 |
| Deployment | Vercel (serverless functions) |
| **Database** | **Amazon Aurora PostgreSQL Serverless v2** |

## AWS Database

**Amazon Aurora PostgreSQL Serverless v2** (us-east-1)

Clariva stores all users, clients, invoices, payment history, and AI-generated reminders in an Aurora Serverless v2 cluster. Aurora was chosen for its auto-scaling (0.5–128 ACUs), instant scale-to-zero in dev, and Postgres compatibility with Drizzle ORM.

### How it connects to Vercel

1. The Aurora cluster endpoint is exposed as a standard PostgreSQL connection string.
2. `DATABASE_URL` is set in Vercel **Settings → Environment Variables** (Production + Preview scopes).
3. `lib/db.ts` initialises a singleton `pg.Pool` via `process.env.DATABASE_URL` on cold start.
4. SSL is enforced (`ssl: { rejectUnauthorized: false }`) for encrypted transit.
5. Verify the live connection at [`/api/health`](https://clariva.vercel.app/api/health) — returns `{ status: "ok", db: "connected", time: "..." }`.

## Local Setup

```bash
# 1. Clone
git clone https://github.com/<your-org>/clariva.git
cd clariva

# 2. Install dependencies (pnpm recommended)
pnpm install

# 3. Configure environment
cp .env.example .env.local
```

Fill in `.env.local`:

```env
DATABASE_URL=postgresql://<user>:<password>@<aurora-endpoint>:5432/<db>?sslmode=require
NEXTAUTH_SECRET=<any-random-32-char-string>
NEXTAUTH_URL=http://localhost:3000
GROQ_API_KEY=<your-groq-api-key>
```

```bash
# 4. Push schema to Aurora
pnpm db:push

# 5. Seed demo data
pnpm db:seed

# 6. Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and click **"View demo"** on the login page to sign in instantly as `demo@clariva.com` / `demo123`.

## Live Demo

🔗 **[https://clariva.vercel.app](https://clariva.vercel.app)**

Click **"View demo"** on the login page — no registration needed. The demo account has pre-seeded invoices, clients, and payment history so every AI feature is visible immediately.
