'use client';

import { motion } from 'framer-motion';
import { 
  FileText, 
  Wallet, 
  TrendingUp, 
  Shield, 
  ArrowRight,
  Sparkles,
  ChevronRight,
  Zap,
  Lock,
  Globe
} from 'lucide-react';
import Link from 'next/link';

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  gradient,
  delay 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  gradient: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className="glass-card p-8 group cursor-pointer"
  >
    <div className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center mb-6 
      group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
    <div className="mt-6 flex items-center text-purple-400 opacity-0 group-hover:opacity-100 
      transition-opacity duration-300">
      <span className="text-sm font-medium">Learn more</span>
      <ChevronRight className="w-4 h-4 ml-1" />
    </div>
  </motion.div>
);

const StatCard = ({ value, label, delay }: { value: string; label: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="text-center"
  >
    <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">{value}</div>
    <div className="text-gray-400">{label}</div>
  </motion.div>
);

export default function Hero() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="floating-orb w-96 h-96 bg-purple-600 top-20 -left-48" />
      <div className="floating-orb w-80 h-80 bg-cyan-500 top-40 right-0 animation-delay-2000" />
      <div className="floating-orb w-72 h-72 bg-pink-500 bottom-20 left-1/4 animation-delay-4000" />
      
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
            bg-gradient-to-r from-purple-500/10 to-cyan-500/10 
            border border-purple-500/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Powered by Zero-Knowledge Proofs</span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center text-5xl md:text-7xl font-bold mb-6 leading-tight"
        >
          <span className="text-white">Transform Invoices into</span>
          <br />
          <span className="gradient-text">Instant Liquidity</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          Decentralized supply chain financing with privacy-preserving verification. 
          Tokenize your invoices as NFTs and access funding within minutes, not months.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
        >
          <Link href="/dashboard">
            <button className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-500 
              rounded-2xl font-semibold text-white text-lg overflow-hidden transition-all duration-300
              hover:shadow-glow-md hover:scale-105">
              <span className="relative z-10 flex items-center gap-2">
                Launch App
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-600 
                opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </Link>
          <Link href="/investor">
            <button className="glass-button flex items-center gap-2 text-lg">
              <Wallet className="w-5 h-5" />
              Become an Investor
            </button>
          </Link>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="glass-card p-8 md:p-12 mb-32"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value="$2.5M+" label="Total Value Locked" delay={0.1} />
            <StatCard value="500+" label="Invoices Funded" delay={0.2} />
            <StatCard value="5%" label="Fixed APY" delay={0.3} />
            <StatCard value="<1hr" label="Average Funding Time" delay={0.4} />
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Choose <span className="gradient-text">ChainFlow</span>?
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Built for the future of supply chain finance with cutting-edge blockchain technology
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-32">
          <FeatureCard
            icon={FileText}
            title="Invoice NFTs"
            description="Tokenize your invoices as unique NFTs with verified metadata stored on IPFS for permanent, tamper-proof records."
            gradient="bg-gradient-to-br from-purple-500 to-purple-700"
            delay={0.1}
          />
          <FeatureCard
            icon={Shield}
            title="ZK Privacy"
            description="Zero-Knowledge proofs verify invoice validity without exposing sensitive buyer information to competitors."
            gradient="bg-gradient-to-br from-cyan-500 to-cyan-700"
            delay={0.2}
          />
          <FeatureCard
            icon={Zap}
            title="Oracle Verification"
            description="Chainlink oracles automatically verify delivery status from shipping providers before releasing funds."
            gradient="bg-gradient-to-br from-yellow-500 to-orange-600"
            delay={0.3}
          />
          <FeatureCard
            icon={TrendingUp}
            title="Instant Liquidity"
            description="Get funded within minutes, not weeks. Our lending pool provides immediate access to working capital."
            gradient="bg-gradient-to-br from-green-500 to-emerald-600"
            delay={0.4}
          />
          <FeatureCard
            icon={Lock}
            title="Secure Escrow"
            description="Smart contracts hold funds in secure escrow, automatically distributing payments on invoice maturity."
            gradient="bg-gradient-to-br from-pink-500 to-rose-600"
            delay={0.5}
          />
          <FeatureCard
            icon={Globe}
            title="Global Access"
            description="Borderless financing for SMEs worldwide. No geographical restrictions, no traditional banking barriers."
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            delay={0.6}
          />
        </div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
            How It <span className="gradient-text">Works</span>
          </h2>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 
              bg-gradient-to-r from-transparent via-purple-500/50 to-transparent transform -translate-y-1/2" />

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '01', title: 'Upload Invoice', desc: 'Submit your invoice details and upload supporting documents' },
                { step: '02', title: 'Verify', desc: 'Oracle confirms delivery, ZK proof validates authenticity' },
                { step: '03', title: 'Get Funded', desc: 'Receive instant funding from the decentralized lending pool' },
                { step: '04', title: 'Repay', desc: 'Repay on invoice maturity with a fixed 5% interest rate' },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 
                    flex items-center justify-center text-2xl font-bold text-white relative z-10">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
