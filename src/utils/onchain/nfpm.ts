import { Address, createPublicClient, getContract, http } from 'viem';
import { Chains, NFP, RPC_URLS } from '../constants';
import nfpmAbi from './abis/nfpm';

export class NFPM {
  private client: ReturnType<typeof createPublicClient>;
  private address: Address;

  protected constructor(chainId: Chains) {
    this.address = NFP[chainId];
    this.client = createPublicClient({
      transport: http(RPC_URLS[chainId]),
    });
  }

  static init(chainId: number) {
    return new NFPM(chainId);
  }

  private get contract() {
    return getContract({
      abi: nfpmAbi,
      address: this.address,
      client: this.client,
    });
  }

  async positions(tokenId: bigint) {
    try {
      const pst = await this.contract.read.positions([tokenId]);
      return pst;
    } catch (error: any) {
      return null;
    }
  }
}
