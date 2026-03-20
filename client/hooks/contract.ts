"use client";

import {
  Contract,
  Networks,
  TransactionBuilder,
  Keypair,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
  rpc,
} from "@stellar/stellar-sdk";
import {
  isConnected,
  getAddress,
  signTransaction,
  setAllowed,
  isAllowed,
  requestAccess,
} from "@stellar/freighter-api";

// ============================================================
// CONSTANTS — Update these for your contract
// ============================================================

/** Your deployed Soroban contract ID */
export const CONTRACT_ADDRESS =
  "CAVA6ADLGBDYG3JATL23V6ATSGYAMILU7OYQEIE6D4UJ2ABIYWNR733Y";

/** Network passphrase (testnet by default) */
export const NETWORK_PASSPHRASE = Networks.TESTNET;

/** Soroban RPC URL */
export const RPC_URL = "https://soroban-testnet.stellar.org";

/** Horizon URL */
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

/** Network name for Freighter */
export const NETWORK = "TESTNET";

// ============================================================
// RPC Server Instance
// ============================================================

const server = new rpc.Server(RPC_URL);

// ============================================================
// Wallet Helpers
// ============================================================

export async function checkConnection(): Promise<boolean> {
  const result = await isConnected();
  return result.isConnected;
}

export async function connectWallet(): Promise<string> {
  const connResult = await isConnected();
  if (!connResult.isConnected) {
    throw new Error("Freighter extension is not installed or not available.");
  }

  const allowedResult = await isAllowed();
  if (!allowedResult.isAllowed) {
    await setAllowed();
    await requestAccess();
  }

  const { address } = await getAddress();
  if (!address) {
    throw new Error("Could not retrieve wallet address from Freighter.");
  }
  return address;
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const connResult = await isConnected();
    if (!connResult.isConnected) return null;

    const allowedResult = await isAllowed();
    if (!allowedResult.isAllowed) return null;

    const { address } = await getAddress();
    return address || null;
  } catch {
    return null;
  }
}

// ============================================================
// Contract Interaction Helpers
// ============================================================

/**
 * Build, simulate, and optionally sign + submit a Soroban contract call.
 */
export async function callContract(
  method: string,
  params: xdr.ScVal[] = [],
  caller: string,
  sign: boolean = true
) {
  const contract = new Contract(CONTRACT_ADDRESS);
  const account = await server.getAccount(caller);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...params))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(
      `Simulation failed: ${(simulated as rpc.Api.SimulateTransactionErrorResponse).error}`
    );
  }

  if (!sign) {
    return simulated;
  }

  const prepared = rpc.assembleTransaction(tx, simulated).build();

  const { signedTxXdr } = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const txToSubmit = TransactionBuilder.fromXDR(
    signedTxXdr,
    NETWORK_PASSPHRASE
  );

  const result = await server.sendTransaction(txToSubmit);

  if (result.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${result.status}`);
  }

  let getResult = await server.getTransaction(result.hash);
  while (getResult.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    getResult = await server.getTransaction(result.hash);
  }

  if (getResult.status === "FAILED") {
    throw new Error("Transaction failed on chain.");
  }

  return getResult;
}

/**
 * Read-only contract call (does not require signing).
 */
export async function readContract(
  method: string,
  params: xdr.ScVal[] = [],
  caller?: string
) {
  const account =
    caller || Keypair.random().publicKey();
  const sim = await callContract(method, params, account, false);
  if (
    rpc.Api.isSimulationSuccess(sim as rpc.Api.SimulateTransactionResponse) &&
    (sim as rpc.Api.SimulateTransactionSuccessResponse).result
  ) {
    return scValToNative(
      (sim as rpc.Api.SimulateTransactionSuccessResponse).result!.retval
    );
  }
  return null;
}

// ============================================================
// ScVal Conversion Helpers
// ============================================================

export function toScValString(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: "string" });
}

export function toScValU32(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: "u32" });
}

export function toScValI128(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "i128" });
}

export function toScValAddress(address: string): xdr.ScVal {
  return new Address(address).toScVal();
}

export function toScValBool(value: boolean): xdr.ScVal {
  return nativeToScVal(value, { type: "bool" });
}

// ============================================================
// Property Register — Contract Methods
// ============================================================

/**
 * Register a new property (permissionless - anyone can call).
 * Calls: register_property(owner: Address, id: String, location: String, description: String)
 */
export async function registerProperty(
  caller: string,
  owner: string,
  propertyId: string,
  location: string,
  description: string
) {
  return callContract(
    "register_property",
    [
      toScValAddress(owner),
      toScValString(propertyId),
      toScValString(location),
      toScValString(description),
    ],
    caller,
    true
  );
}

/**
 * Get property details (read-only).
 * Calls: get_property(id: String) -> Property struct
 * Returns: { id, location, description, owner, registered_at } or null
 */
export async function getProperty(
  propertyId: string,
  caller?: string
) {
  return readContract(
    "get_property",
    [toScValString(propertyId)],
    caller
  );
}

/**
 * Transfer property ownership (only owner can call).
 * Calls: transfer_property(from: Address, id: String, to: Address)
 */
export async function transferProperty(
  caller: string,
  from: string,
  propertyId: string,
  to: string
) {
  return callContract(
    "transfer_property",
    [
      toScValAddress(from),
      toScValString(propertyId),
      toScValAddress(to),
    ],
    caller,
    true
  );
}

/**
 * Get all properties owned by an address (read-only).
 * Calls: get_properties_by_owner(owner: Address) -> Vec<Property>
 */
export async function getPropertiesByOwner(
  owner: string,
  caller?: string
) {
  return readContract(
    "get_properties_by_owner",
    [toScValAddress(owner)],
    caller
  );
}

/**
 * Get total number of registered properties (read-only).
 * Calls: get_total_properties() -> u32
 */
export async function getTotalProperties(caller?: string) {
  return readContract(
    "get_total_properties",
    [],
    caller
  );
}

/**
 * Browse the entire public property registry (read-only).
 * Calls: list_all_properties() -> Vec<Property>
 */
export async function listAllProperties(caller?: string) {
  return readContract(
    "list_all_properties",
    [],
    caller
  );
}

/**
 * Check if a property exists (read-only).
 * Calls: property_exists(id: String) -> bool
 */
export async function propertyExists(propertyId: string, caller?: string) {
  return readContract(
    "property_exists",
    [toScValString(propertyId)],
    caller
  );
}

export { nativeToScVal, scValToNative, Address, xdr };
