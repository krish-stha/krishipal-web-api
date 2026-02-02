import Link from "next/link"
import Image from "next/image"
import { Header } from "./user/component/header"
import { Button } from "./auth/components/ui/button"
import { Footer } from "./user/component/footer"



export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-green-800 via-green-700 to-green-600 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-lg mb-4 text-green-100">Namaste, KrishiPal.</h2>
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
                  Smarter seeds, bigger harvests  KrishiPal guides your farm to success.
                </h1>
                <Link href="/shop">
                  <Button className="bg-green-500 hover:bg-green-400 text-white px-8 py-6 text-lg rounded-full">
                    Explore
                  </Button>
                </Link>
              </div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                <Image src="/images/green-plant-sprouting-from-tree-bark.png" alt="Plant growing on tree" fill className="object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Free Shipping</h3>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Best Price</h3>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Free Curbside Pickup</h3>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">24/7 Support</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Signup CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-3xl p-12 text-white">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-green-400 mb-2">Hoyy!!</p>
                  <h2 className="text-3xl font-bold mb-6">Signup to know more!</h2>
                  <Link href="/signup">
                    <Button
                      variant="outline"
                      className="bg-transparent border-white text-white hover:bg-white hover:text-slate-800 px-8 py-6 text-lg"
                    >
                      Signup
                    </Button>
                  </Link>
                </div>
                <div className="relative h-[300px]">
                  <Image src="/images/happy-farmer-with-vegetables-pumpkin-tomatoes-corn.png" alt="Farmer illustration" fill className="object-contain" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Error Message Section
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-800 text-sm">Error! Please Reload the page</p>
            </div>
          </div>
        </section> */}

        {/* Explore Button */}
        <section className="py-8 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <Button className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-lg">Explore →</Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
