/**
 * Admin Payment Overrides & Webhook Management
 * Manual payment status changes and webhook resend functionality
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  Send, 
  Edit, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Settings,
  Webhook,
  History,
  User,
  DollarSign,
  Shield,
  Eye,
  ExternalLink
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PaymentIntent {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  country: string;
  provider: string;
  phone_number: string;
  status: 'initiated' | 'pending' | 'confirmed' | 'failed';
  tx_hash?: string;
  created_at: string;
}

interface WebhookLog {
  id: string;
  payment_intent_id: string;
  webhook_type: string;
  status: string;
  payload: any;
  processed_at: string;
  wallet_credited: boolean;
}

interface AdminOverride {
  payment_id: string;
  old_status: string;
  new_status: string;
  reason: string;
  admin_notes?: string;
  timestamp: string;
}

export default function AdminPaymentOverridesPage() {
  const [selectedPayment, setSelectedPayment] = useState<PaymentIntent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PaymentIntent[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');

  // Search payments
  const searchPayments = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_intents')
        .select('*')
        .or(`id.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,tx_hash.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load webhook logs for selected payment
  const loadWebhookLogs = async (paymentId: string) => {
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('payment_intent_id', paymentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhookLogs(data || []);
    } catch (error) {
      console.error('Error loading webhook logs:', error);
    }
  };

  // Manual status override
  const overridePaymentStatus = async (newStatus: string) => {
    if (!selectedPayment || !overrideReason.trim()) return;

    try {
      // Update payment status
      const { error: updateError } = await supabase
        .from('payment_intents')
        .update({ status: newStatus })
        .eq('id', selectedPayment.id);

      if (updateError) throw updateError;

      // Log the override
      await logAdminOverride({
        payment_id: selectedPayment.id,
        old_status: selectedPayment.status,
        new_status: newStatus,
        reason: overrideReason,
        admin_notes: adminNotes,
        timestamp: new Date().toISOString()
      });

      // If confirming payment, attempt to credit wallet
      if (newStatus === 'confirmed') {
        await creditUserWallet();
      }

      alert(`Payment status updated to ${newStatus}`);
      setShowOverrideModal(false);
      setOverrideReason('');
      setAdminNotes('');
      
      // Refresh payment data
      setSelectedPayment({ ...selectedPayment, status: newStatus as any });

    } catch (error) {
      console.error('Error overriding payment status:', error);
      alert('Failed to update payment status');
    }
  };

  // Credit user wallet manually
  const creditUserWallet = async () => {
    if (!selectedPayment) return;

    try {
      const response = await fetch('/api/admin/credit-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedPayment.user_id,
          amount: selectedPayment.amount,
          currency: 'USDC',
          description: `Manual credit - Payment ${selectedPayment.id}`,
          reference: selectedPayment.tx_hash
        })
      });

      if (!response.ok) {
        throw new Error('Failed to credit wallet');
      }

      alert('User wallet credited successfully');
    } catch (error) {
      console.error('Error crediting wallet:', error);
      alert('Failed to credit wallet');
    }
  };

  // Resend webhook
  const resendWebhook = async () => {
    if (!selectedPayment) return;

    try {
      const response = await fetch('/api/admin/resend-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          webhookType: 'manual_resend'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to resend webhook');
      }

      alert('Webhook resent successfully');
      loadWebhookLogs(selectedPayment.id);
    } catch (error) {
      console.error('Error resending webhook:', error);
      alert('Failed to resend webhook');
    }
  };

  // Log admin override
  const logAdminOverride = async (override: AdminOverride) => {
    try {
      await supabase
        .from('admin_overrides')
        .insert([{
          payment_intent_id: override.payment_id,
          old_status: override.old_status,
          new_status: override.new_status,
          reason: override.reason,
          admin_notes: override.admin_notes,
          admin_id: 'current-admin-id', // Replace with actual admin ID
          created_at: override.timestamp
        }]);
    } catch (error) {
      console.error('Error logging admin override:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'initiated': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'initiated': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    if (selectedPayment) {
      loadWebhookLogs(selectedPayment.id);
    }
  }, [selectedPayment]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Overrides & Webhook Management</h1>
          <p className="text-gray-600">Manual payment management and webhook resend functionality</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Search & Payment Selection */}
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Find Payment</h2>
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by payment ID, phone, or tx hash..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchPayments()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={searchPayments}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search'}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Search Results</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {searchResults.map((payment) => (
                    <div
                      key={payment.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedPayment?.id === payment.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">
                              ${payment.amount.toFixed(2)} {payment.currency}
                            </p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                              {getStatusIcon(payment.status)}
                              <span className="ml-1 capitalize">{payment.status}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{payment.provider} • {payment.phone_number}</p>
                          <p className="text-xs text-gray-500 font-mono">{payment.id.slice(0, 16)}...</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Details & Actions */}
          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Payment ID</p>
                      <p className="text-sm text-gray-900 font-mono">{selectedPayment.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Status</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                        {getStatusIcon(selectedPayment.status)}
                        <span className="ml-1 capitalize">{selectedPayment.status}</span>
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Amount</p>
                      <p className="text-sm text-gray-900">${selectedPayment.amount.toFixed(2)} {selectedPayment.currency}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Provider</p>
                      <p className="text-sm text-gray-900">{selectedPayment.provider}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Phone</p>
                      <p className="text-sm text-gray-900">{selectedPayment.phone_number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Country</p>
                      <p className="text-sm text-gray-900">{selectedPayment.country}</p>
                    </div>
                  </div>
                  {selectedPayment.tx_hash && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Transaction Hash</p>
                      <p className="text-sm text-gray-900 font-mono break-all">{selectedPayment.tx_hash}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowOverrideModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Override Status
                  </button>

                  <button
                    onClick={resendWebhook}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Resend Webhook
                  </button>

                  {selectedPayment.status === 'confirmed' && (
                    <button
                      onClick={creditUserWallet}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Credit Wallet
                    </button>
                  )}
                </div>
              </div>

              {/* Webhook Logs */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Webhook Logs</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {webhookLogs.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No webhook logs found for this payment
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {webhookLogs.map((log) => (
                        <div key={log.id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{log.webhook_type}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {log.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.processed_at).toLocaleString()}
                          </div>
                          {log.wallet_credited && (
                            <div className="text-xs text-green-600 mt-1">
                              ✓ Wallet credited
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Override Modal */}
        {showOverrideModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
                <h3 className="text-lg font-semibold">Override Payment Status</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Status
                  </label>
                  <select
                    value={pendingStatus}
                    onChange={(e) => setPendingStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select new status</option>
                    <option value="initiated">Initiated</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (Required)
                  </label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g., Customer contacted support, manual verification"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Additional notes about this override..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => overridePaymentStatus(pendingStatus)}
                  disabled={!pendingStatus || !overrideReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Override Status
                </button>
                <button
                  onClick={() => {
                    setShowOverrideModal(false);
                    setPendingStatus('');
                    setOverrideReason('');
                    setAdminNotes('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 