import React from 'react';
import { Pizza, Heart, Instagram, Twitter, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-white p-2 rounded-full text-orange-500">
                <Pizza size={24} />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-white bg-clip-text text-transparent">
                Pizzart
              </span>
            </div>
            <p className="text-gray-300 max-w-md">
              Platform pemesanan pizza interaktif yang menggabungkan kreativitas, gamifikasi, 
              dan teknologi untuk menciptakan pengalaman unik dalam memesan pizza favoritmu.
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <Instagram className="hover:text-yellow-400 transition-colors cursor-pointer" size={20} />
              <Twitter className="hover:text-yellow-400 transition-colors cursor-pointer" size={20} />
              <Facebook className="hover:text-yellow-400 transition-colors cursor-pointer" size={20} />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-yellow-300">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Beranda</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Buat Pizza</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Komunitas</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Kontes</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Tentang Kami</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-yellow-300">Bantuan</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Hubungi Kami</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Kebijakan Privasi</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Syarat & Ketentuan</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300 flex items-center justify-center">
            Made with <Heart className="text-red-500 mx-2" size={16} fill="currentColor" /> for Pizza Lovers
          </p>
          <p className="text-gray-400 mt-2">&copy; 2025 Pizzart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;