import { Header } from "@/app/auth/user/component/header"
import { Footer } from "@/app/auth/user/component/footer"

export default function CartPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
            <p className="text-gray-400">Add some products to get started!</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
