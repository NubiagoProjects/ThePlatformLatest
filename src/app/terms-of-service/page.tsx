import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function TermsOfServicePage() {
  return (
    <>
      <Header />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="prose prose-lg max-w-none">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing and using Nubiago, you accept and agree to be bound by the terms and provision of this agreement.
              </p>

              <h2>2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the materials (information or software) on Nubiago's website for personal, non-commercial transitory viewing only.
              </p>

              <h2>3. User Accounts</h2>
              <p>
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
              </p>

              <h2>4. Product Information</h2>
              <p>
                We strive to display accurate product information, including prices and availability. However, we do not warrant that product descriptions or other content is accurate, complete, reliable, current, or error-free.
              </p>

              <h2>5. Payment Terms</h2>
              <p>
                All purchases are subject to our payment terms. We accept various payment methods as indicated on our website. Payment is due at the time of purchase.
              </p>

              <h2>6. Shipping and Delivery</h2>
              <p>
                Delivery times are estimates only. We are not responsible for delays beyond our control. Risk of loss and title for items purchased pass to you upon delivery.
              </p>

              <h2>7. Returns and Refunds</h2>
              <p>
                Our return policy allows returns within 30 days of purchase for most items. Some restrictions apply. Please review our complete return policy for details.
              </p>

              <h2>8. Privacy Policy</h2>
              <p>
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>

              <h2>9. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are and will remain the exclusive property of Nubiago and its licensors.
              </p>

              <h2>10. Limitation of Liability</h2>
              <p>
                In no event shall Nubiago, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.
              </p>

              <h2>11. Changes to Terms</h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>

              <h2>12. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at legal@nubiago.com.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
} 