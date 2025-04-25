import { getAddress } from 'viem';
import { Cache, CacheCategory } from './cache';
import { Chains } from './constants';
import { ERC20 } from './onchain/erc20';

export async function loadTokenDetails(address: string, chainId: number = Chains.MON_TESTNET) {
  try {
    // Viem compliant address
    const viemCompliantAddress = getAddress(address);
    // Load cache first
    const cache = Cache.init(CacheCategory.Token, chainId);
    const token = cache.read(viemCompliantAddress);

    if (token) return { ...token, id: viemCompliantAddress };

    // Bind contract
    const erc20Contract = ERC20.init(chainId, viemCompliantAddress);
    const [decimals, name, symbol] = await Promise.all([
      erc20Contract.decimals(),
      erc20Contract.name(),
      erc20Contract.symbol(),
    ]);

    if (decimals && name && symbol) {
      // New shape
      const newTokenShape = { decimals, name, symbol } as const;
      // Save in cache for future reference
      cache.add({
        [viemCompliantAddress]: newTokenShape as any,
      });

      return { ...newTokenShape, id: viemCompliantAddress };
    } else return null;
  } catch (error: any) {
    return null;
  }
}
