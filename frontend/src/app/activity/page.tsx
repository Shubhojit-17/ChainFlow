'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Activity,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  ArrowLeft,
  ExternalLink,
  Shield,
  Wallet,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '@/components/ui';
import { useRecentActivity, formatETH, ActivityEvent } from '@/hooks/useContracts';

// Activity type configurations
const activityConfig: Record<ActivityEvent['type'], {
  icon: any;
  color: string;
  bgColor: string;
  label: string;
  description: string;
}> = {
  deposit: {
    icon: Wallet,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    label: 'Deposit',
    description: 'Liquidity added to the lending pool',
  },
  funded: {
    icon: DollarSign,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    label: 'Invoice Funded',
    description: 'Invoice received funding from the lending pool',
  },
  repaid: {
    icon: TrendingUp,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    label: 'Loan Repaid',
    description: 'Borrower repaid the loan with interest',
  },
  minted: {
    icon: FileText,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    label: 'Invoice Created',
    description: 'New invoice NFT minted on the blockchain',
  },
  verified: {
    icon: Shield,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    label: 'Invoice Verified',
    description: 'Invoice passed Oracle or ZK verification',
  },
};

// Activity Detail Modal
const ActivityDetailModal = ({
  activity,
  isOpen,
  onClose,
}: {
  activity: ActivityEvent | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const router = useRouter();

  if (!activity) return null;

  const config = activityConfig[activity.type];
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Activity Details">
      <div className="space-y-6">
        {/* Activity Header */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
          <div className={`w-14 h-14 rounded-xl ${config.bgColor} flex items-center justify-center`}>
            <Icon className={`w-7 h-7 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{config.label}</h3>
            <p className="text-gray-400">{config.description}</p>
          </div>
        </div>

        {/* Activity Details */}
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
            <span className="text-gray-400">Block Number</span>
            <span className="text-white font-medium">#{activity.blockNumber.toString()}</span>
          </div>

          {activity.amount > 0n && (
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-gray-400">Amount</span>
              <span className="text-white font-medium">{formatETH(activity.amount)} ETH</span>
            </div>
          )}

          {activity.tokenId && (
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-gray-400">Invoice ID</span>
              <span className="text-white font-medium">#{activity.tokenId.toString()}</span>
            </div>
          )}

          <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
            <span className="text-gray-400">Status</span>
            <Badge variant="success">Confirmed</Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          {activity.tokenId && (
            <Button
              variant="primary"
              fullWidth
              icon={ExternalLink}
              onClick={() => {
                onClose();
                router.push('/invoices');
              }}
            >
              View Invoice
            </Button>
          )}
          {activity.type === 'deposit' && (
            <Button
              variant="primary"
              fullWidth
              icon={Wallet}
              onClick={() => {
                onClose();
                router.push('/investor');
              }}
            >
              Manage Deposits
            </Button>
          )}
          <Button variant="secondary" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Activity Row Component
const ActivityRow = ({
  activity,
  onClick,
}: {
  activity: ActivityEvent;
  onClick: () => void;
}) => {
  const config = activityConfig[activity.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01, x: 4 }}
      onClick={onClick}
      className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] 
        border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer group"
    >
      <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center
        group-hover:scale-110 transition-transform`}>
        <Icon className={`w-6 h-6 ${config.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-white font-semibold">{config.label}</p>
          {activity.tokenId && (
            <Badge variant="default" size="sm">#{activity.tokenId.toString()}</Badge>
          )}
        </div>
        <p className="text-gray-500 text-sm">Block #{activity.blockNumber.toString()}</p>
      </div>

      <div className="text-right">
        {activity.amount > 0n ? (
          <p className="text-lg font-bold text-white">{formatETH(activity.amount)} ETH</p>
        ) : (
          <p className="text-lg font-medium text-gray-400">-</p>
        )}
        <Badge variant="success" size="sm">confirmed</Badge>
      </div>

      <ExternalLink className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors" />
    </motion.div>
  );
};

export default function ActivityPage() {
  const { activities, isLoading, refetch } = useRecentActivity();
  const [selectedActivity, setSelectedActivity] = useState<ActivityEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleActivityClick = (activity: ActivityEvent) => {
    setSelectedActivity(activity);
    setModalOpen(true);
  };

  // Group activities by type for stats
  const stats = {
    total: activities.length,
    deposits: activities.filter(a => a.type === 'deposit').length,
    invoices: activities.filter(a => a.type === 'minted').length,
    funded: activities.filter(a => a.type === 'funded').length,
    verified: activities.filter(a => a.type === 'verified').length,
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="floating-orb w-[500px] h-[500px] bg-purple-600/20 -top-40 -right-40" />
        <div className="floating-orb w-[400px] h-[400px] bg-cyan-500/15 bottom-20 -left-40" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={() => window.history.back()}
            className="mb-4"
          >
            Back
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-6 h-6 text-purple-400" />
                <span className="text-purple-400 font-medium">Blockchain Events</span>
              </div>
              <h1 className="text-4xl font-bold text-white">Recent Activity</h1>
              <p className="text-gray-400 mt-2">
                All transactions and events from the ChainFlow Factor protocol
              </p>
            </div>

            <Button variant="secondary" icon={RefreshCw} onClick={() => refetch?.()}>
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          {[
            { label: 'Total Events', value: stats.total, color: 'from-purple-500 to-violet-600' },
            { label: 'Deposits', value: stats.deposits, color: 'from-green-500 to-emerald-600' },
            { label: 'Invoices Created', value: stats.invoices, color: 'from-blue-500 to-cyan-500' },
            { label: 'Funded', value: stats.funded, color: 'from-pink-500 to-rose-500' },
            { label: 'Verified', value: stats.verified, color: 'from-cyan-500 to-teal-500' },
          ].map((stat, i) => (
            <Card key={i} className="p-4 text-center">
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
            </Card>
          ))}
        </motion.div>

        {/* Activity List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">All Transactions</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-gray-400 text-sm">Live updates</span>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-5 rounded-xl bg-white/5 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-white/10" />
                    <div className="flex-1">
                      <div className="h-5 bg-white/10 rounded w-1/3 mb-2" />
                      <div className="h-4 bg-white/10 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-purple-500/10 
                  flex items-center justify-center">
                  <Activity className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Activity Yet</h3>
                <p className="text-gray-400">
                  Create invoices, make deposits, or fund invoices to see activity here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <ActivityRow
                    key={`${activity.blockNumber}-${index}`}
                    activity={activity}
                    onClick={() => handleActivityClick(activity)}
                  />
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
