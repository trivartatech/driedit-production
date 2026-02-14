import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Globe, Shield, Lock, CreditCard, Cookie, Database, Share2, UserCheck, Clock, Link2, Baby, Bell, Phone } from 'lucide-react';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            PRIVACY <span className="text-[#E10600]">POLICY</span>
          </h1>
          <p className="text-gray-400">Last Updated: February 14, 2026</p>
        </motion.div>

        {/* Introduction */}
        <motion.div 
          className="bg-white/5 border border-white/10 p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <p className="text-gray-300 leading-relaxed">
            Welcome to DRIEDIT.IN ("we," "our," "us"). Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
          </p>
          <p className="text-white font-semibold mt-4">
            By using our website, you agree to the terms of this Privacy Policy.
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <Section number="1" title="Information We Collect" icon={Database}>
            <p className="text-gray-300 mb-4">We may collect the following types of information:</p>
            
            <SubSection title="Personal Information">
              <p className="text-gray-400 mb-2">When you create an account or place an order, we may collect:</p>
              <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Shipping & billing address</li>
                <li>Payment details (processed securely via Razorpay)</li>
              </ul>
            </SubSection>

            <SubSection title="Account Information">
              <p className="text-gray-400 mb-2">If you sign in using:</p>
              <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
                <li><strong className="text-white">Google OAuth</strong> → We collect your verified email, name, and profile picture (if provided).</li>
                <li><strong className="text-white">Email & Password</strong> → Your password is securely hashed and never stored in plain text.</li>
              </ul>
            </SubSection>

            <SubSection title="Order Information">
              <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
                <li>Products purchased</li>
                <li>Order history</li>
                <li>Shipping status</li>
                <li>Return requests</li>
              </ul>
            </SubSection>

            <SubSection title="Technical Information">
              <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
                <li>IP address</li>
                <li>Browser type</li>
                <li>Device type</li>
                <li>Cookies & session data</li>
              </ul>
            </SubSection>
          </Section>

          {/* Section 2 */}
          <Section number="2" title="How We Use Your Information" icon={UserCheck}>
            <p className="text-gray-300 mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>Process and deliver your orders</li>
              <li>Provide customer support</li>
              <li>Manage returns and refunds</li>
              <li>Send order confirmations & shipping updates</li>
              <li>Improve our website and services</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
            <p className="text-[#E10600] font-bold mt-4">We do not sell your personal information.</p>
          </Section>

          {/* Section 3 */}
          <Section number="3" title="Payment Information" icon={CreditCard}>
            <p className="text-gray-300 mb-2">
              All payments are securely processed through <strong className="text-white">Razorpay</strong>.
            </p>
            <p className="text-gray-300 mb-2">
              We do not store your card details on our servers.
            </p>
            <p className="text-gray-400 text-sm mt-4">
              Razorpay may collect and process payment data according to their privacy policy.
            </p>
          </Section>

          {/* Section 4 */}
          <Section number="4" title="Cookies & Tracking Technologies" icon={Cookie}>
            <p className="text-gray-300 mb-4">We use cookies to:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>Maintain login sessions</li>
              <li>Improve user experience</li>
              <li>Analyze website performance</li>
            </ul>
            <p className="text-gray-400 text-sm mt-4">
              You may disable cookies in your browser settings, but some features may not function properly.
            </p>
          </Section>

          {/* Section 5 */}
          <Section number="5" title="Data Security" icon={Lock}>
            <p className="text-gray-300 mb-4">We implement appropriate security measures including:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>HTTPS encryption</li>
              <li>Secure session cookies (httpOnly, secure flags)</li>
              <li>Encrypted password storage (bcrypt hashing)</li>
              <li>Access controls for administrative data</li>
            </ul>
            <p className="text-gray-400 text-sm mt-4">
              However, no method of transmission over the internet is 100% secure.
            </p>
          </Section>

          {/* Section 6 */}
          <Section number="6" title="Sharing of Information" icon={Share2}>
            <p className="text-gray-300 mb-4">We may share your data with:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>Payment gateways (Razorpay)</li>
              <li>Shipping and logistics partners</li>
              <li>Email service providers (for order notifications)</li>
              <li>Legal authorities if required by law</li>
            </ul>
            <p className="text-[#E10600] font-bold mt-4">We do not sell, rent, or trade your personal data.</p>
          </Section>

          {/* Section 7 */}
          <Section number="7" title="Your Rights" icon={Shield}>
            <p className="text-gray-300 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>Access your personal data</li>
              <li>Update or correct your information</li>
              <li>Request deletion of your account</li>
              <li>Opt out of promotional emails</li>
            </ul>
            <p className="text-gray-400 text-sm mt-4">
              To make such requests, contact us at the email below.
            </p>
          </Section>

          {/* Section 8 */}
          <Section number="8" title="Data Retention" icon={Clock}>
            <p className="text-gray-300 mb-4">We retain your data:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>As long as your account is active</li>
              <li>As required for legal, tax, or compliance purposes</li>
            </ul>
            <p className="text-gray-400 text-sm mt-4">
              You may request deletion of your account at any time.
            </p>
          </Section>

          {/* Section 9 */}
          <Section number="9" title="Third-Party Links" icon={Link2}>
            <p className="text-gray-300">
              Our website may contain links to third-party websites. We are not responsible for their privacy practices.
            </p>
          </Section>

          {/* Section 10 */}
          <Section number="10" title="Children's Privacy" icon={Baby}>
            <p className="text-gray-300">
              Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal data from minors.
            </p>
          </Section>

          {/* Section 11 */}
          <Section number="11" title="Changes to This Privacy Policy" icon={Bell}>
            <p className="text-gray-300">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date.
            </p>
          </Section>

          {/* Section 12 */}
          <Section number="12" title="Contact Us" icon={Mail}>
            <p className="text-gray-300 mb-4">
              If you have questions about this Privacy Policy, contact us at:
            </p>
            <div className="space-y-2">
              <a href="mailto:support@driedit.in" className="flex items-center space-x-2 text-[#E10600] hover:text-white transition-colors">
                <Mail size={18} />
                <span>support@driedit.in</span>
              </a>
              <a href="https://driedit.in" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-[#E10600] hover:text-white transition-colors">
                <Globe size={18} />
                <span>https://driedit.in</span>
              </a>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

const Section = ({ number, title, icon: Icon, children }) => (
  <motion.div 
    className="border-l-4 border-[#E10600] pl-6"
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
  >
    <div className="flex items-center space-x-3 mb-4">
      <Icon size={24} className="text-[#E10600]" />
      <h2 className="text-xl font-bold">{number}. {title}</h2>
    </div>
    <div className="ml-9">{children}</div>
  </motion.div>
);

const SubSection = ({ title, children }) => (
  <div className="mb-4">
    <h3 className="text-white font-semibold mb-2">🔹 {title}</h3>
    {children}
  </div>
);

export default PrivacyPolicyPage;
