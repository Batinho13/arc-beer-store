import { createConfig, http, WagmiProvider } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet(),
  ],
  transports: {
    [arcTestnet.id]: http(),
  },
})

export function Web3Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
