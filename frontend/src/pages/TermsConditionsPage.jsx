import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Globe, FileText, User, ShoppingBag, CreditCard, Package, Copyright, AlertCircle, Scale, Edit, Phone } from 'lucide-react';

const TermsConditionsPage = () => {
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
            TERMS & <span className="text-[#E10600]">CONDITIONS</span>
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
            Welcome to DRIEDIT.IN. By accessing or using our website, you agree to comply with these Terms & Conditions.
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <Section number="1" title="Use of Website" icon={Globe}>
            <p className="text-gray-300 mb-4">By using this site, you confirm:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>You are at least <strong className="text-white">18 years old</strong></li>
              <li>You will provide accurate information</li>
              <li>You will not misuse the website</li>
            </ul>
          </Section>

          {/* Section 2 */}
          <Section number="2" title="Account Responsibility" icon={User}>
            <p className="text-gray-300 mb-4">You are responsible for:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>Maintaining confidentiality of your account</li>
              <li>All activities under your login</li>
              <li>Providing accurate address and contact details</li>
            </ul>
          </Section>

          {/* Section 3 */}
          <Section number="3" title="Product Information" icon={ShoppingBag}>
            <p className="text-gray-300 mb-4">We strive to ensure accurate product descriptions. However:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>Minor color variations may occur due to screen differences</li>
              <li>Prices are subject to change without prior notice</li>
              <li>We reserve the right to discontinue products</li>
            </ul>
          </Section>

          {/* Section 4 */}
          <Section number="4" title="Pricing & Payment" icon={CreditCard}>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>All prices are inclusive of applicable <strong className="text-white">GST</strong></li>
              <li>Additional shipping charges may apply</li>
              <li>Payments are securely processed via <strong className="text-white">Razorpay</strong></li>
              <li>We do not store card details</li>
            </ul>
          </Section>

          {/* Section 5 */}
          <Section number="5" title="Order Acceptance" icon={Package}>
            <p className="text-gray-300 mb-4">We reserve the right to:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>Cancel orders due to stock issues</li>
              <li>Cancel suspicious or fraudulent transactions</li>
              <li>Refuse service at our discretion</li>
            </ul>
          </Section>

          {/* Section 6 */}
          <Section number="6" title="Intellectual Property" icon={Copyright}>
            <p className="text-gray-300 mb-4">All content including:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>Logos</li>
              <li>Designs</li>
              <li>Images</li>
              <li>Text</li>
            </ul>
            <p className="text-[#E10600] font-semibold mt-4">
              Are property of DRIEDIT and cannot be copied or used without permission.
            </p>
          </Section>

          {/* Section 7 */}
          <Section number="7" title="Limitation of Liability" icon={AlertCircle}>
            <p className="text-gray-300 mb-4">We are not liable for:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>Indirect or incidental damages</li>
              <li>Delivery delays caused by courier partners</li>
              <li>Technical interruptions beyond our control</li>
            </ul>
          </Section>

          {/* Section 8 */}
          <Section number="8" title="Governing Law" icon={Scale}>
            <p className="text-gray-300 mb-2">
              These Terms are governed by the <strong className="text-white">laws of India</strong>.
            </p>
            <p className="text-gray-400">
              Any disputes shall be subject to the jurisdiction of courts in Chitradurga, Karnataka, India.
            </p>
          </Section>

          {/* Section 9 */}
          <Section number="9" title="Modifications" icon={Edit}>
            <p className="text-gray-300">
              We reserve the right to update these Terms at any time. Continued use of the website implies acceptance of changes.
            </p>
          </Section>

          {/* Section 10 */}
          <Section number="10" title="Contact Information" icon={Mail}>
            <p className="text-gray-300 mb-4">
              For legal inquiries:
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

export default TermsConditionsPage;
