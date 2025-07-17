'use client'

import { useState } from 'react';
import { Edit, Trash2, Eye, Plus } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  supplier: string;
  status: 'Active' | 'Inactive' | 'Out of Stock';
}

const mockProducts: Product[] = [
  { id: '1', name: 'iPhone 15 Pro', category: 'Electronics', price: 999, stock: 45, supplier: 'Apple Store', status: 'Active' },
  { id: '2', name: 'Samsung Galaxy S24', category: 'Electronics', price: 899, stock: 32, supplier: 'Samsung', status: 'Active' },
  { id: '3', name: 'MacBook Air M2', category: 'Computers', price: 1199, stock: 0, supplier: 'Apple Store', status: 'Out of Stock' },
  { id: '4', name: 'Nike Air Max', category: 'Footwear', price: 129, stock: 78, supplier: 'Nike Store', status: 'Active' },
  { id: '5', name: 'Sony WH-1000XM5', category: 'Electronics', price: 349, stock: 23, supplier: 'Sony', status: 'Active' },
  { id: '6', name: 'Adidas Ultraboost', category: 'Footwear', price: 189, stock: 12, supplier: 'Adidas', status: 'Active' },
  { id: '7', name: 'Dell XPS 13', category: 'Computers', price: 999, stock: 8, supplier: 'Dell', status: 'Active' },
  { id: '8', name: 'Canon EOS R6', category: 'Electronics', price: 2499, stock: 5, supplier: 'Canon', status: 'Active' },
];

export default function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Electronics', 'Computers', 'Footwear', 'Clothing', 'Home & Garden'];

  const filtered = products.filter(product =>
    (product.name.toLowerCase().includes(search.toLowerCase()) ||
     product.supplier.toLowerCase().includes(search.toLowerCase())) &&
    (selectedCategory === 'All' || product.category === selectedCategory)
  );

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Inactive': return 'bg-red-100 text-red-700';
      case 'Out of Stock': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-lg w-64"
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Active Products</p>
          <p className="text-2xl font-bold text-green-600">{products.filter(p => p.status === 'Active').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Out of Stock</p>
          <p className="text-2xl font-bold text-yellow-600">{products.filter(p => p.status === 'Out of Stock').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold">${products.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-4 text-left">Product</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Price</th>
              <th className="p-4 text-left">Stock</th>
              <th className="p-4 text-left">Supplier</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">ID: {product.id}</p>
                  </div>
                </td>
                <td className="p-4">{product.category}</td>
                <td className="p-4">${product.price}</td>
                <td className="p-4">{product.stock}</td>
                <td className="p-4">{product.supplier}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(product.status)}`}>
                    {product.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button className="text-blue-600 hover:text-blue-800" title="View">
                    <Eye size={16} />
                  </button>
                  <button className="text-yellow-600 hover:text-yellow-800" title="Edit">
                    <Edit size={16} />
                  </button>
                  <button 
                    className="text-red-600 hover:text-red-800" 
                    title="Delete"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 size={16} />
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