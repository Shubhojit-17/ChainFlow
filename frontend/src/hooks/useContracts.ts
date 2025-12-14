'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState, useEffect } from 'react';
import { 
  CONTRACT_ADDRESSES, 
  INVOICE_NFT_ABI, 
  LENDING_POOL_ABI 
} from '@/config/contracts';

// Types
export interface Invoice {
  tokenId: number;
  amount: bigint;
  dueDate: bigint;
  creator: string;
  isVerified: boolean;
  isZkVerified: boolean;
  isFunded: boolean;
  isRepaid: boolean;
  createdAt: bigint;
}

export interface Loan {
  borrower: string;
  principal: bigint;
  interestAmount: bigint;
  fundedAt: bigint;
  isActive: boolean;
}

export interface PoolStats {
  available: bigint;
  borrowed: bigint;
  interestEarned: bigint;
  investorCount: bigint;
}

// Hook for reading pool stats
export function usePoolStats() {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.LENDING_POOL as `0x${string}`,
    abi: LENDING_POOL_ABI,
    functionName: 'getPoolStats',
  });

  const stats: PoolStats | null = data ? {
    available: data[0],
    borrowed: data[1],
    interestEarned: data[2],
    investorCount: data[3],
  } : null;

  return { stats, isLoading, refetch };
}

// Hook for reading investor balance (includes proportional share of interest)
export function useInvestorBalance(address: string | undefined) {
  // Get the raw deposited balance
  const { data: rawBalance, isLoading: balanceLoading, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.LENDING_POOL as `0x${string}`,
    abi: LENDING_POOL_ABI,
    functionName: 'investorBalances',
    args: address ? [address as `0x${string}`] : undefined,
  });

  // Get pool stats to calculate interest share
  const { data: poolStats, isLoading: statsLoading, refetch: refetchStats } = useReadContract({
    address: CONTRACT_ADDRESSES.LENDING_POOL as `0x${string}`,
    abi: LENDING_POOL_ABI,
    functionName: 'getPoolStats',
  });

  // Calculate total balance including proportional interest share
  let balance: bigint | undefined = rawBalance as bigint | undefined;
  
  if (rawBalance && poolStats) {
    const deposited = rawBalance as bigint;
    const available = poolStats[0] as bigint;
    const borrowed = poolStats[1] as bigint;
    const interestEarned = poolStats[2] as bigint;
    
    // Total pool value = available liquidity (which includes interest already)
    // The investor's share = (their deposit / total deposits) * total pool value
    // Since interest is added to totalLiquidity when repaid, we calculate share
    const totalDeposits = available + borrowed - interestEarned; // Original deposits without interest
    
    if (totalDeposits > 0n && deposited > 0n) {
      // Investor's share of the pool including interest
      // share = deposit / totalDeposits * (available + borrowed)
      // Simplified: deposit + (deposit / totalDeposits * interestEarned)
      const interestShare = (deposited * interestEarned) / totalDeposits;
      balance = deposited + interestShare;
    }
  }

  const refetch = () => {
    refetchBalance();
    refetchStats();
  };

  return { 
    balance,
    rawBalance: rawBalance as bigint | undefined,
    isLoading: balanceLoading || statsLoading, 
    refetch 
  };
}

// Hook for depositing to lending pool
export function useDeposit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = (amount: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.LENDING_POOL as `0x${string}`,
      abi: LENDING_POOL_ABI,
      functionName: 'deposit',
      value: parseEther(amount),
    });
  };

  return { 
    deposit, 
    isPending, 
    isConfirming, 
    isSuccess, 
    error,
    hash,
  };
}

// Hook for withdrawing from lending pool
export function useWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdraw = (amount: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.LENDING_POOL as `0x${string}`,
      abi: LENDING_POOL_ABI,
      functionName: 'withdraw',
      args: [parseEther(amount)],
    });
  };

  return { withdraw, isPending, isConfirming, isSuccess, error, hash };
}

// Hook for minting an invoice
export function useMintInvoice() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mintInvoice = (amount: string, dueDate: number, tokenURI: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.INVOICE_NFT as `0x${string}`,
      abi: INVOICE_NFT_ABI,
      functionName: 'mintInvoice',
      args: [parseEther(amount), BigInt(dueDate), tokenURI],
    });
  };

  return { mintInvoice, isPending, isConfirming, isSuccess, error, hash };
}

// Hook for verifying with oracle
export function useVerifyWithOracle() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const verifyWithOracle = (tokenId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.INVOICE_NFT as `0x${string}`,
      abi: INVOICE_NFT_ABI,
      functionName: 'verifyWithOracle',
      args: [BigInt(tokenId)],
    });
  };

  return { verifyWithOracle, isPending, isConfirming, isSuccess, error, hash };
}

// Hook for verifying with ZK proof
export function useVerifyWithZK() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const verifyWithZK = (tokenId: number) => {
    // Mock ZK proof parameters
    const mockProof = {
      a: [1n, 2n] as [bigint, bigint],
      b: [[3n, 4n], [5n, 6n]] as [[bigint, bigint], [bigint, bigint]],
      c: [7n, 8n] as [bigint, bigint],
      input: [BigInt(Date.now())] as [bigint],
    };

    writeContract({
      address: CONTRACT_ADDRESSES.INVOICE_NFT as `0x${string}`,
      abi: INVOICE_NFT_ABI,
      functionName: 'verifyWithZK',
      args: [BigInt(tokenId), mockProof.a, mockProof.b, mockProof.c, mockProof.input],
    });
  };

  return { verifyWithZK, isPending, isConfirming, isSuccess, error, hash };
}

// Hook for funding an invoice
export function useFundInvoice() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const fundInvoice = (tokenId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.LENDING_POOL as `0x${string}`,
      abi: LENDING_POOL_ABI,
      functionName: 'fundInvoice',
      args: [BigInt(tokenId)],
    });
  };

  return { fundInvoice, isPending, isConfirming, isSuccess, error, hash };
}

// Hook for repaying a loan
export function useRepayLoan() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const repayLoan = (tokenId: number, amount: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.LENDING_POOL as `0x${string}`,
      abi: LENDING_POOL_ABI,
      functionName: 'repayLoan',
      args: [BigInt(tokenId)],
      value: parseEther(amount),
    });
  };

  return { repayLoan, isPending, isConfirming, isSuccess, error, hash };
}

// Hook for getting invoice details
export function useInvoice(tokenId: number | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.INVOICE_NFT as `0x${string}`,
    abi: INVOICE_NFT_ABI,
    functionName: 'getInvoice',
    args: tokenId ? [BigInt(tokenId)] : undefined,
  });

  const invoice: Invoice | null = data ? {
    tokenId: tokenId!,
    amount: (data as any).amount,
    dueDate: (data as any).dueDate,
    creator: (data as any).creator,
    isVerified: (data as any).isVerified,
    isZkVerified: (data as any).isZkVerified,
    isFunded: (data as any).isFunded,
    isRepaid: (data as any).isRepaid,
    createdAt: (data as any).createdAt,
  } : null;

  return { invoice, isLoading, refetch };
}

// Hook for getting creator invoices
export function useCreatorInvoices(address: string | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.INVOICE_NFT as `0x${string}`,
    abi: INVOICE_NFT_ABI,
    functionName: 'getCreatorInvoices',
    args: address ? [address as `0x${string}`] : undefined,
  });

  return { 
    invoiceIds: data as bigint[] | undefined, 
    isLoading, 
    refetch 
  };
}

// Hook for getting current token ID
export function useCurrentTokenId() {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.INVOICE_NFT as `0x${string}`,
    abi: INVOICE_NFT_ABI,
    functionName: 'getCurrentTokenId',
  });

  return { currentTokenId: data as bigint | undefined, isLoading, refetch };
}

// Hook for getting repayment amount
export function useRepaymentAmount(tokenId: number | undefined) {
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.LENDING_POOL as `0x${string}`,
    abi: LENDING_POOL_ABI,
    functionName: 'getRepaymentAmount',
    args: tokenId ? [BigInt(tokenId)] : undefined,
  });

  return {
    repayment: data ? {
      principal: data[0],
      interest: data[1],
      total: data[2],
    } : null,
    isLoading,
  };
}

// Types for activity events
export interface ActivityEvent {
  type: 'deposit' | 'funded' | 'repaid' | 'minted' | 'verified';
  amount: bigint;
  timestamp: bigint;
  tokenId?: bigint;
  address?: string;
  blockNumber: bigint;
}

// Known event topic signatures (keccak256 hashes)
const EVENT_TOPICS = {
  // InvoiceNFT events
  InvoiceMinted: '0xb74a6be41b5cd4404e4e192af658d57e6a3a6b988e910bebc36c1349040e31e3',
  OracleVerificationCompleted: '0x5282d1d3a908017a4b455d08a55e6403c0861f333b95fc84cd3f3d9ebc99b1b3',
  PrivacyProofAccepted: '0xd49cb26360e8a62d93c677b82d920e8d261229c2174edd6172f25763bc912498',
  InvoiceFundingStatusChanged: '0xf2e3e34f415a846caff9e896807aa323797229da27f47153e6f3dd2e08efae33',
  
  // LendingPool events
  Deposited: '0x73a19dd210f1a7f902193214c0ee91dd35ee5b4d920cba8d519eca65a7b488ca',
  InvoiceFunded: '0x505d13f6237f1fb1f412dfc253f6124671aa7784bb9b98411e6183eb11bdb8a5',
  LoanRepaid: '0x6d9df5f5c04c4e8a7c0c3bfe287e1bea93a2f1e6bad45e1f5c9d7d6a8e2d0a21', // Placeholder
};

// Hook for fetching recent activity from contract events
export function useRecentActivity(limit: number = 50) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const refetch = () => setRefreshCounter(c => c + 1);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch all logs from the beginning
        const logsResponse = await fetch('http://127.0.0.1:8545', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getLogs',
            params: [{
              fromBlock: '0x0',
              toBlock: 'latest',
              address: [
                CONTRACT_ADDRESSES.LENDING_POOL,
                CONTRACT_ADDRESSES.INVOICE_NFT,
              ],
            }],
            id: Date.now(), // Unique ID to prevent caching
          }),
        });

        if (!logsResponse.ok) {
          setIsLoading(false);
          return;
        }

        const logsData = await logsResponse.json();
        const logs = logsData.result || [];
        

        const parsedActivities: ActivityEvent[] = [];

        for (const log of logs) {
          const topic0 = log.topics?.[0]?.toLowerCase() || '';
          const blockNumber = BigInt(log.blockNumber || '0');
          const logData = log.data || '0x';
          
          // Get tokenId from indexed topic[1] if present
          let tokenId: bigint | undefined;
          if (log.topics?.[1]) {
            try {
              tokenId = BigInt(log.topics[1]);
            } catch {
              tokenId = undefined;
            }
          }

          // Parse amount from first 32 bytes of data
          let amount = 0n;
          if (logData.length >= 66) {
            try {
              amount = BigInt('0x' + logData.slice(2, 66));
            } catch {
              amount = 0n;
            }
          }

          // Match event by exact topic hash
          switch (topic0) {
            case EVENT_TOPICS.InvoiceMinted.toLowerCase():
              parsedActivities.push({
                type: 'minted',
                amount,
                timestamp: BigInt(Math.floor(Date.now() / 1000)),
                tokenId,
                blockNumber,
              });
              break;

            case EVENT_TOPICS.OracleVerificationCompleted.toLowerCase():
            case EVENT_TOPICS.PrivacyProofAccepted.toLowerCase():
              parsedActivities.push({
                type: 'verified',
                amount: 0n,
                timestamp: BigInt(Math.floor(Date.now() / 1000)),
                tokenId,
                blockNumber,
              });
              break;

            case EVENT_TOPICS.Deposited.toLowerCase():
              parsedActivities.push({
                type: 'deposit',
                amount,
                timestamp: BigInt(Math.floor(Date.now() / 1000)),
                blockNumber,
              });
              break;

            case EVENT_TOPICS.InvoiceFunded.toLowerCase():
              parsedActivities.push({
                type: 'funded',
                amount,
                timestamp: BigInt(Math.floor(Date.now() / 1000)),
                tokenId,
                blockNumber,
              });
              break;

            case EVENT_TOPICS.InvoiceFundingStatusChanged.toLowerCase():
              // Check if it's funded (isFunded = true in data)
              if (logData.length >= 66) {
                const isFunded = BigInt('0x' + logData.slice(2, 66)) === 1n;
                if (isFunded) {
                  parsedActivities.push({
                    type: 'funded',
                    amount: 0n,
                    timestamp: BigInt(Math.floor(Date.now() / 1000)),
                    tokenId,
                    blockNumber,
                  });
                }
              }
              break;
          }
        }

        // Sort by block number descending (most recent first)
        parsedActivities.sort((a, b) => Number(b.blockNumber - a.blockNumber));
        
        setActivities(parsedActivities.slice(0, limit));
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching activity:', error);
        setIsLoading(false);
      }
    };

    fetchEvents();
    
    // Poll every 3 seconds for more responsive updates
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, [refreshCounter, limit]);

  return { activities, isLoading, refetch };
}

// Utility to format ETH values
export function formatETH(value: bigint | undefined): string {
  if (!value) return '0';
  return parseFloat(formatEther(value)).toFixed(4);
}

// Utility to format date from timestamp
export function formatDate(timestamp: bigint | undefined): string {
  if (!timestamp) return '';
  return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
