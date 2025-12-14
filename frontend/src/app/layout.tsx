import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Web3Provider } from '@/providers/Web3Provider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'ChainFlow Factor | Decentralized Supply Chain Financing',
  description: 'Transform your invoices into instant liquidity with blockchain-powered supply chain financing. Privacy-preserving, oracle-verified, instant funding.',
  keywords: ['DeFi', 'Supply Chain', 'Invoice Financing', 'NFT', 'Blockchain', 'Web3'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Web3Provider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(30, 27, 75, 0.95)',
                color: '#fff',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Web3Provider>
      </body>
    </html>
  );
}
