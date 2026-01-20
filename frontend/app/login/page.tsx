"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { validationRules } from "@/lib/validation"
import { useAuth } from "@/contexts/auth-contexts"

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})

  const validateField = (field: string, value: string) => {
    let error = ""
    if (field === "email") error = validationRules.email.validate(value)
    if (field === "password") error = validationRules.password.validate(value)
    setErrors((prev) => ({ ...prev, [field]: error, general: "" }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    const emailError = validationRules.email.validate(email)
    const passwordError = validationRules.password.validate(password)

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError })
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
      // Redirect handled in AuthContext
    } catch (err: any) {
      setErrors({ general: err.message || "Invalid credentials. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block relative bg-green-900">
        <Image
          src="/images/fresh-green-vegetables-zucchini-lettuce-cabbage.png"
          alt="Fresh vegetables"
          fill
          className="object-cover"
        />
      </div>

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

          {errors.general && <p className="text-red-600 text-sm mb-4">{errors.general}</p>}

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
