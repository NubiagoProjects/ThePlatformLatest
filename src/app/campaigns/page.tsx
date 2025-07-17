import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

const campaigns = [
  {
    id: 1,
    title: 'Summer Sale',
    description: 'Up to 50% off on summer essentials',
    discount: '50% OFF',
    endDate: '2024-08-31',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 2,
    title: 'Back to School',
    description: 'Get ready for the new school year with great deals',
    discount: '30% OFF',
    endDate: '2024-09-15',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 3,
    title: 'Tech Deals',
    description: 'Latest gadgets at unbeatable prices',
    discount: '25% OFF',
    endDate: '2024-08-20',
    image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
]

export default function CampaignsPage() {
  return (
    <>
      <Header />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Active Campaigns
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover amazing deals and limited-time offers on your favorite products.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={campaign.image} 
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {campaign.discount}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {campaign.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {campaign.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Ends: {new Date(campaign.endDate).toLocaleDateString()}
                    </span>
                    <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium">
                      Shop Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Subscribe to Campaign Alerts
            </h2>
            <p className="text-gray-600 mb-6">
              Get notified about new campaigns and exclusive offers.
            </p>
            <div className="max-w-md mx-auto flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              />
              <button className="bg-red-600 text-white px-6 py-2 rounded-r-lg hover:bg-red-700 transition-colors font-medium">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
} 