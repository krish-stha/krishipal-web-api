import Image from "next/image"
import { Header } from "../../component/header"
import { Card, CardContent } from "@/app/auth/components/ui/card"
import { Button } from "@/app/auth/components/ui/button"
import { Footer } from "../../component/footer"


export default function ShopPage() {
  const categories = [
    { id: 1, name: "Seeds", icon: "🌱", image: "/images/assorted-seeds.png" },
    { id: 2, name: "Fertilizers", icon: "🧪", image: "/images/fertilizers-variety.png" },
    { id: 3, name: "Tools", icon: "🔧", image: "/images/tool.png" },
    { id: 4, name: "Pesticides", icon: "🛡️", image: "/images/pesticide-application.png" },
    { id: 5, name: "Irrigation", icon: "💧", image: "/images/agricultural-irrigation.png" },
    { id: 6, name: "Equipment", icon: "🚜", image: "/images/vintage-farm-equipment.png" },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Featured Products */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Cabbage Seed Card */}
              <Card className="overflow-hidden bg-gray-100">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">100% Organic</p>
                      <h2 className="text-4xl font-bold mb-4">Cabbage Seed</h2>
                      <p className="text-gray-600 mb-2">Starting At</p>
                      <p className="text-3xl font-bold text-red-600 mb-6">Rs. 150</p>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">Shop Now →</Button>
                    </div>
                    <div className="relative w-64 h-64">
                      <Image
                        src="/images/organic-cabbage-seeds-in-white-bowl.png"
                        alt="Cabbage seeds"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bitter Gourd Seed Card */}
              <Card className="overflow-hidden bg-blue-100">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-4xl font-bold mb-4">Bitter Gourd Seed</h2>
                      <p className="text-gray-600 mb-2">Starting At</p>
                      <p className="text-gray-600 mb-2">Starting At</p>
                      <p className="text-3xl font-bold text-red-600 mb-6">Rs 200</p>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">Shop Now →</Button>
                    </div>
                    <div className="relative w-64 h-64">
                      <Image src="/images/bitter-gourd-seeds.png" alt="Bitter gourd seeds" fill className="object-contain" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* View All Products */}
            <div className="bg-yellow-50 rounded-2xl p-12 text-center mb-12">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-lg">
                View All Products →
              </Button>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-6">Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {categories.map((category) => (
                  <div key={category.id} className="group cursor-pointer">
                    <div className="relative aspect-square bg-white/30 backdrop-blur-sm border-2 border-green-200 rounded-lg p-6 flex items-center justify-center hover:border-green-500 hover:bg-green-50/50 transition-all duration-300 shadow-sm hover:shadow-md">
                      <div className="relative w-full h-full">
                        <Image
                          src={category.image || "/placeholder.svg"}
                          alt={category.name}
                          fill
                          className="object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    </div>
                    <p className="text-center mt-3 font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                      {category.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest Blogs Section */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Latest Blogs</h2>
              <p className="text-gray-600 mb-6">
                Present posts in a best way to highlight interesting moments of your blog.
              </p>
              <p className="text-gray-600 mb-6">
                Stay informed and connected with the latest trends and developments in agriculture through our dedicated
                blog section.
              </p>

              {/* <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"> */}
                {/* <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                > */}
                  {/* <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  /> */}
                {/* </svg> */}
                {/* <p className="text-red-800 text-sm"></p> */}
              {/* </div> */}
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold">Free Shipping</h3>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold">Best Price</h3>
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
                <h3 className="font-semibold">Free Curbside Pickup</h3>
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
                <h3 className="font-semibold">24/7 Support</h3>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
