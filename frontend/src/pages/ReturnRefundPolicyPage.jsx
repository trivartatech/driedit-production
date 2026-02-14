import React from 'react';
import { motion } from 'framer-motion';
import { Mail, RotateCcw, Package, XCircle, RefreshCw, AlertTriangle, Ban, Truck, CheckCircle } from 'lucide-react';

const ReturnRefundPolicyPage = () => {
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
            RETURN & <span className="text-[#E10600]">REFUND</span> POLICY
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
            At DRIEDIT.IN, we strive to ensure you love every purchase. If you are not completely satisfied, we offer a transparent and fair return process.
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <Section number="1" title="Return Eligibility" icon={CheckCircle}>
            <p className="text-gray-300 mb-4">You may request a return if:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>The item was delivered within the last <strong className="text-white">7 days</strong></li>
              <li>The product is unused, unwashed, and in original condition</li>
              <li>All tags and packaging are intact</li>
              <li>The product is not marked as "Final Sale"</li>
            </ul>
          </Section>

          {/* Section 2 */}
          <Section number="2" title="Non-Returnable Items" icon={XCircle}>
            <p className="text-gray-300 mb-4">We do not accept returns for:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>Products damaged due to misuse</li>
              <li>Washed or worn items</li>
              <li>Products without original tags</li>
              <li>Items returned after 7 days of delivery</li>
            </ul>
          </Section>

          {/* Section 3 */}
          <Section number="3" title="Return Process" icon={RotateCcw}>
            <div className="space-y-3">
              <Step number="1">Go to <strong className="text-white">My Orders</strong></Step>
              <Step number="2">Click <strong className="text-white">Request Return</strong></Step>
              <Step number="3">Select product and reason</Step>
              <Step number="4">Upload images (if damaged/defective)</Step>
              <Step number="5">Submit request</Step>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Our team will review and respond within <strong className="text-white">2–3 business days</strong>.
            </p>
          </Section>

          {/* Section 4 */}
          <Section number="4" title="Refund Policy" icon={RefreshCw}>
            <p className="text-gray-300 mb-4">Once the return is approved and received:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>Refunds are processed within <strong className="text-white">5–7 business days</strong></li>
              <li>Refund is issued to original payment method</li>
              <li>COD orders may require bank details for refund</li>
            </ul>
            <div className="bg-white/5 p-4 mt-4 border border-white/10">
              <p className="text-gray-300 text-sm">
                <strong className="text-white">Note:</strong> Shipping charges (if applicable) are non-refundable unless the return is due to:
              </p>
              <ul className="list-disc list-inside text-gray-400 text-sm mt-2 ml-2">
                <li>Damaged product</li>
                <li>Wrong item delivered</li>
              </ul>
            </div>
          </Section>

          {/* Section 5 */}
          <Section number="5" title="Exchange Policy" icon={Package}>
            <p className="text-gray-300 mb-4">We currently support:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>Size replacement (subject to stock availability)</li>
              <li>If size unavailable → Refund issued</li>
            </ul>
          </Section>

          {/* Section 6 */}
          <Section number="6" title="Damaged or Wrong Product" icon={AlertTriangle}>
            <p className="text-gray-300 mb-4">If you receive:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>A damaged product</li>
              <li>A defective product</li>
              <li>The wrong item</li>
            </ul>
            <p className="text-[#E10600] font-semibold mt-4">
              Please upload clear images during return request. We will prioritize such cases.
            </p>
          </Section>

          {/* Section 7 */}
          <Section number="7" title="Cancellation Policy" icon={Ban}>
            <p className="text-gray-300 mb-4">Orders can be cancelled:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li><strong className="text-white">Before shipment confirmation</strong></li>
            </ul>
            <p className="text-gray-400 text-sm mt-4">
              Once shipped, cancellation is not possible. You may initiate a return after delivery.
            </p>
          </Section>

          {/* Section 8 */}
          <Section number="8" title="Return Shipping" icon={Truck}>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>Pickup will be arranged where available</li>
              <li>In non-serviceable areas, customer may need to self-ship</li>
              <li>Reimbursement for return shipping may apply (case-dependent)</li>
            </ul>
          </Section>

          {/* Section 9 */}
          <Section number="9" title="Contact" icon={Mail}>
            <p className="text-gray-300 mb-4">
              For return-related assistance:
            </p>
            <a href="mailto:support@driedit.in" className="flex items-center space-x-2 text-[#E10600] hover:text-white transition-colors">
              <Mail size={18} />
              <span>support@driedit.in</span>
            </a>
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

const Step = ({ number, children }) => (
  <div className="flex items-center space-x-3">
    <span className="bg-[#E10600] text-white w-6 h-6 flex items-center justify-center text-sm font-bold">{number}</span>
    <span className="text-gray-400">{children}</span>
  </div>
);

export default ReturnRefundPolicyPage;
