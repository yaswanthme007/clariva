import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { pool } from '@/lib/db'

const registerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  businessName: z.string().min(1),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
  }

  const { email, fullName, businessName, password } = parsed.data

  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (rows.length > 0) {
    return NextResponse.json({ error: 'Email already in use.' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await pool.query(
    'INSERT INTO users (email, name, password_hash, business_name) VALUES ($1, $2, $3, $4)',
    [email, fullName, passwordHash, businessName]
  )

  return NextResponse.json({ success: true }, { status: 201 })
}
