import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black text-white border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <h3 className="text-2xl font-black tracking-tighter mb-4">
              <span className="text-[#E10600]">D</span>RIEDIT
            </h3>
            <p className="text-sm text-gray-400">
              Minimal Gen-Z streetwear for the culture.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="hover:text-[#E10600] transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="hover:text-[#E10600] transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-[#E10600] transition-colors">
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-bold mb-4 text-sm">SHOP</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/products" className="hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">T-Shirts</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Hoodies</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Jackets</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Accessories</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-bold mb-4 text-sm">HELP</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="#" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors">Returns</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors">Shipping Info</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors">Size Guide</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold mb-4 text-sm">LEGAL</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 DRIEDIT. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;