import { BigDecimal } from 'generated';

// Chains
export enum Chains {
  MON_TESTNET = 10143,
}

// Bigints
export const BI_ONE = BigInt(1);
export const BI_ZERO = BigInt(0);

// Bigdecimals
export const BD_ONE = new BigDecimal('1');
export const BD_ZERO = new BigDecimal('0');

export const RPC_URLS: { [key in Chains]: string } = {
  [Chains.MON_TESTNET]: 'https://10143.rpc.hypersync.xyz',
};

// Oracles
export const ORACLES: { [key in Chains]: `0x${string}` } = {
  [Chains.MON_TESTNET]: '0xf9e1b7c5c7830fc5aa4370c9286cbb4dd74b6b62',
};
