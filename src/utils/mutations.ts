import {
  BigDecimal,
  handlerContext,
  OverallDayData,
  PoolDayData,
  PoolHourData,
  Statistics,
  TokenDayData,
} from 'generated';
import { Pool_t, Token_t } from 'generated/src/db/Entities.gen';
import { toHex } from 'viem';
import { BD_ZERO, BI_ZERO } from './constants';

export async function updateOverallDayData(
  context: handlerContext,
  {
    blockTimestamp,
    token0,
    token1,
    amount0,
    amount1,
  }: { blockTimestamp: number; token0: Token_t; token1: Token_t; amount0: BigDecimal; amount1: BigDecimal },
) {
  const dayDataId = toHex(Math.floor(blockTimestamp / 86400));
  const daystartT = parseInt(dayDataId) * 86400;
  const statistics = (await context.Statistics.get('1')) as Statistics;
  let overallDayData = await context.OverallDayData.get(dayDataId);

  if (!overallDayData) {
    overallDayData = {
      id: dayDataId,
      date: daystartT,
      volumeETH: BD_ZERO,
      volumeUSD: BD_ZERO,
      liquidityETH: BD_ZERO,
      txCount: BI_ZERO,
      liquidityUSD: BD_ZERO,
      feesUSD: BD_ZERO,
      totalTradeVolumeETH: BD_ZERO,
      totalTradeVolumeUSD: BD_ZERO,
    };
  }

  const amount0USD = amount0.multipliedBy(token0.derivedUSD);
  const amount1USD = amount1.multipliedBy(token1.derivedUSD);
  const amount0ETH = amount0.multipliedBy(token0.derivedETH);
  const amount1ETH = amount1.multipliedBy(token1.derivedETH);

  overallDayData = {
    ...overallDayData,
    volumeUSD: overallDayData.volumeUSD.plus(amount0USD).plus(amount1USD),
    volumeETH: overallDayData.volumeETH.plus(amount0ETH).plus(amount1ETH),
    liquidityUSD: statistics.totalVolumeLockedUSD,
    liquidityETH: statistics.totalVolumeLockedETH,
    txCount: overallDayData.txCount + 1n,
    feesUSD: statistics.totalFeesUSD,
    totalTradeVolumeETH: statistics.totalTradeVolumeETH,
    totalTradeVolumeUSD: statistics.totalTradeVolumeUSD,
  };

  context.OverallDayData.set(overallDayData);
  overallDayData = (await context.OverallDayData.get(dayDataId)) as OverallDayData;
  return overallDayData;
}

export async function updatePoolHourlyData(
  context: handlerContext,
  {
    pool,
    blockTimestamp,
    token0,
    token1,
    amount0,
    amount1,
  }: {
    pool: Pool_t;
    blockTimestamp: number;
    amount0: BigDecimal;
    amount1: BigDecimal;
    token0: Token_t;
    token1: Token_t;
  },
) {
  const hourDataId = toHex(Math.floor(blockTimestamp / 3600));
  const hourStart = parseInt(hourDataId) * 3600;
  const poolHourDataId = hourDataId + ':' + pool.id;
  let poolHourData = await context.PoolHourData.get(poolHourDataId);

  const amount0USD = amount0.multipliedBy(token0.derivedUSD);
  const amount1USD = amount1.multipliedBy(token1.derivedUSD);
  const amount0ETH = amount0.multipliedBy(token0.derivedETH);
  const amount1ETH = amount1.multipliedBy(token1.derivedETH);

  if (!poolHourData) {
    poolHourData = {
      id: poolHourDataId,
      reserve0: BD_ZERO,
      reserve1: BD_ZERO,
      totalSupply: BD_ZERO,
      hourStartUnix: hourStart,
      hourlyTxns: BI_ZERO,
      hourlyVolumeToken0: BD_ZERO,
      hourlyVolumeToken1: BD_ZERO,
      hourlyVolumeUSD: BD_ZERO,
      pool_id: pool.id,
      reserveUSD: BD_ZERO,
      reserveETH: BD_ZERO,
      hourlyVolumeETH: BD_ZERO,
    };
  }

  poolHourData = {
    ...poolHourData,
    reserve0: pool.reserve0,
    reserve1: pool.reserve1,
    totalSupply: pool.totalSupply,
    hourlyTxns: poolHourData.hourlyTxns + 1n,
    hourlyVolumeToken0: poolHourData.hourlyVolumeToken0.plus(amount0),
    hourlyVolumeToken1: poolHourData.hourlyVolumeToken1.plus(amount1),
    hourlyVolumeUSD: poolHourData.hourlyVolumeUSD.plus(amount0USD).plus(amount1USD),
    hourlyVolumeETH: poolHourData.hourlyVolumeETH.plus(amount0ETH).plus(amount1ETH),
    reserveUSD: pool.reserveUSD,
    reserveETH: pool.reserveETH,
  };

  context.PoolHourData.set(poolHourData);
  poolHourData = (await context.PoolHourData.get(poolHourDataId)) as PoolHourData;
  return poolHourData;
}

export async function updatePoolDayData(
  context: handlerContext,
  {
    blockTimestamp,
    token0,
    token1,
    amount0,
    amount1,
    pool,
  }: {
    blockTimestamp: number;
    pool: Pool_t;
    token0: Token_t;
    token1: Token_t;
    amount0: BigDecimal;
    amount1: BigDecimal;
  },
) {
  const dayDataId = toHex(Math.floor(blockTimestamp / 86400));
  const daystartT = parseInt(dayDataId) * 86400;
  let poolDayData = await context.PoolDayData.get(dayDataId);

  if (!poolDayData) {
    poolDayData = {
      id: dayDataId,
      date: daystartT,
      reserve0: BD_ZERO,
      reserve1: BD_ZERO,
      reserveETH: BD_ZERO,
      reserveUSD: BD_ZERO,
      dailyTxns: BI_ZERO,
      totalSupply: BD_ZERO,
      pool_id: pool.id,
      dailyVolumeETH: BD_ZERO,
      dailyVolumeToken0: BD_ZERO,
      dailyVolumeToken1: BD_ZERO,
      dailyVolumeUSD: BD_ZERO,
    };
  }

  const amount0USD = amount0.multipliedBy(token0.derivedUSD);
  const amount1USD = amount1.multipliedBy(token1.derivedUSD);
  const amount0ETH = amount0.multipliedBy(token0.derivedETH);
  const amount1ETH = amount1.multipliedBy(token1.derivedETH);

  poolDayData = {
    ...poolDayData,
    reserve0: pool.reserve0,
    reserve1: pool.reserve1,
    reserveETH: pool.reserveETH,
    reserveUSD: pool.reserveUSD,
    dailyTxns: poolDayData.dailyTxns + 1n,
    totalSupply: pool.totalSupply,
    dailyVolumeETH: poolDayData.dailyVolumeETH.plus(amount0ETH).plus(amount1ETH),
    dailyVolumeToken0: poolDayData.dailyVolumeToken0.plus(amount0),
    dailyVolumeToken1: poolDayData.dailyVolumeToken1.plus(amount1),
    dailyVolumeUSD: poolDayData.dailyVolumeUSD.plus(amount0USD).plus(amount1USD),
  };

  context.PoolDayData.set(poolDayData);
  poolDayData = (await context.PoolDayData.get(dayDataId)) as PoolDayData;
  return poolDayData;
}

export async function updateTokenDayData(
  context: handlerContext,
  {
    blockTimestamp,
    token,
    amount,
  }: {
    blockTimestamp: number;
    token: Token_t;
    amount: BigDecimal;
  },
) {
  const dayDataId = toHex(Math.floor(blockTimestamp / 86400));
  const daystartT = parseInt(dayDataId) * 86400;
  let tokenDayData = await context.TokenDayData.get(dayDataId);

  if (!tokenDayData) {
    tokenDayData = {
      id: dayDataId,
      date: daystartT,
      token_id: token.id,
      dailyVolumeToken: BD_ZERO,
      dailyVolumeETH: BD_ZERO,
      dailyTxns: BI_ZERO,
      dailyVolumeUSD: BD_ZERO,
      totalLiquidityToken: BD_ZERO,
      totalLiquidityETH: BD_ZERO,
      totalLiquidityUSD: BD_ZERO,
      priceUSD: BD_ZERO,
      priceETH: BD_ZERO,
    };
  }

  const amountUSD = amount.multipliedBy(token.derivedUSD);
  const amountETH = amount.multipliedBy(token.derivedETH);

  tokenDayData = {
    ...tokenDayData,
    dailyVolumeToken: tokenDayData.dailyVolumeToken.plus(amount),
    dailyVolumeETH: tokenDayData.dailyVolumeETH.plus(amountETH),
    dailyTxns: tokenDayData.dailyTxns + 1n,
    dailyVolumeUSD: tokenDayData.dailyVolumeUSD.plus(amountUSD),
    totalLiquidityETH: token.totalLiquidityETH,
    totalLiquidityToken: token.totalLiquidity,
    totalLiquidityUSD: token.totalLiquidityUSD,
    priceUSD: token.derivedUSD,
    priceETH: token.derivedETH,
  };

  context.TokenDayData.set(tokenDayData);
  tokenDayData = (await context.TokenDayData.get(dayDataId)) as TokenDayData;
  return tokenDayData;
}

export async function createLiquidityPosition(
  context: handlerContext,
  {
    pool,
    address,
    amount,
    blockNumber,
    txId,
  }: { pool: Pool_t; address: string; amount: BigDecimal; blockNumber: number; txId: string },
) {
  let user = await context.User.get(address);

  if (!user) {
    user = {
      id: address,
      address,
    };
    context.User.set(user);
  }

  const lpPositionId = user.id + ':' + pool.id;
  let lpPosition = await context.LiquidityPosition.get(lpPositionId);

  if (!lpPosition) {
    lpPosition = {
      id: lpPositionId,
      pool_id: pool.id,
      account_id: user.id,
      position: BD_ZERO,
      creationBlock: BigInt(blockNumber),
      creationTransaction: txId,
    };
  }

  lpPosition = { ...lpPosition, position: amount };
  context.LiquidityPosition.set(lpPosition);
}
