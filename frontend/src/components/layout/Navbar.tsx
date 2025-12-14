'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  Menu, 
  X, 
  Layers, 
  FileText, 
  Wallet, 
  BarChart3, 
  Settings,
  ChevronDown
} from 'lucide-react';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/invoices', label: 'My Invoices', icon: FileText },
  { href: '/investor', label: 'Invest', icon: Wallet },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-4 mt-4">
          <div className="glass rounded-2xl border border-white/10">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 
                    flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Layers className="w-6 h-6 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-xl font-bold text-white">ChainFlow</span>
                    <span className="text-xl font-light text-purple-400 ml-1">Factor</span>
                  </div>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-2">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link key={link.href} href={link.href}>
                        <div className={`nav-item flex items-center gap-2 ${isActive ? 'active' : ''}`}>
                          <link.icon className="w-4 h-4" />
                          <span className="font-medium">{link.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                  {/* Connect Wallet Button */}
                  <div className="hidden sm:block">
                    <ConnectButton.Custom>
                      {({
                        account,
                        chain,
                        openAccountModal,
                        openChainModal,
                        openConnectModal,
                        mounted,
                      }) => {
                        const ready = mounted;
                        const connected = ready && account && chain;

                        return (
                          <div
                            {...(!ready && {
                              'aria-hidden': true,
                              style: {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                              },
                            })}
                          >
                            {(() => {
                              if (!connected) {
                                return (
                                  <button
                                    onClick={openConnectModal}
                                    className="glass-button flex items-center gap-2"
                                  >
                                    <Wallet className="w-4 h-4" />
                                    Connect Wallet
                                  </button>
                                );
                              }

                              if (chain.unsupported) {
                                return (
                                  <button
                                    onClick={openChainModal}
                                    className="px-4 py-2 bg-red-500/20 border border-red-500/50 
                                      rounded-xl text-red-400 font-medium"
                                  >
                                    Wrong Network
                                  </button>
                                );
                              }

                              return (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={openChainModal}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl
                                      bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                  >
                                    {chain.hasIcon && chain.iconUrl && (
                                      <img
                                        alt={chain.name ?? 'Chain icon'}
                                        src={chain.iconUrl}
                                        className="w-5 h-5 rounded-full"
                                      />
                                    )}
                                    <span className="text-sm text-gray-300">{chain.name}</span>
                                  </button>

                                  <button
                                    onClick={openAccountModal}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl
                                      bg-gradient-to-r from-purple-500/20 to-cyan-500/20
                                      border border-purple-500/30 hover:border-purple-500/50 transition-colors"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400" />
                                    <span className="text-sm font-medium text-white">
                                      {account.displayName}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      }}
                    </ConnectButton.Custom>
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10"
                  >
                    {mobileMenuOpen ? (
                      <X className="w-6 h-6 text-white" />
                    ) : (
                      <Menu className="w-6 h-6 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-24 z-40 md:hidden"
          >
            <div className="glass rounded-2xl border border-white/10 p-4">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className={`nav-item flex items-center gap-3 ${isActive ? 'active' : ''}`}>
                        <link.icon className="w-5 h-5" />
                        <span className="font-medium">{link.label}</span>
                      </div>
                    </Link>
                  );
                })}
                <div className="pt-4 border-t border-white/10">
                  <ConnectButton />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
