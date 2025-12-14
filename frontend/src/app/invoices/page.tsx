'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import {
  FileText,
  Plus,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Calendar,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Upload,
  ArrowRight
} from 'lucide-react';
import { Card, Button, Badge, Input, Modal, ProgressBar } from '@/components/ui';
import {
  useCreatorInvoices,
  useInvoice,
  useMintInvoice,
  useVerifyWithOracle,
  useVerifyWithZK,
  useRepayLoan,
  useRepaymentAmount,
  formatETH,
  formatDate,
  Invoice
} from '@/hooks/useContracts';

// Invoice Status Badge
const InvoiceStatusBadge = ({ invoice }: { invoice: Invoice }) => {
  if (invoice.isRepaid) {
    return <Badge variant="success">Repaid</Badge>;
  }
  if (invoice.isFunded) {
    return <Badge variant="info">Funded</Badge>;
  }
  if (invoice.isVerified || invoice.isZkVerified) {
    return <Badge variant="success">Verified</Badge>;
  }
  return <Badge variant="warning">Pending</Badge>;
};

// Single Invoice Card Component
const InvoiceCard = ({ 
  tokenId, 
  onVerifyOracle, 
  onVerifyZK,
  onRepay,
  isVerifyingOracle,
  isVerifyingZK,
  isRepaying
}: { 
  tokenId: number;
  onVerifyOracle: (id: number) => void;
  onVerifyZK: (id: number) => void;
  onRepay: (id: number, amount: bigint) => void;
  isVerifyingOracle: boolean;
  isVerifyingZK: boolean;
  isRepaying: boolean;
}) => {
  const { invoice, isLoading, refetch } = useInvoice(tokenId);
  const { repaymentInfo, isLoading: isLoadingRepayment } = useRepaymentAmount(tokenId);

  if (isLoading || !invoice) {
    return (
      <div className="invoice-card animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
        <div className="h-4 bg-white/10 rounded w-2/3" />
      </div>
    );
  }

  const needsVerification = !invoice.isVerified && !invoice.isZkVerified && !invoice.isFunded;
  const dueDate = new Date(Number(invoice.dueDate) * 1000);
  const isOverdue = dueDate < new Date() && !invoice.isRepaid;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="invoice-card"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-semibold text-white">Invoice #{tokenId}</span>
            <InvoiceStatusBadge invoice={invoice} />
          </div>
          <p className="text-gray-400 text-sm">
            Created {formatDate(invoice.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold gradient-text">{formatETH(invoice.amount)} ETH</p>
          <p className={`text-sm ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
            Due: {formatDate(invoice.dueDate)}
          </p>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center
            ${invoice.isVerified || invoice.isZkVerified ? 'bg-green-500/20' : 'bg-white/10'}`}>
            {invoice.isVerified || invoice.isZkVerified ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
              <Shield className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <span className="text-sm text-gray-400">Verified</span>
        </div>
        <div className="flex-1 h-0.5 bg-white/10 rounded">
          <div className={`h-full rounded transition-all duration-500
            ${invoice.isFunded ? 'w-full bg-gradient-to-r from-purple-500 to-cyan-500' : 'w-0'}`} />
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center
            ${invoice.isFunded ? 'bg-green-500/20' : 'bg-white/10'}`}>
            {invoice.isFunded ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
              <DollarSign className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <span className="text-sm text-gray-400">Funded</span>
        </div>
        <div className="flex-1 h-0.5 bg-white/10 rounded">
          <div className={`h-full rounded transition-all duration-500
            ${invoice.isRepaid ? 'w-full bg-gradient-to-r from-cyan-500 to-green-500' : 'w-0'}`} />
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center
            ${invoice.isRepaid ? 'bg-green-500/20' : 'bg-white/10'}`}>
            {invoice.isRepaid ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
              <Clock className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <span className="text-sm text-gray-400">Repaid</span>
        </div>
      </div>

      {/* Action Buttons */}
      {needsVerification && (
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={Zap}
            onClick={() => onVerifyOracle(tokenId)}
            disabled={isVerifyingOracle || isVerifyingZK}
            loading={isVerifyingOracle}
          >
            Verify with Oracle
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Shield}
            onClick={() => onVerifyZK(tokenId)}
            disabled={isVerifyingOracle || isVerifyingZK}
            loading={isVerifyingZK}
          >
            Verify with ZK
          </Button>
        </div>
      )}

      {invoice.isFunded && !invoice.isRepaid && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-yellow-400">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Repayment Required</span>
            </div>
            <span className="text-lg font-bold text-white">
              {repaymentInfo ? formatETH(repaymentInfo.total) : formatETH(invoice.amount * 105n / 100n)} ETH
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            Principal: {repaymentInfo ? formatETH(repaymentInfo.principal) : formatETH(invoice.amount)} ETH + Interest: {repaymentInfo ? formatETH(repaymentInfo.interest) : formatETH(invoice.amount * 5n / 100n)} ETH
          </p>
          <Button
            variant="primary"
            fullWidth
            icon={DollarSign}
            onClick={() => onRepay(tokenId, repaymentInfo ? repaymentInfo.total : invoice.amount * 105n / 100n)}
            loading={isRepaying || isLoadingRepayment}
            disabled={!repaymentInfo}
          >
            Repay Loan
          </Button>
        </div>
      )}
    </motion.div>
  );
};

// Create Invoice Modal
const CreateInvoiceModal = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: string, dueDate: number) => void;
  isPending: boolean;
}) => {
  const [amount, setAmount] = useState('');
  const [dueDays, setDueDays] = useState('30');

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    const dueTimestamp = Math.floor(Date.now() / 1000) + parseInt(dueDays) * 24 * 60 * 60;
    onSubmit(amount, dueTimestamp);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Invoice">
      <div className="space-y-6">
        <Input
          label="Invoice Amount (ETH)"
          placeholder="0.00"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          suffix="ETH"
          icon={DollarSign}
        />
        <Input
          label="Due Date (Days from now)"
          placeholder="30"
          type="number"
          value={dueDays}
          onChange={(e) => setDueDays(e.target.value)}
          suffix="days"
          icon={Calendar}
        />
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <p className="text-sm text-gray-300">
            <span className="text-purple-400 font-medium">Note:</span> Your invoice will be 
            minted as an NFT on the blockchain. You'll need to verify it before requesting funding.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isPending}
            fullWidth
            icon={Upload}
          >
            Create Invoice
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default function InvoicesPage() {
  const { address, isConnected } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { invoiceIds, isLoading, refetch } = useCreatorInvoices(address);

  // Contract hooks
  const { mintInvoice, isPending: isMinting, isSuccess: mintSuccess, error: mintError } = useMintInvoice();
  const { verifyWithOracle, isPending: isVerifyingOracle, isSuccess: oracleSuccess, error: oracleError } = useVerifyWithOracle();
  const { verifyWithZK, isPending: isVerifyingZK, isSuccess: zkSuccess, error: zkError } = useVerifyWithZK();
  const { repayLoan, isPending: isRepaying, isSuccess: repaySuccess, error: repayError } = useRepayLoan();

  // Handle mint success
  useEffect(() => {
    if (mintSuccess) {
      toast.success('Invoice created successfully!');
      setIsModalOpen(false);
      refetch();
    }
  }, [mintSuccess, refetch]);

  // Handle mint error
  useEffect(() => {
    if (mintError) {
      console.error('Mint error:', mintError);
      toast.error(mintError.message || 'Failed to create invoice. Please try again.');
    }
  }, [mintError]);

  // Handle verification success
  useEffect(() => {
    if (oracleSuccess) {
      toast.success('Oracle verification completed!');
      setRefreshKey(k => k + 1);
      refetch();
    }
  }, [oracleSuccess, refetch]);

  // Handle oracle error
  useEffect(() => {
    if (oracleError) {
      console.error('Oracle error:', oracleError);
      toast.error(oracleError.message || 'Oracle verification failed.');
    }
  }, [oracleError]);

  useEffect(() => {
    if (zkSuccess) {
      toast.success('ZK verification completed!');
      setRefreshKey(k => k + 1);
      refetch();
    }
  }, [zkSuccess, refetch]);

  // Handle ZK error
  useEffect(() => {
    if (zkError) {
      console.error('ZK error:', zkError);
      toast.error(zkError.message || 'ZK verification failed.');
    }
  }, [zkError]);

  const handleCreateInvoice = (amount: string, dueDate: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    const tokenURI = `ipfs://QmChainFlowInvoice${Date.now()}`;
    mintInvoice(amount, dueDate, tokenURI);
  };

  const handleVerifyOracle = (tokenId: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    verifyWithOracle(tokenId);
  };

  const handleVerifyZK = (tokenId: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    verifyWithZK(tokenId);
  };

  const handleRepay = (tokenId: number, amount: bigint) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    // Convert bigint to ETH string for the repayLoan function
    const ethAmount = (Number(amount) / 1e18).toFixed(18);
    repayLoan(tokenId, ethAmount);
  };

  // Handle repay success
  useEffect(() => {
    if (repaySuccess) {
      toast.success('Loan repaid successfully!');
      setRefreshKey(k => k + 1);
      refetch();
    }
  }, [repaySuccess, refetch]);

  // Handle repay error
  useEffect(() => {
    if (repayError) {
      console.error('Repay error:', repayError);
      toast.error(repayError.message || 'Loan repayment failed.');
    }
  }, [repayError]);

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="floating-orb w-[500px] h-[500px] bg-purple-600/20 top-40 -right-40" />
        <div className="floating-orb w-[400px] h-[400px] bg-cyan-500/15 bottom-20 -left-40" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-purple-400" />
              <span className="text-purple-400 font-medium">My Invoices</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Invoice Management</h1>
            <p className="text-gray-400 text-lg">
              Create, verify, and manage your tokenized invoices
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()}>
              Refresh
            </Button>
            <Button 
              variant="primary" 
              icon={Plus} 
              onClick={() => {
                if (!isConnected) {
                  toast.error('Please connect your wallet first');
                  return;
                }
                setIsModalOpen(true);
              }}
            >
              New Invoice
            </Button>
          </div>
        </motion.div>

        {/* Connection Warning */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Wallet Not Connected</h3>
                <p className="text-gray-400 text-sm">
                  Please connect your wallet to view and manage your invoices
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {isConnected && (!invoiceIds || invoiceIds.length === 0) && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 
              flex items-center justify-center">
              <FileText className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No Invoices Yet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Start by creating your first invoice. It will be tokenized as an NFT and ready for financing.
            </p>
            <Button
              variant="primary"
              size="lg"
              icon={Plus}
              iconPosition="left"
              onClick={() => setIsModalOpen(true)}
            >
              Create Your First Invoice
            </Button>
          </motion.div>
        )}

        {/* Invoice List */}
        {isConnected && invoiceIds && invoiceIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {invoiceIds.map((id, index) => (
              <motion.div
                key={id.toString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <InvoiceCard
                  key={`${id.toString()}-${refreshKey}`}
                  tokenId={Number(id)}
                  onVerifyOracle={handleVerifyOracle}
                  onVerifyZK={handleVerifyZK}
                  onRepay={handleRepay}
                  isVerifyingOracle={isVerifyingOracle}
                  isVerifyingZK={isVerifyingZK}
                  isRepaying={isRepaying}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="invoice-card animate-pulse">
                <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
                <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
                <div className="h-4 bg-white/10 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateInvoice}
        isPending={isMinting}
      />
    </div>
  );
}
