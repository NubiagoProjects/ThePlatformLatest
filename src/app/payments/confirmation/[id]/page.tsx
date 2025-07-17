/**
 * Payment Confirmation Page
 * URL: /payments/confirmation/[id]
 * Shows amount, status, time, receipt, copy ref
 * Supports mobile money and crypto payments
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Copy, 
  Download, 
  Share2, 
  ArrowLeft,
  Smartphone,
  CreditCard,
  Receipt,
  Calendar,
  DollarSign,
  Globe,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PaymentDetails {
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

export default function PaymentConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params?.id as string;

  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  // Load payment details
  const loadPaymentDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('payment_intents')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        setError('Payment not found');
        return;
      }

      setPayment(data);
    } catch (err) {
      console.error('Error loading payment:', err);
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  // Poll for payment updates if pending
  useEffect(() => {
    if (payment?.status === 'pending' || payment?.status === 'initiated') {
      setPolling(true);
      const interval = setInterval(() => {
        loadPaymentDetails();
      }, 5000); // Poll every 5 seconds

      // Stop polling after 10 minutes
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setPolling(false);
      }, 600000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
        setPolling(false);
      };
    }
  }, [payment?.status, loadPaymentDetails]);

  // Initial load
  useEffect(() => {
    if (paymentId) {
      loadPaymentDetails();
    }
  }, [paymentId, loadPaymentDetails]);

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': 
        return <CheckCircle className="w-16 h-16 text-green-600" />;
      case 'failed': 
        return <XCircle className="w-16 h-16 text-red-600" />;
      case 'pending': 
        return <Clock className="w-16 h-16 text-yellow-600" />;
      case 'initiated': 
        return <AlertCircle className="w-16 h-16 text-blue-600" />;
      default: 
        return <AlertCircle className="w-16 h-16 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'initiated': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'confirmed': 
        return {
          title: 'Payment Successful!',
          message: 'Your payment has been confirmed and processed successfully.'
        };
      case 'failed': 
        return {
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please try again or contact support.'
        };
      case 'pending': 
        return {
          title: 'Payment Processing',
          message: 'Your payment is being processed. This may take a few minutes.'
        };
      case 'initiated': 
        return {
          title: 'Payment Initiated',
          message: 'Please complete the payment using your mobile money provider.'
        };
      default: 
        return {
          title: 'Payment Status Unknown',
          message: 'Please check back later or contact support.'
        };
    }
  };

  // Download receipt
  const downloadReceipt = () => {
    if (!payment) return;

    const receiptData = [
      'NUBIAGO PAYMENT RECEIPT',
      '========================',
      '',
      `Payment ID: ${payment.id}`,
      `Date: ${new Date(payment.created_at).toLocaleString()}`,
      `Amount: ${payment.currency} ${payment.amount.toFixed(2)}`,
      `Status: ${payment.status.toUpperCase()}`,
      `Provider: ${payment.provider}`,
      `Country: ${payment.country}`,
      `Phone: ${payment.phone_number}`,
      payment.tx_hash ? `Transaction Hash: ${payment.tx_hash}` : '',
      '',
      '========================',
      'Thank you for using Nubiago!',
      'For support: support@nubiago.com'
    ].filter(Boolean).join('\n');

    const blob = new Blob([receiptData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nubiago-receipt-${payment.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Share payment details
  const sharePayment = async () => {
    if (!payment) return;

    const shareData = {
      title: 'Nubiago Payment Receipt',
      text: `Payment of ${payment.currency} ${payment.amount} via ${payment.provider} - Status: ${payment.status}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying URL
        await copyToClipboard(window.location.href, 'share-url');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The payment you\'re looking for could not be found.'}</p>
          <button
            onClick={() => router.push('/dashboard/user/orders')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View My Payments
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusMessage(payment.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Status Header */}
          <div className={`px-6 py-8 text-center border-b ${getStatusColor(payment.status)}`}>
            <div className="mb-4 flex justify-center">
              {getStatusIcon(payment.status)}
            </div>
            <h1 className="text-2xl font-bold mb-2">{statusInfo.title}</h1>
            <p className="text-lg opacity-90">{statusInfo.message}</p>
            
            {polling && (
              <div className="mt-4 flex items-center justify-center text-sm">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Checking for updates...
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Amount */}
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-xl font-bold text-gray-900">
                    {payment.currency} {payment.amount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <Receipt className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-xl font-bold text-gray-900 capitalize">
                    {payment.status}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(payment.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Provider */}
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <Smartphone className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="text-sm font-bold text-gray-900">{payment.provider}</p>
                  <p className="text-sm text-gray-600">{payment.country}</p>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="space-y-4 mb-6">
              {/* Payment ID */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">Payment ID</p>
                  <p className="text-sm text-gray-600 font-mono">{payment.id}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(payment.id, 'payment-id')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                  title="Copy Payment ID"
                >
                  {copied === 'payment-id' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Phone Number */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone Number</p>
                  <p className="text-sm text-gray-600">{payment.phone_number}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(payment.phone_number, 'phone')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                  title="Copy Phone Number"
                >
                  {copied === 'phone' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Transaction Hash */}
              {payment.tx_hash && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 mr-3">
                    <p className="text-sm font-medium text-gray-700">Transaction Hash</p>
                    <p className="text-sm text-gray-600 font-mono break-all">{payment.tx_hash}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(payment.tx_hash!, 'tx-hash')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                    title="Copy Transaction Hash"
                  >
                    {copied === 'tx-hash' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={downloadReceipt}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </button>

              <button
                onClick={sharePayment}
                className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>

              <button
                onClick={() => router.push('/dashboard/user/orders')}
                className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Receipt className="w-4 h-4 mr-2" />
                View All Payments
              </button>
            </div>

            {/* Help Text */}
            {payment.status === 'pending' && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Payment in Progress</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Your payment is being processed by {payment.provider}. 
                      This page will automatically update when the payment is confirmed.
                      If you don't see an update within 15 minutes, please contact support.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {payment.status === 'failed' && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Payment Failed</p>
                    <p className="text-sm text-red-700 mt-1">
                      Your payment could not be completed. Common reasons include insufficient funds, 
                      network issues, or incorrect phone number. Please try again or contact support.
                    </p>
                    <button
                      onClick={() => router.push('/checkout')}
                      className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Try Payment Again →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Support */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@nubiago.com" className="text-blue-600 hover:text-blue-700">
              support@nubiago.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 