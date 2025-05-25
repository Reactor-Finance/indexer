import { CLFactory } from 'generated';
import { getAddress } from 'viem';
import { BD_ZERO, BI_ZERO } from '../../utils/constants';
import { loadTokenDetails } from '../../utils/loaders';
import { Pool } from 'generated/src/Types.gen';
import { ERC20 } from '../../utils/onchain/erc20';
import { deriveId } from '../../utils/misc';

CLFactory.PoolCreated.contractRegister(
  ({ event, context }) => {
    context.addCLPool(event.params.pool);
  },
  { preRegisterDynamicContracts: true },
);

CLFactory.PoolCreated.handler(async ({ event, context }) => {
  const id = getAddress(event.params.pool);
  const token0Address = getAddress(event.params.token0);
  const token1Address = getAddress(event.params.token1);
  let token0 = await context.Token.get(deriveId(token0Address, event.chainId));
  let token1 = await context.Token.get(deriveId(token1Address, event.chainId));
  let statistics = await context.Statistics.get(deriveId('1', event.chainId));
  let bundle = await context.Bundle.get(deriveId('1', event.chainId));

  if (!statistics) {
    statistics = {
      id: deriveId('1', event.chainId),
      totalPairsCreated: 0n,
      totalVolumeLockedUSD: BD_ZERO,
      txCount: BI_ZERO,
      totalVolumeLockedETH: BD_ZERO,
      totalTradeVolumeUSD: BD_ZERO,
      totalTradeVolumeETH: BD_ZERO,
      totalFeesUSD: BD_ZERO,
      totalBribesUSD: BD_ZERO,
    };
  }

  if (!bundle) {
    bundle = {
      id: deriveId('1', event.chainId),
      ethPrice: BD_ZERO,
    };
  }

  if (!token0) {
    const _t = await loadTokenDetails(token0Address, event.chainId);
    if (!_t) {
      context.log.error(`Could not fetch token details for ${token0Address}`);
      return; // Must pass
    }
    token0 = {
      ..._t,
      chainId: event.chainId,
      address: token0Address,
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
    const _t = await loadTokenDetails(token1Address, event.chainId);
    if (!_t) {
      context.log.error(`Could not fetch token details for ${token1Address}`);
      return; // Must pass
    }
    token1 = {
      ..._t,
      chainId: event.chainId,
      address: token1Address,
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

  const pool: Pool = {
    id: deriveId(id, event.chainId),
    name: `Concentrated AMM - ${token0.symbol}/${token1.symbol}`,
    address: id,
    token0_id: token0.id,
    token1_id: token1.id,
    createdAtBlockNumber: BigInt(event.block.number),
    createdAtTimestamp: BigInt(event.block.timestamp),
    gaugeFees0CurrentEpoch: BD_ZERO,
    gaugeFees1CurrentEpoch: BD_ZERO,
    gaugeFeesUSD: BD_ZERO,
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
    chainId: event.chainId,
  };

  statistics = {
    ...statistics,
    totalPairsCreated: statistics.totalPairsCreated + 1n,
  };

  context.Pool.set(pool);
  context.Statistics.set(statistics);
  context.Bundle.set(bundle);
});
