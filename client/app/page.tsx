"use client";

import { useState, useEffect, useCallback } from "react";
import { Meteors } from "@/components/ui/meteors";
import Navbar from "@/components/Navbar";
import ContractUI from "@/components/Contract";
import {
  connectWallet,
  getWalletAddress,
  checkConnection,
} from "@/hooks/contract";

const README_CONTENT = `# Property Registry Dapp

## Overview
A **permissionless property registry** on the Stellar blockchain — powered by Soroban smart contracts.

## Features
- Register properties on-chain
- Lookup property details
- Transfer property ownership
- All transactions settle in ~5 seconds for under $0.01

## Tech Stack
- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Wallet**: Freighter (Stellar)
- **Backend**: Soroban Smart Contracts (Rust)
- **Network**: Stellar Testnet

## Getting Started

\`\`\`bash
# Install dependencies
bun install

# Run development server
bun dev
\`\`\`

## Contract Address
Deploy your compiled Soroban contract and update the address in:
\`hooks/contract.ts\` → \`CONTRACT_ADDRESS\`

## Project Structure
\`\`\`
client/          # Next.js frontend
  app/           # App router pages
  components/    # React components
  hooks/         # Contract interaction hooks
  lib/           # Utilities
contract/        # Soroban Rust contracts
\`\`\`

## Learn More
- [Soroban Docs](https://soroban.stellar.org)
- [Stellar SDK](https://stellar.github.io/stellar-sdk)
- [Freighter Wallet](https://freighter.app)
`;

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showReadme, setShowReadme] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (await checkConnection()) {
          const addr = await getWalletAddress();
          if (addr) setWalletAddress(addr);
        }
      } catch {
        /* Freighter not installed */
      }
    })();
  }, []);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      setWalletAddress(await connectWallet());
    } catch {
      // handled in Contract component
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setWalletAddress(null);
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen bg-[#050510] overflow-hidden">
      {/* Meteors */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <Meteors number={12} />
      </div>

      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[#7c6cf0]/20 blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-[#4fc3f7]/15 blur-[120px] animate-float-delayed" />
      </div>

      {/* Navbar */}
      <Navbar
        walletAddress={walletAddress}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isConnecting={isConnecting}
      />

      {/* Hero + Content */}
      <main className="relative z-10 flex flex-1 w-full max-w-5xl mx-auto flex-col items-center px-6 pt-10 pb-16">
        {/* Hero — compact */}
        <div className="mb-10 text-center animate-fade-in-up">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-sm text-white/50 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7c6cf0] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7c6cf0]" />
            </span>
            Powered by Soroban on Stellar
          </div>

          <h1 className="mb-3">
            <span className="block text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
              <span className="text-white">Property Registry </span>
              <span className="bg-gradient-to-r from-[#7c6cf0] via-[#4fc3f7] to-[#7c6cf0] bg-[length:200%_auto] animate-gradient-shift bg-clip-text text-transparent">
                on the Blockchain
              </span>
            </span>
          </h1>

          <p className="mx-auto max-w-lg text-sm sm:text-base leading-relaxed text-white/40">
            Register properties, transfer ownership, and browse the immutable ledger — all permissionless on Stellar.
          </p>

          {/* Inline stats */}
          <div className="mt-6 flex items-center justify-center gap-6 sm:gap-10 animate-fade-in-up-delayed">
            {[
              { label: "Finality", value: "~5s" },
              { label: "Cost", value: "<$0.01" },
              { label: "Network", value: "Testnet" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-lg sm:text-xl font-bold text-white/90 font-mono">{stat.value}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contract UI */}
        <ContractUI
          walletAddress={walletAddress}
          onConnect={handleConnect}
          isConnecting={isConnecting}
        />

        {/* Footer */}
        <div className="mt-10 flex flex-col items-center gap-4 animate-fade-in">
          {/* Property register flow */}
          <div className="flex items-center gap-3 text-xs text-white/20">
            {["Register", "Lookup", "Transfer"].map((step, i) => (
              <span key={step} className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      i === 0
                        ? "bg-[#7c6cf0]/50"
                        : i === 1
                          ? "bg-[#4fc3f7]/50"
                          : "bg-[#34d399]/50"
                    }`}
                  />
                  <span className="font-mono">{step}</span>
                </span>
                {i < 2 && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/10">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[10px] text-white/15">
            <span>Stellar Network</span>
            <span className="h-2.5 w-px bg-white/10" />
            <span>Freighter Wallet</span>
            <span className="h-2.5 w-px bg-white/10" />
            <span>Soroban Smart Contracts</span>
            <span className="h-2.5 w-px bg-white/10" />
            <button
              onClick={() => setShowReadme(true)}
              className="cursor-pointer hover:text-white/40 transition-colors duration-200"
            >
              📄 README
            </button>
          </div>
        </div>
      </main>

      {/* README Preview Modal */}
      {showReadme && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowReadme(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative w-full max-w-2xl max-h-[80vh] bg-[#0d0d1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <h2 className="text-lg font-semibold text-white">README.md</h2>
              </div>
              <button
                onClick={() => setShowReadme(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-72px)] p-6">
              <pre className="text-sm text-white/70 font-mono whitespace-pre-wrap leading-relaxed">
                {README_CONTENT}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
