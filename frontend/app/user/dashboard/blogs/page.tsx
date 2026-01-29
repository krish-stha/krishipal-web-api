import { Header } from "@/app/user/component/header"
import { Footer } from "@/app/user/component/footer"

export default function BlogsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-center mb-6 text-green-700">Agriculture Blogs</h1>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-16">
            Stay informed with the latest farming techniques, agricultural news, and expert insights.
          </p>

          <div className="text-center py-12">
            <p className="text-gray-500">Blog posts coming soon...</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
