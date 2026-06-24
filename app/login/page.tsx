"use client"

import Link from "next/link"
import { useState } from "react"
import { Eye, EyeOff, Zap, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError("Please fill in all fields.")
      return
    }
    setError("")
    // Backend logic goes here
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">

      {/* Subtle radial glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 flex items-center justify-center"
      >
        <div style={{
          width: "700px",
          height: "500px",
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 70%)",
        }} />
      </div>

      <div className="relative w-full max-w-[400px]">

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Zap className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Clariva
          </span>
        </Link>

        {/* Card */}
        <div
          className="w-full rounded-2xl bg-card p-8"
          style={{ border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)" }}
        >
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to your Clariva account
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError("") }}
                className="w-full h-10 rounded-lg px-3 text-sm bg-background text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-white/20"
                style={{ border: "1px solid var(--border)" }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Link
                  href="#"
                  className="text-xs text-primary hover:text-indigo-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError("") }}
                  className="w-full h-10 rounded-lg px-3 pr-10 text-sm bg-background text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-white/20"
                  style={{ border: "1px solid var(--border)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-rose-600 bg-rose-50" style={{ border: "1px solid #ffe4e6" }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold mt-1 transition-all hover:bg-indigo-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              Sign in
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-muted-foreground mt-5">
          {"Don't have an account? "}
          <Link href="/register" className="font-medium text-primary hover:text-indigo-700 transition-colors">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  )
}
