'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { 
  TrendingUp, 
  FileText, 
  DollarSign, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Activity,
  PieChart
} from 'lucide-react';
import { Card, StatCard, Badge, ProgressBar, Button } from '@/components/ui';
import { usePoolStats, useCreatorInvoices, useRecentActivity, formatETH, ActivityEvent } from '@/hooks/useContracts';
import Link from 'next/link';

// Animated background component
const AnimatedBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    <div className="floating-orb w-[500px] h-[500px] bg-purple-600/30 -top-20 -right-20" />
    <div className="floating-orb w-[400px] h-[400px] bg-cyan-500/20 top-1/2 -left-40 animation-delay-2000" />
    <div className="floating-orb w-[300px] h-[300px] bg-pink-500/20 bottom-20 right-1/4 animation-delay-4000" />
  </div>
);

// Activity Item Component
const ActivityItem = ({ 
  type, 
  amount, 
  time, 
  status 
}: { 
  type: string; 
  amount: string; 
  time: string; 
  status: 'success' | 'pending' | 'failed';
}) => {
  const statusConfig = {
    success: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
    pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  };

  const { icon: StatusIcon, color, bg } = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 
        hover:bg-white/10 transition-colors cursor-pointer group"
    >
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
        <StatusIcon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex-1">
        <p className="text-white font-medium">{type}</p>
        <p className="text-gray-500 text-sm">{time}</p>
      </div>
      <div className="text-right">
        <p className="text-white font-semibold">{amount}</p>
        <Badge variant={status === 'success' ? 'success' : status === 'pending' ? 'warning' : 'danger'} size="sm">
          {status}
        </Badge>
      </div>
      <ArrowUpRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors" />
    </motion.div>
  );
};

// Quick Action Card
const QuickActionCard = ({ 
  icon: Icon, 
  title, 
  description, 
  href, 
  gradient 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  href: string; 
  gradient: string;
}) => (
  <Link href={href}>
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] 
        border border-white/10 cursor-pointer group
        hover:border-purple-500/30 transition-all duration-300"
    >
      <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mb-4
        group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </motion.div>
  </Link>
);

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { stats, isLoading: statsLoading } = usePoolStats();
  const { invoiceIds, isLoading: invoicesLoading } = useCreatorInvoices(address);
  const { activities, isLoading: activitiesLoading } = useRecentActivity(5); // Limit to 5 for dashboard

  // Calculate stats
  const totalLiquidity = stats ? formatETH(stats.available + stats.borrowed) : '0';
  const availableLiquidity = stats ? formatETH(stats.available) : '0';
  const totalBorrowed = stats ? formatETH(stats.borrowed) : '0';
  const investorCount = stats ? stats.investorCount.toString() : '0';

  // Map activities to display format
  const getActivityDisplay = (activity: ActivityEvent) => {
    const typeMap: Record<ActivityEvent['type'], string> = {
      deposit: 'New Deposit',
      funded: 'Invoice Funded',
      repaid: 'Loan Repaid',
      minted: 'Invoice Created',
      verified: 'Invoice Verified',
    };
    
    const tokenLabel = activity.tokenId ? ` #${activity.tokenId.toString()}` : '';
    const blocksAgo = activity.blockNumber ? `Block #${activity.blockNumber.toString()}` : 'Recently';
    
    // Show amount or token ID based on type
    const displayAmount = activity.type === 'verified' || activity.type === 'minted'
      ? `Token${tokenLabel}`
      : activity.amount > 0n ? `${formatETH(activity.amount)} ETH` : tokenLabel || '-';
    
    return {
      type: typeMap[activity.type] + (activity.type === 'minted' ? tokenLabel : ''),
      amount: displayAmount,
      time: blocksAgo,
      status: 'success' as const,
    };
  };

  // Show live activities or placeholder if none (limit to 5 for dashboard)
  const displayActivities = activities.length > 0 
    ? activities.slice(0, 5).map(getActivityDisplay)
    : [
        { type: 'No Recent Activity', amount: '-', time: 'Waiting for transactions...', status: 'pending' as const },
      ];

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 relative">
      <AnimatedBackground />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <span className="text-purple-400 font-medium">Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back{isConnected && address ? `, ${address.slice(0, 6)}...${address.slice(-4)}` : ''}
          </h1>
          <p className="text-gray-400 text-lg">
            Here's an overview of your supply chain financing activity
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <StatCard
            label="Total Value Locked"
            value={`${totalLiquidity} ETH`}
            change="+12.5%"
            changeType="positive"
            icon={DollarSign}
            iconColor="from-green-500 to-emerald-600"
          />
          <StatCard
            label="Available Liquidity"
            value={`${availableLiquidity} ETH`}
            change="-3.2%"
            changeType="negative"
            icon={TrendingUp}
            iconColor="from-blue-500 to-cyan-500"
          />
          <StatCard
            label="Active Loans"
            value={`${totalBorrowed} ETH`}
            icon={Activity}
            iconColor="from-purple-500 to-violet-600"
          />
          <StatCard
            label="Total Investors"
            value={investorCount}
            change="+5"
            changeType="positive"
            icon={Users}
            iconColor="from-pink-500 to-rose-600"
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions & Pool Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Quick Actions
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <QuickActionCard
                  icon={FileText}
                  title="Create Invoice"
                  description="Tokenize a new invoice as NFT"
                  href="/invoices"
                  gradient="bg-gradient-to-br from-purple-500 to-purple-700"
                />
                <QuickActionCard
                  icon={DollarSign}
                  title="Deposit Funds"
                  description="Add liquidity to earn yield"
                  href="/investor"
                  gradient="bg-gradient-to-br from-cyan-500 to-cyan-700"
                />
                <QuickActionCard
                  icon={PieChart}
                  title="View Portfolio"
                  description="Track your investments"
                  href="/investor"
                  gradient="bg-gradient-to-br from-pink-500 to-pink-700"
                />
              </div>
            </motion.div>

            {/* Pool Overview Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">Lending Pool Overview</h2>
                    <p className="text-gray-400">Current pool utilization and performance</p>
                  </div>
                  <Badge variant="success">Healthy</Badge>
                </div>

                <div className="space-y-6">
                  {/* Utilization Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Pool Utilization</span>
                      <span className="text-white font-medium">
                        {stats ? Math.round(Number(stats.borrowed) / Number(stats.available + stats.borrowed) * 100) || 0 : 0}%
                      </span>
                    </div>
                    <ProgressBar 
                      value={stats ? Number(stats.borrowed) : 0} 
                      max={stats ? Number(stats.available + stats.borrowed) || 1 : 1}
                      size="lg"
                    />
                  </div>

                  {/* Pool Stats */}
                  <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">APY</p>
                      <p className="text-2xl font-bold gradient-text">5.00%</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Interest Earned</p>
                      <p className="text-2xl font-bold text-white">
                        {stats ? formatETH(stats.interestEarned) : '0'} ETH
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">My Invoices</p>
                      <p className="text-2xl font-bold text-white">
                        {invoiceIds?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                <Link href="/activity">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {activitiesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 animate-pulse">
                        <div className="w-10 h-10 rounded-xl bg-white/10" />
                        <div className="flex-1">
                          <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
                          <div className="h-3 bg-white/10 rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  displayActivities.map((activity, index) => (
                    <Link href="/activity" key={index}>
                      <ActivityItem {...activity} />
                    </Link>
                  ))
                )}
              </div>

              {/* Connection Status */}
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-500'} 
                    ${isConnected ? 'animate-pulse' : ''}`} />
                  <span className="text-gray-400 text-sm">
                    {isConnected ? 'Connected to Hardhat Local' : 'Wallet not connected'}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
