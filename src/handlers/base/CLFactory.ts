import { CLFactory } from 'generated';
import { getAddress } from 'viem';
import { BD_ZERO, BI_ZERO } from '../../utils/constants';
import { loadTokenDetails } from '../../utils/loaders';
import { Pool } from 'generated/src/Types.gen';
import { ERC20 } from '../../utils/onchain/erc20';

CLFactory.PoolCreated.contractRegister(
  ({ event, context }) => {
    context.addCLPool(event.params.pool);
  },
  { preRegisterDynamicContracts: true },
);

CLFactory.PoolCreated.handler(async ({ event, context }) => {
  const id = getAddress(event.params.pool);
  const token0Id = getAddress(event.params.token0);
  const token1Id = getAddress(event.params.token1);
  let token0 = await context.Token.get(token0Id);
  let token1 = await context.Token.get(token1Id);
  let statistics = await context.Statistics.get('1');
  let bundle = await context.Bundle.get('1');

  if (!statistics) {
    statistics = {
      id: '1',
      totalPairsCreated: 0n,
      totalVolumeLockedUSD: BD_ZERO,
      txCount: BI_ZERO,
      totalVolumeLockedETH: BD_ZERO,
      totalTradeVolumeUSD: BD_ZERO,
      totalTradeVolumeETH: BD_ZERO,
      totalFeesUSD: BD_ZERO,
    };
  }

  if (!bundle) {
    bundle = {
      id: '1',
      ethPrice: BD_ZERO,
    };
  }

  if (!token0) {
    const _t = await loadTokenDetails(token0Id, event.chainId);
    if (!_t) {
      context.log.error(`Could not fetch token details for ${token0Id}`);
      return; // Must pass
    }
    token0 = {
      ..._t,
      chainId: event.chainId,
      address: _t.id,
      derivedETH: BD_ZERO,
      derivedUSD: BD_ZERO,
      totalLiquidity: BD_ZERO,
      totalLiquidityUSD: BD_ZERO,
      txCount: BI_ZERO,
      tradeVolume: BD_ZERO,
      tradeVolumeUSD: BD_ZERO,
      totalLiquidityETH: BD_ZERO,
    };

    context.Token.set(token0);
  }

  if (!token1) {
    const _t = await loadTokenDetails(token1Id, event.chainId);
    if (!_t) {
      context.log.error(`Could not fetch token details for ${token1Id}`);
      return; // Must pass
    }
    token1 = {
      ..._t,
      chainId: event.chainId,
      address: _t.id,
      derivedETH: BD_ZERO,
      derivedUSD: BD_ZERO,
      totalLiquidity: BD_ZERO,
      totalLiquidityUSD: BD_ZERO,
      txCount: BI_ZERO,
      tradeVolume: BD_ZERO,
      tradeVolumeUSD: BD_ZERO,
      totalLiquidityETH: BD_ZERO,
    };

    context.Token.set(token1);
  }

  // Bind pool contract
  const poolContract = ERC20.init(event.chainId, getAddress(id));
  // Fetch pool name
  const name = await poolContract.name();
  // Must pass
  if (!name) {
    context.log.error(`Could not fetch token name for ${id}`);
    return;
  }
  const pool: Pool = {
    id,
    name,
    token0_id: token0.id,
    token1_id: token1.id,
    createdAtBlockNumber: BigInt(event.block.number),
    createdAtTimestamp: BigInt(event.block.timestamp),
    fees0CurrentEpoch: BD_ZERO,
    fees1CurrentEpoch: BD_ZERO,
    feesUSD: BD_ZERO,
    totalFees0: BD_ZERO,
    totalFees1: BD_ZERO,
    totalFeesUSD: BD_ZERO,
    totalBribesUSD: BD_ZERO,
    txCount: BI_ZERO,
    poolType: 'CONCENTRATED',
    reserve0: BD_ZERO,
    reserve1: BD_ZERO,
    reserveETH: BD_ZERO,
    reserveUSD: BD_ZERO,
    token0Price: BD_ZERO,
    token1Price: BD_ZERO,
    totalEmissions: BD_ZERO,
    totalEmissionsUSD: BD_ZERO,
    totalSupply: BD_ZERO,
    totalVotes: BD_ZERO,
    volumeToken0: BD_ZERO,
    volumeToken1: BD_ZERO,
    volumeUSD: BD_ZERO,
    volumeETH: BD_ZERO,
    gauge_id: undefined,
    tickSpacing: event.params.tickSpacing,
    liquidityManager: undefined,
  };

  statistics = {
    ...statistics,
    totalPairsCreated: statistics.totalPairsCreated + 1n,
  };

  context.Pool.set(pool);
  context.Statistics.set(statistics);
  context.Bundle.set(bundle);
});
