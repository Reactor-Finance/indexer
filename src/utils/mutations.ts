import { BigDecimal, handlerContext, OverallDayData, Statistics } from 'generated';
import { Token_t } from 'generated/src/db/Entities.gen';
import { toHex } from 'viem';
import { BD_ZERO, BI_ZERO } from './constants';

export async function updateOverallDayData(
  context: handlerContext,
  {
    blockTimestamp,
    token0,
    token1,
    amount0Traded,
    amount1Traded,
  }: { blockTimestamp: number; token0: Token_t; token1: Token_t; amount0Traded: BigDecimal; amount1Traded: BigDecimal },
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

  const amount0TradedUSD = amount0Traded.multipliedBy(token0.derivedUSD);
  const amount1TradedUSD = amount1Traded.multipliedBy(token1.derivedUSD);
  const amount0TradedETH = amount0Traded.multipliedBy(token0.derivedETH);
  const amount1TradedETH = amount1Traded.multipliedBy(token1.derivedETH);

  overallDayData = {
    ...overallDayData,
    volumeUSD: overallDayData.volumeUSD.plus(amount0TradedUSD).plus(amount1TradedUSD),
    volumeETH: overallDayData.volumeETH.plus(amount0TradedETH).plus(amount1TradedETH),
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
