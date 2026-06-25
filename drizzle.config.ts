import { defineConfig } from 'drizzle-kit'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const dbUrl = new URL(process.env.DATABASE_URL!)

export default defineConfig({
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: dbUrl.hostname,
    port: Number(dbUrl.port) || 5432,
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  },
})
