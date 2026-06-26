import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    await pool.query("SELECT 1")
    return NextResponse.json({
      status: "ok",
      db: "connected",
      time: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: "error", db: "disconnected", time: new Date().toISOString() },
      { status: 503 }
    )
  }
}
