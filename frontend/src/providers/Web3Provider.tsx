'use client';

import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

// Define Hardhat chain with explicit RPC URL
const hardhatLocal = {
  id: 31337,
  name: 'Hardhat Local',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
} as const;

// WalletConnect Project ID - Get yours at https://cloud.walletconnect.com
// For local development, you can use a placeholder but MetaMask will still work
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

// Configure wagmi with Hardhat local chain
const config = getDefaultConfig({
  appName: 'ChainFlow Factor',
  projectId: projectId,
  chains: [hardhatLocal],
  transports: {
    [hardhatLocal.id]: http('http://127.0.0.1:8545'),
  },
  ssr: true,
});

const queryClient = new QueryClient();

// Custom RainbowKit theme matching our design
const customTheme = darkTheme({
  accentColor: '#8b5cf6',
  accentColorForeground: 'white',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small',
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={customTheme}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
