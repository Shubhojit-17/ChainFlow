'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PieChart,
  Activity,
  Sparkles,
  Plus,
  Minus,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock,
  Percent,
  Users
} from 'lucide-react';
import { Card, Button, Badge, Input, Modal, ProgressBar, StatCard } from '@/components/ui';
import {
  usePoolStats,
  useInvestorBalance,
  useDeposit,
  useWithdraw,
  useCurrentTokenId,
  useInvoice,
  useFundInvoice,
  formatETH,
  formatDate,
} from '@/hooks/useContracts';

// Available Invoice Card for funding
const FundableInvoiceCard = ({
  tokenId,
  onFund,
  isFunding,
}: {
  tokenId: number;
  onFund: (id: number) => void;
  isFunding: boolean;
}) => {
  const { invoice, isLoading } = useInvoice(tokenId);

  if (isLoading || !invoice) {
    return (
      <div className="p-4 rounded-xl bg-white/5 animate-pulse">
        <div className="h-5 bg-white/10 rounded w-1/3 mb-2" />
        <div className="h-4 bg-white/10 rounded w-1/2" />
      </div>
    );
  }

  // Only show verified but not funded invoices
  if ((!invoice.isVerified && !invoice.isZkVerified) || invoice.isFunded) {
    return null;
  }

  const interest = invoice.amount * 5n / 100n;
  const dueDate = new Date(Number(invoice.dueDate) * 1000);
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] 
        border border-white/10 hover:border-purple-500/30 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-purple-400" />
            <span className="font-semibold text-white">Invoice #{tokenId}</span>
            <Badge variant="success" size="sm">Verified</Badge>
          </div>
          <p className="text-gray-400 text-sm">
            {invoice.creator.slice(0, 8)}...{invoice.creator.slice(-6)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-white">{formatETH(invoice.amount)} ETH</p>
          <p className="text-green-400 text-sm">+{formatETH(interest)} interest</p>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Due in {daysUntilDue} days</span>
        </div>
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">5% APY</span>
        </div>
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={() => onFund(tokenId)}
        loading={isFunding}
        icon={DollarSign}
      >
        Fund Invoice
      </Button>
    </motion.div>
  );
};

// Deposit/Withdraw Modal
const TransactionModal = ({
  isOpen,
  onClose,
  type,
  onSubmit,
  isPending,
  maxAmount,
}: {
  isOpen: boolean;
  onClose: () => void;
  type: 'deposit' | 'withdraw';
  onSubmit: (amount: string) => void;
  isPending: boolean;
  maxAmount?: string;
}) => {
  const [amount, setAmount] = useState('');

  // Reset amount when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (type === 'withdraw' && maxAmount && parseFloat(amount) > parseFloat(maxAmount)) {
      toast.error('Insufficient balance');
      return;
    }
    onSubmit(amount);
  };

  const handleMax = () => {
    if (maxAmount) {
      setAmount(maxAmount);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === 'deposit' ? 'Deposit ETH' : 'Withdraw ETH'}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">Amount</label>
            {maxAmount && (
              <button
                onClick={handleMax}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                Max: {parseFloat(maxAmount).toFixed(4)} ETH
              </button>
            )}
          </div>
          <Input
            placeholder="0.00"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            suffix="ETH"
            icon={DollarSign}
          />
        </div>

        {type === 'deposit' && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">Earn 5% APY</span>
            </div>
            <p className="text-sm text-gray-400">
              Your deposit will be used to fund verified invoices and earn interest.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isPending}
            fullWidth
            icon={type === 'deposit' ? Plus : Minus}
          >
            {type === 'deposit' ? 'Deposit' : 'Withdraw'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default function InvestorPage() {
  const { address, isConnected } = useAccount();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Key to force invoice card refresh

  // Contract hooks
  const { stats, isLoading: statsLoading, refetch: refetchStats } = usePoolStats();
  const { balance, rawBalance, isLoading: balanceLoading, refetch: refetchBalance } = useInvestorBalance(address);
  const { currentTokenId, refetch: refetchTokenId } = useCurrentTokenId();
  const { deposit, isPending: isDepositing, isSuccess: depositSuccess, error: depositError, reset: resetDeposit } = useDeposit();
  const { withdraw, isPending: isWithdrawing, isSuccess: withdrawSuccess, error: withdrawError, reset: resetWithdraw } = useWithdraw();
  const { fundInvoice, isPending: isFunding, isSuccess: fundSuccess, error: fundError, reset: resetFund } = useFundInvoice();

  // Handle deposit success
  useEffect(() => {
    if (depositSuccess) {
      toast.success('Deposit successful!');
      setDepositModalOpen(false);
      // Delay refetch to allow blockchain state to update
      setTimeout(() => {
        refetchStats();
        refetchBalance();
        resetDeposit(); // Reset for next deposit
      }, 1000);
    }
  }, [depositSuccess, refetchStats, refetchBalance, resetDeposit]);

  // Handle deposit error
  useEffect(() => {
    if (depositError) {
      console.error('Deposit error:', depositError);
      toast.error('Deposit failed: ' + (depositError.message || 'Unknown error'));
    }
  }, [depositError]);

  // Handle withdraw success
  useEffect(() => {
    if (withdrawSuccess) {
      toast.success('Withdrawal successful! ETH has been sent to your wallet.');
      setWithdrawModalOpen(false);
      // Delay refetch to allow blockchain state to update
      setTimeout(() => {
        refetchStats();
        refetchBalance();
        resetWithdraw(); // Reset for next withdrawal
      }, 1000);
    }
  }, [withdrawSuccess, refetchStats, refetchBalance, resetWithdraw]);

  // Handle withdraw error
  useEffect(() => {
    if (withdrawError) {
      console.error('Withdraw error:', withdrawError);
      toast.error('Withdrawal failed: ' + (withdrawError.message || 'Unknown error'));
    }
  }, [withdrawError]);

  // Handle fund success
  useEffect(() => {
    if (fundSuccess) {
      toast.success('Invoice funded successfully!');
      // Delay refetch to allow blockchain state to update
      setTimeout(() => {
        refetchStats();
        refetchBalance();
        refetchTokenId();
        setRefreshKey(prev => prev + 1); // Force invoice cards to refresh
        resetFund(); // Reset for next fund operation
      }, 1000);
    }
  }, [fundSuccess, refetchStats, refetchBalance, refetchTokenId, resetFund]);

  // Handle fund error
  useEffect(() => {
    if (fundError) {
      console.error('Fund error:', fundError);
      toast.error('Funding failed: ' + (fundError.message || 'Unknown error'));
    }
  }, [fundError]);

  const handleDeposit = (amount: string) => {
    deposit(amount);
  };

  const handleWithdraw = (amount: string) => {
    withdraw(amount);
  };

  const handleFundInvoice = (tokenId: number) => {
    fundInvoice(tokenId);
  };

  // Calculate portfolio stats
  // Note: After contract fix, rawBalance now includes deposit + distributed interest
  const myBalance = rawBalance ? formatETH(rawBalance) : '0';
  const myInterestEarned = stats ? formatETH(stats.interestEarned) : '0'; // Total pool interest for display
  const totalLiquidity = stats ? formatETH(stats.available + stats.borrowed) : '0';
  const poolUtilization = stats && stats.available + stats.borrowed > 0n
    ? Math.round(Number(stats.borrowed) / Number(stats.available + stats.borrowed) * 100)
    : 0;

  // Get invoice IDs for potential funding (simplified - in real app would query for verified unfunded invoices)
  const invoiceIdsToShow = currentTokenId ? Array.from({ length: Number(currentTokenId) }, (_, i) => i + 1) : [];

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="floating-orb w-[600px] h-[600px] bg-green-600/15 top-20 -right-60" />
        <div className="floating-orb w-[400px] h-[400px] bg-purple-500/20 bottom-40 -left-40" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-6 h-6 text-green-400" />
            <span className="text-green-400 font-medium">Investor Portal</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Liquidity Pool</h1>
          <p className="text-gray-400 text-lg">
            Deposit ETH, fund invoices, and earn 5% APY on verified supply chain assets
          </p>
        </motion.div>

        {/* Portfolio Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-4 gap-6 mb-12"
        >
          <StatCard
            label="Your Balance"
            value={`${myBalance} ETH`}
            icon={Wallet}
            iconColor="from-green-500 to-emerald-600"
          />
          <StatCard
            label="Pool Liquidity"
            value={`${totalLiquidity} ETH`}
            icon={PieChart}
            iconColor="from-purple-500 to-violet-600"
          />
          <StatCard
            label="Pool Utilization"
            value={`${poolUtilization}%`}
            icon={Activity}
            iconColor="from-blue-500 to-cyan-500"
          />
          <StatCard
            label="Total Investors"
            value={stats ? stats.investorCount.toString() : '0'}
            icon={Users}
            iconColor="from-pink-500 to-rose-600"
          />
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Deposit/Withdraw */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-8">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Manage Liquidity
              </h2>

              {/* Balance Display */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-cyan-500/10 
                border border-green-500/20 mb-6">
                <p className="text-gray-400 text-sm mb-1">Your Total Balance</p>
                <p className="text-4xl font-bold gradient-text mb-4">{myBalance} ETH</p>
                
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Withdrawable</p>
                    <p className="text-white font-semibold">{myBalance} ETH</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Pool Interest Earned</p>
                    <p className="text-green-400 font-semibold">+{myInterestEarned} ETH</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Badge variant="success" size="sm">Earning 5% APY</Badge>
                </div>
              </div>

              {/* Pool Info */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Available Liquidity</span>
                  <span className="text-white font-medium">
                    {stats ? formatETH(stats.available) : '0'} ETH
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Loans</span>
                  <span className="text-white font-medium">
                    {stats ? formatETH(stats.borrowed) : '0'} ETH
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Your Interest Earned</span>
                  <span className="text-green-400 font-medium">
                    +{myInterestEarned} ETH
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Pool Interest</span>
                  <span className="text-cyan-400 font-medium">
                    +{stats ? formatETH(stats.interestEarned) : '0'} ETH
                  </span>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <ProgressBar
                    value={poolUtilization}
                    max={100}
                    showLabel
                    size="md"
                    color="from-green-500 to-cyan-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  fullWidth
                  icon={Plus}
                  onClick={() => setDepositModalOpen(true)}
                >
                  Deposit
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  icon={Minus}
                  onClick={() => setWithdrawModalOpen(true)}
                  disabled={!balance || balance === 0n}
                >
                  Withdraw
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Right Column - Fundable Invoices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Verified Invoices Ready for Funding
              </h2>
              <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => {
                refetchTokenId();
                setRefreshKey(prev => prev + 1);
              }}>
                Refresh
              </Button>
            </div>

            {invoiceIdsToShow.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 
                  flex items-center justify-center">
                  <FileText className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Invoices Available</h3>
                <p className="text-gray-400">
                  There are no verified invoices waiting for funding at the moment.
                </p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {invoiceIdsToShow.slice(-6).reverse().map((id) => (
                  <FundableInvoiceCard
                    key={`${id}-${refreshKey}`}
                    tokenId={id}
                    onFund={handleFundInvoice}
                    isFunding={isFunding}
                  />
                ))}
              </div>
            )}

            {/* How It Works */}
            <Card className="mt-8 p-8">
              <h3 className="text-lg font-semibold text-white mb-6">How Investing Works</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    step: '01',
                    title: 'Deposit ETH',
                    description: 'Add liquidity to the pool to start earning',
                    icon: Plus,
                  },
                  {
                    step: '02',
                    title: 'Fund Invoices',
                    description: 'Browse verified invoices and fund them',
                    icon: DollarSign,
                  },
                  {
                    step: '03',
                    title: 'Earn Interest',
                    description: 'Receive 5% interest when loans are repaid',
                    icon: TrendingUp,
                  },
                ].map((item, index) => (
                  <div key={item.step} className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 
                        flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-2xl font-bold text-purple-400/30">{item.step}</span>
                    </div>
                    <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        type="deposit"
        onSubmit={handleDeposit}
        isPending={isDepositing}
      />
      <TransactionModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        type="withdraw"
        onSubmit={handleWithdraw}
        isPending={isWithdrawing}
        maxAmount={myBalance}
      />
    </div>
  );
}
