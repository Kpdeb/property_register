"use client";

import { useState, useCallback, useEffect } from "react";
import {
  registerProperty,
  getProperty,
  transferProperty,
  getPropertiesByOwner,
  getTotalProperties,
  listAllProperties,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function BrowseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  returns,
  color,
}: {
  name: string;
  params: string;
  returns?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
      {returns && (
        <span className="ml-auto text-white/15 text-[10px]">{returns}</span>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

type Tab = "register" | "lookup" | "transfer" | "my-properties" | "browse";

interface PropertyData {
  id: string;
  location: string;
  description: string;
  owner: string;
  registered_at: number;
}

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("register");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [totalProperties, setTotalProperties] = useState<number>(0);

  // Register form
  const [regOwner, setRegOwner] = useState("");
  const [regId, setRegId] = useState("");
  const [regLocation, setRegLocation] = useState("");
  const [regDescription, setRegDescription] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Lookup form
  const [lookupId, setLookupId] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);

  // Transfer form
  const [transferId, setTransferId] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // My properties
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [myProperties, setMyProperties] = useState<PropertyData[]>([]);

  // Browse registry
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [allProperties, setAllProperties] = useState<PropertyData[]>([]);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Fetch total properties count
  useEffect(() => {
    const fetchTotal = async () => {
      try {
        const total = await getTotalProperties();
        if (typeof total === "number") {
          setTotalProperties(total);
        }
      } catch {}
    };
    fetchTotal();
    const interval = setInterval(fetchTotal, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!regOwner.trim() || !regId.trim() || !regLocation.trim() || !regDescription.trim()) {
      return setError("Fill in all fields");
    }
    setError(null);
    setIsRegistering(true);
    setTxStatus("Awaiting signature...");
    try {
      await registerProperty(walletAddress, regOwner.trim(), regId.trim(), regLocation.trim(), regDescription.trim());
      setTxStatus("Property registered on-chain!");
      setRegOwner("");
      setRegId("");
      setRegLocation("");
      setRegDescription("");
      setTotalProperties((prev) => prev + 1);
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsRegistering(false);
    }
  }, [walletAddress, regOwner, regId, regLocation, regDescription]);

  const handleLookup = useCallback(async () => {
    if (!lookupId.trim()) return setError("Enter a property ID");
    setError(null);
    setIsLookingUp(true);
    setPropertyData(null);
    try {
      const result = await getProperty(lookupId.trim(), walletAddress || undefined);
      if (result && typeof result === "object") {
        setPropertyData(result as PropertyData);
      } else {
        setError("Property not found");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsLookingUp(false);
    }
  }, [lookupId, walletAddress]);

  const handleTransfer = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!transferId.trim() || !transferTo.trim()) return setError("Fill in all fields");
    setError(null);
    setIsTransferring(true);
    setTxStatus("Awaiting signature...");
    try {
      await transferProperty(walletAddress, walletAddress, transferId.trim(), transferTo.trim());
      setTxStatus("Property transferred on-chain!");
      setTransferId("");
      setTransferTo("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsTransferring(false);
    }
  }, [walletAddress, transferId, transferTo]);

  const handleLoadMyProperties = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    setError(null);
    setIsLoadingProperties(true);
    try {
      const result = await getPropertiesByOwner(walletAddress, walletAddress);
      if (Array.isArray(result)) {
        setMyProperties(result as PropertyData[]);
      } else {
        setMyProperties([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsLoadingProperties(false);
    }
  }, [walletAddress]);

  const handleBrowseRegistry = useCallback(async () => {
    setError(null);
    setIsBrowsing(true);
    try {
      const result = await listAllProperties();
      if (Array.isArray(result)) {
        setAllProperties(result as PropertyData[]);
      } else {
        setAllProperties([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsBrowsing(false);
    }
  }, []);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "register", label: "Register", icon: <BuildingIcon />, color: "#7c6cf0" },
    { key: "lookup", label: "Lookup", icon: <SearchIcon />, color: "#4fc3f7" },
    { key: "transfer", label: "Transfer", icon: <RefreshIcon />, color: "#fbbf24" },
    { key: "my-properties", label: "My Properties", icon: <HomeIcon />, color: "#34d399" },
    { key: "browse", label: "Browse Registry", icon: <BrowseIcon />, color: "#f472b6" },
  ];

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("on-chain") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#4fc3f7]/20 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7c6cf0]">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">Property Register</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="info" className="text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4fc3f7] mr-1.5" />
                {totalProperties} Registered
              </Badge>
              <Badge variant="success" className="text-[10px]">Soroban</Badge>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); setPropertyData(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Register */}
            {activeTab === "register" && (
              <div className="space-y-5">
                <MethodSignature 
                  name="register_property" 
                  params="(owner: Address, id: String, location: String, description: String)" 
                  color="#7c6cf0" 
                />
                <div className="rounded-xl border border-[#7c6cf0]/10 bg-[#7c6cf0]/[0.02] px-4 py-3 text-[11px] text-white/40">
                  <span className="text-[#7c6cf0]">⚡ Permissionless:</span> Anyone can register a property. Set the owner address below.
                </div>
                <Input label="Owner Address (G...)" value={regOwner} onChange={(e) => setRegOwner(e.target.value)} placeholder="e.g. GDIY..." />
                <Input label="Property ID" value={regId} onChange={(e) => setRegId(e.target.value)} placeholder="e.g. PROP-001" />
                <Input label="Location" value={regLocation} onChange={(e) => setRegLocation(e.target.value)} placeholder="e.g. 123 Main St, City" />
                <Input label="Description" value={regDescription} onChange={(e) => setRegDescription(e.target.value)} placeholder="e.g. 3 bedroom house" />
                {walletAddress ? (
                  <ShimmerButton onClick={handleRegister} disabled={isRegistering} shimmerColor="#7c6cf0" className="w-full">
                    {isRegistering ? <><SpinnerIcon /> Registering...</> : <><BuildingIcon /> Register Property</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to register properties
                  </button>
                )}
              </div>
            )}

            {/* Lookup */}
            {activeTab === "lookup" && (
              <div className="space-y-5">
                <MethodSignature 
                  name="get_property" 
                  params="(id: String)" 
                  returns="-> Property" 
                  color="#4fc3f7" 
                />
                <Input label="Property ID" value={lookupId} onChange={(e) => setLookupId(e.target.value)} placeholder="e.g. PROP-001" />
                <ShimmerButton onClick={handleLookup} disabled={isLookingUp} shimmerColor="#4fc3f7" className="w-full">
                  {isLookingUp ? <><SpinnerIcon /> Searching...</> : <><SearchIcon /> Lookup Property</>}
                </ShimmerButton>

                {propertyData && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-fade-in-up">
                    <div className="border-b border-white/[0.06] px-4 py-3">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">Property Details</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-white/35 mt-0.5"><BuildingIcon /></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/35">Property ID</p>
                          <p className="font-mono text-sm text-white/80 truncate">{propertyData.id}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-white/35 mt-0.5"><MapPinIcon /></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/35">Location</p>
                          <p className="font-mono text-sm text-white/80">{propertyData.location}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-white/35 mt-0.5"><HomeIcon /></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/35">Description</p>
                          <p className="font-mono text-sm text-white/80">{propertyData.description}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-white/35 mt-0.5"><UserIcon /></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/35">Owner</p>
                          <p className="font-mono text-sm text-white/80">{propertyData.owner}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transfer */}
            {activeTab === "transfer" && (
              <div className="space-y-5">
                <MethodSignature 
                  name="transfer_property" 
                  params="(from: Address, id: String, to: Address)" 
                  color="#fbbf24" 
                />
                <div className="rounded-xl border border-[#fbbf24]/10 bg-[#fbbf24]/[0.02] px-4 py-3 text-[11px] text-white/40">
                  <span className="text-[#fbbf24]">🔒 Auth Required:</span> Only the current owner can transfer a property.
                </div>
                <Input label="Property ID" value={transferId} onChange={(e) => setTransferId(e.target.value)} placeholder="e.g. PROP-001" />
                <Input label="New Owner Address (G...)" value={transferTo} onChange={(e) => setTransferTo(e.target.value)} placeholder="e.g. GDIY..." />
                {walletAddress ? (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[11px] text-white/30">
                    <span className="text-white/35">Current wallet:</span> {truncate(walletAddress)}
                  </div>
                ) : null}
                {walletAddress ? (
                  <ShimmerButton onClick={handleTransfer} disabled={isTransferring} shimmerColor="#fbbf24" className="w-full">
                    {isTransferring ? <><SpinnerIcon /> Transferring...</> : <><RefreshIcon /> Transfer Ownership</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#fbbf24]/20 bg-[#fbbf24]/[0.03] py-4 text-sm text-[#fbbf24]/60 hover:border-[#fbbf24]/30 hover:text-[#fbbf24]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to transfer properties
                  </button>
                )}
              </div>
            )}

            {/* My Properties */}
            {activeTab === "my-properties" && (
              <div className="space-y-5">
                <MethodSignature 
                  name="get_properties_by_owner" 
                  params="(owner: Address)" 
                  returns="-> Vec<Property>" 
                  color="#34d399" 
                />
                <div className="flex items-center justify-between">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[11px] text-white/30">
                    <span className="text-white/35">Properties owned:</span> {myProperties.length}
                  </div>
                </div>
                {walletAddress ? (
                  <ShimmerButton onClick={handleLoadMyProperties} disabled={isLoadingProperties} shimmerColor="#34d399" className="w-full">
                    {isLoadingProperties ? <><SpinnerIcon /> Loading...</> : <><UsersIcon /> Load My Properties</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#34d399]/20 bg-[#34d399]/[0.03] py-4 text-sm text-[#34d399]/60 hover:border-[#34d399]/30 hover:text-[#34d399]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to view properties
                  </button>
                )}

                {myProperties.length > 0 && (
                  <div className="space-y-3">
                    {myProperties.map((prop, idx) => (
                      <div key={idx} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-mono text-sm text-white/80">{prop.id}</p>
                            <p className="text-xs text-white/35 mt-1">{prop.location}</p>
                          </div>
                          <Badge variant="success" className="text-[9px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] mr-1" />
                            Active
                          </Badge>
                        </div>
                        <p className="text-xs text-white/30 mt-2">{prop.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Browse Registry */}
            {activeTab === "browse" && (
              <div className="space-y-5">
                <MethodSignature 
                  name="list_all_properties" 
                  params="()" 
                  returns="-> Vec<Property>" 
                  color="#f472b6" 
                />
                <div className="rounded-xl border border-[#f472b6]/10 bg-[#f472b6]/[0.02] px-4 py-3 text-[11px] text-white/40">
                  <span className="text-[#f472b6]">🌐 Public Registry:</span> Browse all {allProperties.length} registered properties. No wallet required.
                </div>
                <ShimmerButton onClick={handleBrowseRegistry} disabled={isBrowsing} shimmerColor="#f472b6" className="w-full">
                  {isBrowsing ? <><SpinnerIcon /> Loading...</> : <><BrowseIcon /> Browse All Properties</>}
                </ShimmerButton>

                {allProperties.length > 0 && (
                  <div className="space-y-3">
                    {allProperties.map((prop, idx) => (
                      <div key={idx} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 animate-fade-in-up" style={{ animationDelay: `${idx * 30}ms` }}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-mono text-sm text-white/80">{prop.id}</p>
                            <p className="text-xs text-white/35 mt-1">{prop.location}</p>
                          </div>
                          <Badge variant="info" className="text-[9px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#4fc3f7] mr-1" />
                            Registered
                          </Badge>
                        </div>
                        <p className="text-xs text-white/30 mt-2">{prop.description}</p>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                          <span className="text-white/25"><UserIcon /></span>
                          <p className="text-[10px] font-mono text-white/35">{prop.owner}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {allProperties.length === 0 && !isBrowsing && (
                  <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-6 text-center">
                    <p className="text-sm text-white/30">No properties registered yet</p>
                    <p className="text-[10px] text-white/20 mt-1">Be the first to register a property!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">Property Register &middot; Soroban</p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#34d399]" />
                <span className="font-mono text-[9px] text-white/15">Register</span>
              </span>
              <span className="text-white/10 text-[8px]">&rarr;</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#fbbf24]" />
                <span className="font-mono text-[9px] text-white/15">Transfer</span>
              </span>
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
