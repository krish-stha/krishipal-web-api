export const validationRules = {
  email: {
    validate: (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!email.trim()) return "Email is required"
      if (!emailRegex.test(email)) return "Please enter a valid email address"
      return ""
    },
  },
  password: {
    validate: (password: string) => {
      if (!password) return "Password is required"
      if (password.length < 8) return "Password must be at least 8 characters"
      if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter"
      if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter"
      if (!/[0-9]/.test(password)) return "Password must contain a number"
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain a special character"
      return ""
    },
  },
  passwordMatch: {
    validate: (password: string, confirmPassword: string) => {
      if (password !== confirmPassword) return "Passwords do not match"
      return ""
    },
  },
  fullName: {
    validate: (name: string) => {
      if (!name.trim()) return "Full name is required"
      if (name.trim().length < 2) return "Full name must be at least 2 characters"
      return ""
    },
  },
  phone: {
    validate: (phone: string) => {
      if (!phone.trim()) return "Phone number is required"
      if (!/^\d{6,15}$/.test(phone.replace(/[\s\-()]/g, ""))) return "Please enter a valid phone number"
      return ""
    },
  },
  address: {
    validate: (address: string) => {
      if (!address.trim()) return "Address is required"
      if (address.trim().length < 5) return "Address must be at least 5 characters"
      return ""
    },
  },
}
