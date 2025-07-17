/**
 * Admin Withdrawal Management Dashboard
 * View, approve, reject, and manage withdrawal requests
 * Monitor withdrawal statistics and process payments
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Check, 
  X, 
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Send,
  Shield,
  User,
  Calendar,
  CreditCard
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  to_wallet: string;
  withdrawal_method: string;
  status: 'requested' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  processed_at?: string;
  processed_by?: string;
  admin_notes?: string;
  transaction_hash?: string;
  fee_amount: number;
  net_amount: number;
  auto_approved: boolean;
  destination_details: any;
}

interface WithdrawalStats {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  total_amount: number;
  approved_amount: number;
  average_amount: number;
  auto_approved_count: number;
  manual_approved_count: number;
}

interface FilterState {
  status: string;
  method: string;
  dateFrom: string;
  dateTo: string;
  searchTerm: string;
  autoApproved: string;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    status: '',
    method: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: '',
    autoApproved: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  // Load withdrawals with filters
  const loadWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.method) {
        query = query.eq('withdrawal_method', filters.method);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.autoApproved === 'true') {
        query = query.eq('auto_approved', true);
      } else if (filters.autoApproved === 'false') {
        query = query.eq('auto_approved', false);
      }
      if (filters.searchTerm) {
        query = query.or(`to_wallet.ilike.%${filters.searchTerm}%,user_id.ilike.%${filters.searchTerm}%,transaction_hash.ilike.%${filters.searchTerm}%`);
      }

      // Apply pagination
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setWithdrawals(data || []);
      setPagination(prev => ({ ...prev, total: count || 0 }));

    } catch (error) {
      console.error('Error loading withdrawals:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  // Load withdrawal statistics
  const loadStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_withdrawal_statistics');

      if (error) throw error;
      setStats(data[0] || null);

    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  // Process withdrawal approval/rejection
  const processWithdrawal = async () => {
    if (!selectedWithdrawal) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .rpc('admin_process_withdrawal', {
          p_withdrawal_id: selectedWithdrawal.id,
          p_action: approvalAction,
          p_admin_notes: adminNotes,
          p_admin_id: 'current-admin-id' // Replace with actual admin ID
        });

      if (error) throw error;

      alert(`Withdrawal ${approvalAction}d successfully`);
      setShowApprovalModal(false);
      setAdminNotes('');
      
      // Refresh data
      await loadWithdrawals();
      await loadStats();

    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert('Failed to process withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  // Export withdrawals to CSV
  const exportWithdrawals = () => {
    const csvHeaders = 'ID,User ID,Amount,Currency,Method,Status,Created At,Processed At,Auto Approved\n';
    const csvData = withdrawals.map(w => 
      `${w.id},${w.user_id},${w.amount},${w.currency},${w.withdrawal_method},${w.status},${w.created_at},${w.processed_at || ''},${w.auto_approved}`
    ).join('\n');
    
    const blob = new Blob([csvHeaders + csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `withdrawals_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load data on mount
  useEffect(() => {
    loadWithdrawals();
    loadStats();
  }, [loadWithdrawals, loadStats]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="w-4 h-4 text-green-600" />;
      case 'approved': return <Check className="w-4 h-4 text-blue-600" />;
      case 'rejected': return <X className="w-4 h-4 text-red-600" />;
      case 'failed': return <X className="w-4 h-4 text-red-600" />;
      case 'processing': return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />;
      case 'requested': return <Clock className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'requested': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdrawal Management</h1>
        <p className="text-gray-600">Monitor and process user withdrawal requests</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_requests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_requests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved_requests}</p>
                <p className="text-sm text-gray-500">${stats.approved_amount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Auto-Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.auto_approved_count}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by wallet, user ID, or tx hash..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-64"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="requested">Requested</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>

              {/* Method Filter */}
              <select
                value={filters.method}
                onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Methods</option>
                <option value="crypto">Crypto</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank">Bank Transfer</option>
              </select>

              {/* Auto-Approved Filter */}
              <select
                value={filters.autoApproved}
                onChange={(e) => setFilters(prev => ({ ...prev, autoApproved: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="true">Auto-Approved</option>
                <option value="false">Manual Review</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={loadWithdrawals}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                onClick={exportWithdrawals}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                      Loading withdrawals...
                    </div>
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No withdrawal requests found
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {withdrawal.user_id.slice(0, 8)}...
                          </div>
                          <div className="text-sm text-gray-500 font-mono">
                            {withdrawal.id.slice(0, 8)}...
                          </div>
                          {withdrawal.auto_approved && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Auto
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${withdrawal.amount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Fee: ${withdrawal.fee_amount.toFixed(2)}
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        Net: ${withdrawal.net_amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {withdrawal.withdrawal_method.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-gray-500">{withdrawal.currency}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                        {getStatusIcon(withdrawal.status)}
                        <span className="ml-1 capitalize">{withdrawal.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(withdrawal.created_at).toLocaleDateString()}
                      <br />
                      {new Date(withdrawal.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedWithdrawal(withdrawal);
                            setShowDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {withdrawal.status === 'requested' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setApprovalAction('approve');
                                setShowApprovalModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setApprovalAction('reject');
                                setShowApprovalModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {withdrawals.length} of {pagination.total} requests
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Withdrawal Request Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Request ID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedWithdrawal.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User ID</label>
                    <p className="text-sm text-gray-900">{selectedWithdrawal.user_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className="text-sm text-gray-900">${selectedWithdrawal.amount.toFixed(2)} {selectedWithdrawal.currency}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Net Amount</label>
                    <p className="text-sm text-gray-900">${selectedWithdrawal.net_amount.toFixed(2)} {selectedWithdrawal.currency}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Method</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedWithdrawal.withdrawal_method.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedWithdrawal.status)}`}>
                      {getStatusIcon(selectedWithdrawal.status)}
                      <span className="ml-1 capitalize">{selectedWithdrawal.status}</span>
                    </span>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Destination</label>
                    <p className="text-sm text-gray-900 font-mono break-all">{selectedWithdrawal.to_wallet}</p>
                  </div>
                  {selectedWithdrawal.transaction_hash && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Transaction Hash</label>
                      <p className="text-sm text-gray-900 font-mono break-all">{selectedWithdrawal.transaction_hash}</p>
                    </div>
                  )}
                  {selectedWithdrawal.admin_notes && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                      <p className="text-sm text-gray-900">{selectedWithdrawal.admin_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold">
                {approvalAction === 'approve' ? 'Approve' : 'Reject'} Withdrawal
              </h3>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to {approvalAction} this withdrawal request for ${selectedWithdrawal.amount.toFixed(2)} {selectedWithdrawal.currency}?
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Notes {approvalAction === 'reject' ? '(Required)' : '(Optional)'}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={`Enter reason for ${approvalAction}...`}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={processWithdrawal}
                disabled={processing || (approvalAction === 'reject' && !adminNotes.trim())}
                className={`flex-1 px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 ${
                  approvalAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing ? (
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  `${approvalAction === 'approve' ? 'Approve' : 'Reject'} Withdrawal`
                )}
              </button>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setAdminNotes('');
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 