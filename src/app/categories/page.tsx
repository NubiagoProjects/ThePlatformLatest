import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Smartphone, ShirtIcon, Sofa, Home, Brush, Utensils, BookOpen } from 'lucide-react'

const categories = [
  {
    name: 'Electronics',
    icon: Smartphone,
    color: 'bg-blue-100 text-blue-600',
    description: 'Smartphones, laptops, accessories and more',
    productCount: 1250
  },
  {
    name: 'Clothing',
    icon: ShirtIcon,
    color: 'bg-purple-100 text-purple-600',
    description: 'Fashion for men, women and children',
    productCount: 890
  },
  {
    name: 'Furniture',
    icon: Sofa,
    color: 'bg-amber-100 text-amber-600',
    description: 'Home and office furniture',
    productCount: 456
  },
  {
    name: 'Home & Kitchen',
    icon: Home,
    color: 'bg-green-100 text-green-600',
    description: 'Appliances and kitchen essentials',
    productCount: 678
  },
  {
    name: 'Beauty',
    icon: Brush,
    color: 'bg-pink-100 text-pink-600',
    description: 'Cosmetics and personal care',
    productCount: 432
  },
  {
    name: 'Groceries',
    icon: Utensils,
    color: 'bg-red-100 text-red-600',
    description: 'Fresh food and household items',
    productCount: 234
  },
  {
    name: 'Books',
    icon: BookOpen,
    color: 'bg-indigo-100 text-indigo-600',
    description: 'Books, magazines and educational materials',
    productCount: 567
  }
]

export default function CategoriesPage() {
  return (
    <>
      <Header />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              All Categories
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Browse through our comprehensive collection of products organized by categories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div key={category.name} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg ${category.color} mr-4`}>
                    <category.icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {category.productCount} products
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  {category.description}
                </p>
                <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-medium">
                  Browse {category.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
} 