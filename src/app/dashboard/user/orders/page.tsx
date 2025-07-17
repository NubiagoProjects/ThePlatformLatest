import type { Metadata } from 'next'
import { BaseTable } from '@/components/ui/BaseTable'
import { BaseBadge } from '@/components/ui/BaseBadge'

export const metadata: Metadata = {
  title: 'My Orders - Order History & Tracking | Nubiago',
  description: 'View your order history, track deliveries, and manage your purchases on Nubiago.',
  robots: {
    index: false,
    follow: false,
  },
}

// Mock orders data - replace with real API call
const getOrders = async () => {
  return [
    {
      id: 'ORD-001',
      date: '2025-01-20',
      status: 'Delivered',
      total: 89.99,
      items: 2,
      tracking: 'TRK123456789',
      deliveryDate: '2025-01-22',
    },
    {
      id: 'ORD-002',
      date: '2025-01-18',
      status: 'In Transit',
      total: 199.99,
      items: 1,
      tracking: 'TRK987654321',
      deliveryDate: '2025-01-25',
    },
    {
      id: 'ORD-003',
      date: '2025-01-15',
      status: 'Processing',
      total: 45.50,
      items: 3,
      tracking: null,
      deliveryDate: null,
    },
    {
      id: 'ORD-004',
      date: '2025-01-10',
      status: 'Delivered',
      total: 125.75,
      items: 1,
      tracking: 'TRK456789123',
      deliveryDate: '2025-01-12',
    },
  ]
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Delivered':
      return 'success'
    case 'In Transit':
      return 'warning'
    case 'Processing':
      return 'info'
    case 'Cancelled':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export default async function UserOrdersPage() {
  const orders = await getOrders()

  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      sortable: true,
    },
    {
      key: 'date',
      label: 'Order Date',
      sortable: true,
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (value: number) => `$${value.toFixed(2)}`,
    },
    {
      key: 'items',
      label: 'Items',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <BaseBadge variant={getStatusColor(value) as any}>
          {value}
        </BaseBadge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: any) => (
        <div className="flex gap-2">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View Details
          </button>
          {row.tracking && (
            <button className="text-green-600 hover:text-green-700 text-sm font-medium">
              Track
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          My Orders
        </h1>
        <p className="text-gray-600">
          Track your orders and view order history
        </p>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <BaseTable
          data={orders}
          columns={columns}
          sortable={true}
          pagination={true}
          itemsPerPage={10}
        />
      </div>

      {/* Order Statistics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'Delivered').length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Transit</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'In Transit').length}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                ${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 