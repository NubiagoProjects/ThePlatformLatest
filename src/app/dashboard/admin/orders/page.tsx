'use client'

import { useState } from 'react';
import { Eye, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  items: number;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
}

const mockOrders: Order[] = [
  { id: 'ORD-001', customerName: 'John Doe', customerEmail: 'john@example.com', total: 1299, status: 'Delivered', date: '2024-06-01', items: 2, paymentStatus: 'Paid' },
  { id: 'ORD-002', customerName: 'Jane Smith', customerEmail: 'jane@example.com', total: 899, status: 'Shipped', date: '2024-06-02', items: 1, paymentStatus: 'Paid' },
  { id: 'ORD-003', customerName: 'Bob Johnson', customerEmail: 'bob@example.com', total: 2499, status: 'Processing', date: '2024-06-03', items: 1, paymentStatus: 'Paid' },
  { id: 'ORD-004', customerName: 'Alice Brown', customerEmail: 'alice@example.com', total: 349, status: 'Pending', date: '2024-06-04', items: 1, paymentStatus: 'Pending' },
  { id: 'ORD-005', customerName: 'Mike Wilson', customerEmail: 'mike@example.com', total: 189, status: 'Cancelled', date: '2024-06-05', items: 1, paymentStatus: 'Failed' },
  { id: 'ORD-006', customerName: 'Sarah Davis', customerEmail: 'sarah@example.com', total: 1199, status: 'Delivered', date: '2024-06-06', items: 1, paymentStatus: 'Paid' },
  { id: 'ORD-007', customerName: 'Tom Miller', customerEmail: 'tom@example.com', total: 999, status: 'Shipped', date: '2024-06-07', items: 2, paymentStatus: 'Paid' },
  { id: 'ORD-008', customerName: 'Lisa Garcia', customerEmail: 'lisa@example.com', total: 129, status: 'Processing', date: '2024-06-08', items: 1, paymentStatus: 'Paid' },
];

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [orders] = useState<Order[]>(mockOrders);

  const statuses = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const filtered = orders.filter(order =>
    (order.customerName.toLowerCase().includes(search.toLowerCase()) ||
     order.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
     order.id.toLowerCase().includes(search.toLowerCase())) &&
    (selectedStatus === 'All' || order.status === selectedStatus)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Processing': return 'bg-blue-100 text-blue-700';
      case 'Shipped': return 'bg-purple-100 text-purple-700';
      case 'Delivered': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock size={16} />;
      case 'Processing': return <Package size={16} />;
      case 'Shipped': return <Truck size={16} />;
      case 'Delivered': return <CheckCircle size={16} />;
      case 'Cancelled': return <Clock size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <div className="text-sm text-gray-600">
          Total Orders: {orders.length}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search orders by customer, email, or order ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-lg w-80"
        />
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold">${orders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Pending Orders</p>
          <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'Pending').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Processing</p>
          <p className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'Processing').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Delivered</p>
          <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'Delivered').length}</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-4 text-left">Order ID</th>
              <th className="p-4 text-left">Customer</th>
              <th className="p-4 text-left">Total</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Payment</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div>
                    <p className="font-medium text-gray-900">{order.id}</p>
                    <p className="text-sm text-gray-500">{order.items} items</p>
                  </div>
                </td>
                <td className="p-4">
                  <div>
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-sm text-gray-500">{order.customerEmail}</p>
                  </div>
                </td>
                <td className="p-4 font-bold">${order.total}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600">{order.date}</td>
                <td className="p-4 text-right">
                  <button className="text-blue-600 hover:text-blue-800" title="View Order Details">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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