import { BigDecimal } from 'generated';

// Chains
export enum Chains {
  MON_TESTNET = 10143,
}

// Bigints
export const BI_ONE = BigInt(1);
export const BI_ZERO = BigInt(0);
export const LOCK_MAX_TIME = BigInt(2 * 365 * 86400);
export const WEEK = BigInt(7 * 86400);

// Bigdecimals
export const BD_ONE = new BigDecimal('1');
export const BD_ZERO = new BigDecimal('0');

export const RPC_URLS: { [key in Chains]: string } = {
  [Chains.MON_TESTNET]: 'https://testnet-rpc.monad.xyz',
};

// Oracles
export const ORACLES: { [key in Chains]: `0x${string}` } = {
  [Chains.MON_TESTNET]: '0x621185acfc40204a6223b5d7696ebb9bcae6d7b1',
};

// NFPM
export const NFP: { [key in Chains]: `0x${string}` } = {
  [Chains.MON_TESTNET]: '0xFa6E328201670537CB7B0d05F26921B8233F4B8b',
};

// WETH
export const WETH: { [key in Chains]: `0x${string}` } = {
  [Chains.MON_TESTNET]: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
};

// NFT managers
export const NFT_MANAGERS: { [key in Chains]: `0x${string}` } = {
  [Chains.MON_TESTNET]: '0xFa6E328201670537CB7B0d05F26921B8233F4B8b',
};
