import { Chains } from './constants';

export function deriveId(prefix: string, chainId: number = Chains.MON_TESTNET) {
  return prefix + '-' + chainId;
}
