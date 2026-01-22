"use client"

import type React from "react"
import { useState, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Home } from "lucide-react"
import { Button } from "@/app/auth/components/ui/button"
import { Input } from "@/app/auth/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/auth/components/ui/select"
import { validationRules } from "@/lib/validation"
import { useToast } from "@/hooks/use-toast"

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    countryCode: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateField = (field: string, value: string) => {
    let error = ""
    if (field === "fullName") {
      error = validationRules.fullName.validate(value)
    } else if (field === "email") {
      error = validationRules.email.validate(value)
    } else if (field === "phone") {
      error = validationRules.phone.validate(value)
    } else if (field === "address") {
      error = validationRules.address.validate(value)
    } else if (field === "password") {
      error = validationRules.password.validate(value)
    } else if (field === "confirmPassword") {
      error = validationRules.passwordMatch.validate(formData.password, value)
    }
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    validateField(name, value)
  }

  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
   console.log("👉 handleSubmit called")
  setErrors({})

  // Validate fields
  const newErrors: Record<string, string> = {
    fullName: validationRules.fullName.validate(formData.fullName),
    email: validationRules.email.validate(formData.email),
    phone: validationRules.phone.validate(formData.phone),
    address: validationRules.address.validate(formData.address),
    password: validationRules.password.validate(formData.password),
    confirmPassword: validationRules.passwordMatch.validate(formData.password, formData.confirmPassword),
  }

  const filteredErrors = Object.fromEntries(Object.entries(newErrors).filter(([, v]) => v))

  if (Object.keys(filteredErrors).length > 0) {
    setErrors(filteredErrors)
    return
  }

  // Call API
  try {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    fullName: formData.fullName,
    email: formData.email,
    countryCode: formData.countryCode,
    phone: formData.phone,
    address: formData.address,
    password: formData.password,
  }),
})



    const data = await response.json()

    if (!response.ok) {
      toast({
        title: "Registration Failed",
        description: data.message || "Something went wrong.",
      })
      return
    }

    toast({
      title: "Registration Successful",
      description: "Your account has been created successfully. Redirecting to login...",
    })

    setTimeout(() => {
      router.push("/auth/login")
    }, 1500)
  } catch (error) {
    toast({
      title: "Network Error",
      description: "Unable to reach the server. Please try again later.",
    })
  }
}


  const isFormValid =
    Object.values(errors).every((error) => !error) &&
    formData.fullName &&
    formData.email &&
    formData.phone &&
    formData.address &&
    formData.password &&
    formData.confirmPassword


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

      {/* Right side - Signup Form */}
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
            Welcome!
          </h1>
          <p className="text-gray-600 mb-8">Register to create an account</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                type="text"
                name="fullName"
                placeholder="Full Name"
                className={`w-full bg-gray-50 border-gray-200 ${errors.fullName ? "border-red-500" : ""}`}
                value={formData.fullName}
                onChange={handleInputChange}
              />
              {errors.fullName && <p className="text-red-600 text-sm mt-2">{errors.fullName}</p>}
            </div>

            <div>
              <Input
                type="email"
                name="email"
                placeholder="Email"
                className={`w-full bg-gray-50 border-gray-200 ${errors.email ? "border-red-500" : ""}`}
                value={formData.email}
                onChange={handleInputChange}
              />
              {errors.email && <p className="text-red-600 text-sm mt-2">{errors.email}</p>}
            </div>

            <div className="flex gap-2">
              <Select
                value={formData.countryCode}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, countryCode: value }))}
              >
                <SelectTrigger className="w-[120px] bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+1">+1 (US)</SelectItem>
                  <SelectItem value="+44">+44 (UK)</SelectItem>
                  <SelectItem value="+91">+91 (IN)</SelectItem>
                  <SelectItem value="+977">+977 (NP)</SelectItem>
                  <SelectItem value="+86">+86 (CN)</SelectItem>
                  <SelectItem value="+81">+81 (JP)</SelectItem>
                  <SelectItem value="+82">+82 (KR)</SelectItem>
                  <SelectItem value="+61">+61 (AU)</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1">
                <Input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  className={`w-full bg-gray-50 border-gray-200 ${errors.phone ? "border-red-500" : ""}`}
                  value={formData.phone}
                  onChange={handleInputChange}
                />
                {errors.phone && <p className="text-red-600 text-sm mt-2">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <Input
                type="text"
                name="address"
                placeholder="Address"
                className={`w-full bg-gray-50 border-gray-200 ${errors.address ? "border-red-500" : ""}`}
                value={formData.address}
                onChange={handleInputChange}
              />
              {errors.address && <p className="text-red-600 text-sm mt-2">{errors.address}</p>}
            </div>

            <div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  className={`w-full bg-gray-50 border-gray-200 pr-10 ${errors.password ? "border-red-500" : ""}`}
                  value={formData.password}
                  onChange={handleInputChange}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {errors.password && <p className="text-red-600 text-sm mt-2">{errors.password}</p>}
            </div>

            <div>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  className={`w-full bg-gray-50 border-gray-200 pr-10 ${
                    errors.confirmPassword ? "border-red-500" : ""
                  }`}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {errors.confirmPassword && <p className="text-red-600 text-sm mt-2">{errors.confirmPassword}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
              disabled={false} 
            >
              Register
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
            Already have an account?{" "}
            <Link href="/login" className="text-green-600 hover:underline font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
