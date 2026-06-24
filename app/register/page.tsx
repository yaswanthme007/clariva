"use client"

import Link from "next/link"
import { useState } from "react"
import { Eye, EyeOff, Zap, AlertCircle, CheckCircle2 } from "lucide-react"

interface FormState {
  fullName: string
  email: string
  businessName: string
  password: string
  confirmPassword: string
}

const INITIAL: FormState = {
  fullName: "",
  email: "",
  businessName: "",
  password: "",
  confirmPassword: "",
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length

  const label = ["Too short", "Weak", "Fair", "Good", "Strong"][score]
  const colors = ["bg-rose-500", "bg-rose-500", "bg-amber-500", "bg-amber-500", "bg-emerald-500"]
  const textColors = ["text-rose-600", "text-rose-600", "text-amber-600", "text-amber-600", "text-emerald-600"]

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : "bg-border"}`}
          />
        ))}
      </div>
      <span className={`text-xs font-medium ${textColors[score]}`}>{label}</span>
    </div>
  )
}

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState("")

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      setError("")
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { fullName, email, businessName, password, confirmPassword } = form

    if (!fullName || !email || !businessName || !password || !confirmPassword) {
      setError("Please fill in all fields.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    setError("")
    // Backend logic goes here
  }

  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword

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
          background: "radial-gradient(ellipse at center, rgba(79,70,229,0.06) 0%, transparent 70%)",
        }} />
      </div>

      <div className="relative w-full max-w-[400px]">

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
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
              Create your account
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Start your free 14-day trial — no credit card required
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* Full name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="text-sm font-medium text-foreground">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
                value={form.fullName}
                onChange={set("fullName")}
                className="w-full h-10 rounded-lg px-3 text-sm bg-background text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30"
                style={{ border: "1px solid var(--border)" }}
              />
            </div>

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
                value={form.email}
                onChange={set("email")}
                className="w-full h-10 rounded-lg px-3 text-sm bg-background text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30"
                style={{ border: "1px solid var(--border)" }}
              />
            </div>

            {/* Business name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="businessName" className="text-sm font-medium text-foreground">
                Business name
              </label>
              <input
                id="businessName"
                type="text"
                autoComplete="organization"
                placeholder="Acme Studio"
                value={form.businessName}
                onChange={set("businessName")}
                className="w-full h-10 rounded-lg px-3 text-sm bg-background text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30"
                style={{ border: "1px solid var(--border)" }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={set("password")}
                  className="w-full h-10 rounded-lg px-3 pr-10 text-sm bg-background text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30"
                  style={{ border: "1px solid var(--border)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  className="w-full h-10 rounded-lg px-3 pr-10 text-sm bg-background text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30"
                  style={{ border: "1px solid var(--border)" }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {passwordsMatch && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
              Create account
            </button>

            {/* Terms */}
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              By creating an account you agree to our{" "}
              <Link href="#" className="text-primary hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>

          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-indigo-700 transition-colors">
            Log in
          </Link>
        </p>

      </div>
    </div>
  )
}
