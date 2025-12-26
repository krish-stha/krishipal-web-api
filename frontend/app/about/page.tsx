import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-center mb-6">About Krishipal</h1>
          <p className="text-center text-gray-600 max-w-3xl mx-auto mb-16 text-lg leading-relaxed">
            Krishipal is your go-to platform for all things agriculture. Whether you are a farmer, agronomist, or
            gardening enthusiast, we provide a wide range of products and resources to support your agricultural needs.
          </p>

          {/* Our Mission Section */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                Our mission is to empower farmers and agriculturalists by providing them with high-quality products,
                expert advice, and a platform to connect and share knowledge.
              </p>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-lg">
              <Image src="/images/farmers-working-in-green-rice-paddy-field.png" alt="Farmers in field" fill className="object-cover" />
            </div>
          </div>

          {/* Our Vision Section */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-lg order-2 md:order-1">
              <Image src="/images/modern-greenhouse-agricultural-technology.png" alt="Modern agriculture" fill className="object-cover" />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                We envision a sustainable agricultural ecosystem where technology meets tradition, fostering innovation
                and growth in agriculture.
              </p>
            </div>
          </div>

          {/* Agriculture Blogs Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">Agriculture Blogs</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Explore our collection of insightful agriculture blogs, covering a wide range of topics including farming
              techniques, crop management, agricultural news, and more.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Stay informed and connected with the latest trends and developments in agriculture through our dedicated
              blog section.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
