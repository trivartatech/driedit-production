import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Phone, MessageCircle, MapPin, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black text-white border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link to="/" className="inline-block">
              <h3 className="text-2xl font-black tracking-tighter mb-4 hover:text-[#E10600] transition-colors">
                <span className="text-[#E10600]">D</span>RIEDIT
              </h3>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              Stay raw stay real.
            </p>
            <div className="flex items-start space-x-2 text-sm text-gray-400 mb-4">
              <MapPin size={16} className="text-[#E10600] flex-shrink-0 mt-0.5" />
              <span>
                Sampath Nilya, Ground Floor<br />
                5th Cross, 2nd Main, Vidyanagar<br />
                (Opp. Park) Chitradurga,<br />
                Karnataka – 577502
              </span>
            </div>
            <div className="flex space-x-4 mt-4">
              <a 
                href="https://www.instagram.com/dried.it" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-[#E10600] transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://www.facebook.com/share/1HXRuocXPt/?mibextid=wwXIfr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-[#E10600] transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://wa.me/919611132391" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-[#E10600] transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle size={20} />
              </a>
              <a 
                href="tel:+919611132391" 
                className="hover:text-[#E10600] transition-colors"
                aria-label="Phone"
              >
                <Phone size={20} />
              </a>
            </div>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="font-bold mb-4 text-sm">CONTACT US</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="tel:+919611132391" className="hover:text-white transition-colors flex items-center space-x-2">
                  <Phone size={14} />
                  <span>+91 96111 32391</span>
                </a>
              </li>
              <li>
                <a href="https://wa.me/919611132391" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center space-x-2">
                  <MessageCircle size={14} />
                  <span>WhatsApp</span>
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/dried.it" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center space-x-2">
                  <Instagram size={14} />
                  <span>@dried.it</span>
                </a>
              </li>
              <li><Link to="/my-orders" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><Link to="/my-orders" className="hover:text-white transition-colors">Returns</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold mb-4 text-sm">COMPANY</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Shop</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-and-conditions" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/return-refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 DRIEDIT. All rights reserved.</p>
          <p className="mt-2">
            Crafted with ❤️ by{' '}
            <a 
              href="https://trivarta.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#E10600] hover:text-white transition-colors"
            >
              Trivarta Tech Pvt. Ltd.
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;