import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-10 mt-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2">
              <span>🚗</span> CarRental
            </h3>
            <p className="text-gray-400 mt-2 text-sm">
              Your trusted car rental platform. Book cars online or pay on pickup.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/" className="hover:text-white transition">Browse Cars</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Login</Link></li>
              <li><Link to="/signup" className="hover:text-white transition">Signup</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>📧 support@carrental.com</li>
              <li>📞 +91 98765 43210</li>
              <li>📍 Mumbai, India</li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-700 my-6" />

        <div className="text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} CarRental. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}