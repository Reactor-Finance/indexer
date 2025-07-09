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
  [Chains.MON_TESTNET]: '0x5caa9d7fac6ef9ff9f50b95008ffb9f6299e8bcd',
};

// NFPM
export const NFP: { [key in Chains]: `0x${string}` } = {
  [Chains.MON_TESTNET]: '0x2a4440dF3351Bac4e7cb8b1D12E07f004aBc3372',
};

// WETH
export const WETH: { [key in Chains]: `0x${string}` } = {
  [Chains.MON_TESTNET]: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
};

// NFT managers
export const NFT_MANAGERS: { [key in Chains]: `0x${string}` } = {
  [Chains.MON_TESTNET]: '0x2a4440dF3351Bac4e7cb8b1D12E07f004aBc3372',
};
