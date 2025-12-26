"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-contexts"
import { validationRules } from "@/lib/validation"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("sui@gmail.com")
  const [password, setPassword] = useState("password123")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const { login } = useAuth()

  const validateField = (field: string, value: string) => {
    let error = ""
    if (field === "email") {
      error = validationRules.email.validate(value)
    } else if (field === "password") {
      error = validationRules.password.validate(value)
    }
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    const emailError = validationRules.email.validate(email)
    const passwordError = validationRules.password.validate(password)

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
      })
      return
    }

    setIsLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      setErrors({ email: "Invalid credentials. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left side - Image */}
      <div className="hidden md:block relative bg-green-900">
        <Image
          src="/images/fresh-green-vegetables-zucchini-lettuce-cabbage.png"
          alt="Fresh vegetables"
          fill
          className="object-cover"
        />
      </div>

      {/* Right side - Login Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 border border-green-600 text-green-600 rounded-full hover:bg-green-50 transition-colors mb-6"
            >
              <Home className="h-4 w-4" />
              <span className="font-medium">Home</span>
            </Link>
            <div className="text-2xl font-bold text-green-700 mb-2">KrishiPal</div>
          </div>

          <h1 className="text-3xl font-bold mb-2">
            Hello,
            <br />
            Welcome Back
          </h1>
          <p className="text-gray-600 mb-8">Login to manage your account</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                type="email"
                placeholder="Email"
                className={`w-full bg-gray-50 border-gray-200 ${errors.email ? "border-red-500" : ""}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  validateField("email", e.target.value)
                }}
                required
              />
              {errors.email && <p className="text-red-600 text-sm mt-2">{errors.email}</p>}
            </div>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className={`w-full bg-gray-50 border-gray-200 pr-10 ${errors.password ? "border-red-500" : ""}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  validateField("password", e.target.value)
                }}
                required
              />
              {errors.password && (
                <p className="text-red-600 text-sm mt-2 absolute -bottom-6 left-0">{errors.password}</p>
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <div className="h-6" />

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg disabled:opacity-50"
              disabled={isLoading || !!errors.email || !!errors.password}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>

            <div className="text-center">
              <span className="text-gray-500">or</span>
            </div>

            <Button type="button" variant="outline" className="w-full py-6 bg-transparent">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </form>

          <p className="text-center mt-8 text-gray-600">
            {"Don't have an account? "}
            <Link href="/signup" className="text-green-600 hover:underline font-medium">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
