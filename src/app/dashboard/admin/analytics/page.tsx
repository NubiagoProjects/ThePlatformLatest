'use client'

import { useState } from 'react';
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Package } from 'lucide-react';
import Link from 'next/link';

interface AnalyticsData {
  period: string;
  revenue: number;
  orders: number;
  users: number;
  products: number;
}

const mockAnalytics: AnalyticsData[] = [
  { period: 'Jan', revenue: 45000, orders: 120, users: 89, products: 45 },
  { period: 'Feb', revenue: 52000, orders: 135, users: 102, products: 52 },
  { period: 'Mar', revenue: 48000, orders: 128, users: 95, products: 48 },
  { period: 'Apr', revenue: 61000, orders: 156, users: 118, products: 61 },
  { period: 'May', revenue: 58000, orders: 142, users: 108, products: 58 },
  { period: 'Jun', revenue: 72000, orders: 180, users: 135, products: 72 },
];

const topProducts = [
  { name: 'iPhone 15 Pro', sales: 234, revenue: 234000 },
  { name: 'Samsung Galaxy S24', sales: 189, revenue: 170100 },
  { name: 'MacBook Air M2', sales: 156, revenue: 187200 },
  { name: 'Nike Air Max', sales: 298, revenue: 38442 },
  { name: 'Sony WH-1000XM5', sales: 145, revenue: 50605 },
];

const topCategories = [
  { name: 'Electronics', sales: 1250, revenue: 1250000 },
  { name: 'Computers', sales: 890, revenue: 890000 },
  { name: 'Footwear', sales: 670, revenue: 100500 },
  { name: 'Clothing', sales: 450, revenue: 67500 },
  { name: 'Home & Garden', sales: 320, revenue: 48000 },
];

export default function AdminAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('6M');

  const currentData = mockAnalytics[mockAnalytics.length - 1];
  const previousData = mockAnalytics[mockAnalytics.length - 2];

  const calculateGrowth = (current: number, previous: number) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const totalRevenue = mockAnalytics.reduce((sum, data) => sum + data.revenue, 0);
  const totalOrders = mockAnalytics.reduce((sum, data) => sum + data.orders, 0);
  const totalUsers = mockAnalytics.reduce((sum, data) => sum + data.users, 0);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <select
          value={selectedPeriod}
          onChange={e => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="1M">Last Month</option>
          <option value="3M">Last 3 Months</option>
          <option value="6M">Last 6 Months</option>
          <option value="1Y">Last Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                {currentData.revenue > previousData.revenue ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${currentData.revenue > previousData.revenue ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateGrowth(currentData.revenue, previousData.revenue)}%
                </span>
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              <div className="flex items-center mt-2">
                {currentData.orders > previousData.orders ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${currentData.orders > previousData.orders ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateGrowth(currentData.orders, previousData.orders)}%
                </span>
              </div>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
              <div className="flex items-center mt-2">
                {currentData.users > previousData.users ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${currentData.users > previousData.users ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateGrowth(currentData.users, previousData.users)}%
                </span>
              </div>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">${(totalRevenue / totalOrders).toFixed(0)}</p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-600">Per order</span>
              </div>
            </div>
            <Package className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <div className="space-y-3">
            {mockAnalytics.map((data, index) => (
              <div key={data.period} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{data.period}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(data.revenue / Math.max(...mockAnalytics.map(d => d.revenue))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">${data.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Orders Trend</h3>
          <div className="space-y-3">
            {mockAnalytics.map((data, index) => (
              <div key={data.period} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{data.period}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(data.orders / Math.max(...mockAnalytics.map(d => d.orders))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{data.orders}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products and Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.sales} sales</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${product.revenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
          <div className="space-y-3">
            {topCategories.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{category.name}</p>
                  <p className="text-sm text-gray-600">{category.sales} sales</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${category.revenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link href="/dashboard/admin">
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            Back to Admin Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
} 