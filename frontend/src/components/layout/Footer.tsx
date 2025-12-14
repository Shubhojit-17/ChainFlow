'use client';

import { motion } from 'framer-motion';
import { Layers, Github, Twitter, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative mt-32 border-t border-white/5">
      {/* Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 
                flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">ChainFlow</span>
                <span className="text-xl font-light text-purple-400 ml-1">Factor</span>
              </div>
            </Link>
            <p className="text-gray-400 max-w-md leading-relaxed mb-6">
              Decentralized supply chain financing powered by blockchain technology. 
              Transform your invoices into instant liquidity with privacy-preserving verification.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 
                flex items-center justify-center hover:bg-purple-500/20 hover:border-purple-500/30 
                transition-all duration-300">
                <Twitter className="w-5 h-5 text-gray-400" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 
                flex items-center justify-center hover:bg-purple-500/20 hover:border-purple-500/30 
                transition-all duration-300">
                <Github className="w-5 h-5 text-gray-400" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 
                flex items-center justify-center hover:bg-purple-500/20 hover:border-purple-500/30 
                transition-all duration-300">
                <MessageCircle className="w-5 h-5 text-gray-400" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-3">
              {['Dashboard', 'My Invoices', 'Invest', 'Documentation'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {['Whitepaper', 'Smart Contracts', 'Security Audit', 'FAQ'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2024 ChainFlow Factor. Built for the future of finance.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
