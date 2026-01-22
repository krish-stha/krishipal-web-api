"use client"

import { useState } from "react"
import { Header } from "../../component/header"
import { Input } from "@/app/auth/components/ui/input"
import { Button } from "@/app/auth/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select"
import { Footer } from "../../component/footer"


export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("seed")

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-8 text-green-700">All Products</h1>

          <div className="flex flex-wrap gap-4 items-center mb-12">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[300px] max-w-2xl border-blue-400 border-2 focus:border-blue-500"
              placeholder="Search products..."
            />
            <Button className="bg-green-600 hover:bg-green-700 text-white px-8">Search</Button>
            <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 px-8 bg-transparent">
              Clear
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">Category</span>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="seeds">Seeds</SelectItem>
                  <SelectItem value="fertilizers">Fertilizers</SelectItem>
                  <SelectItem value="tools">Tools</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Results would go here */}
          <div className="text-center text-gray-500 py-12">
            <p>Search results will appear here</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
