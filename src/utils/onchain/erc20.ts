import { Address, createPublicClient, erc20Abi, getContract, http } from 'viem';
import { Chains, RPC_URLS } from '../constants';

export class ERC20 {
  private client: ReturnType<typeof createPublicClient>;
  private address: Address;

  protected constructor(chainId: Chains, address: Address) {
    this.address = address;
    this.client = createPublicClient({
      transport: http(RPC_URLS[chainId]),
    });
  }

  static init(chainId: number, address: Address) {
    return new ERC20(chainId, address);
  }

  private get contract() {
    return getContract({
      abi: erc20Abi,
      address: this.address,
      client: this.client,
    });
  }

  async name(): Promise<string | null> {
    try {
      return this.contract.read.name();
    } catch (error: any) {
      return null;
    }
  }

  async decimals(): Promise<number | null> {
    try {
      return this.contract.read.decimals();
    } catch (error: any) {
      return null;
    }
  }

  async symbol(): Promise<string | null> {
    try {
      return this.contract.read.symbol();
    } catch (error: any) {
      return null;
    }
  }

  async balanceOf(address: Address): Promise<bigint | null> {
    try {
      return this.contract.read.balanceOf([address]);
    } catch (error: any) {
      return null;
    }
  }
}
