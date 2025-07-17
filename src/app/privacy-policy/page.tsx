import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="prose prose-lg max-w-none">
              <h2>1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.
              </p>

              <h3>Personal Information</h3>
              <ul>
                <li>Name and contact information</li>
                <li>Payment and billing information</li>
                <li>Shipping and delivery addresses</li>
                <li>Account credentials</li>
              </ul>

              <h3>Usage Information</h3>
              <ul>
                <li>Browsing history and search queries</li>
                <li>Device and browser information</li>
                <li>IP address and location data</li>
                <li>Cookies and similar technologies</li>
              </ul>

              <h2>2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Process and fulfill your orders</li>
                <li>Provide customer support</li>
                <li>Send order confirmations and updates</li>
                <li>Improve our services and user experience</li>
                <li>Prevent fraud and ensure security</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h2>3. Information Sharing</h2>
              <p>
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
              </p>

              <h3>Service Providers</h3>
              <p>
                We may share information with trusted third-party service providers who assist us in operating our website, processing payments, and delivering orders.
              </p>

              <h3>Legal Requirements</h3>
              <p>
                We may disclose information if required by law or to protect our rights, property, or safety, or that of our users or others.
              </p>

              <h2>4. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>

              <h2>5. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and personalize content and advertisements.
              </p>

              <h2>6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access and update your personal information</li>
                <li>Request deletion of your account</li>
                <li>Opt out of marketing communications</li>
                <li>Request a copy of your data</li>
                <li>Object to certain processing activities</li>
              </ul>

              <h2>7. Children's Privacy</h2>
              <p>
                Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13.
              </p>

              <h2>8. International Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place.
              </p>

              <h2>9. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page.
              </p>

              <h2>10. Contact Us</h2>
              <p>
                If you have any questions about this privacy policy, please contact us at privacy@nubiago.com.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
} 