import { NonfungiblePositionManager } from 'generated';
import { getAddress, zeroAddress } from 'viem';
import { deriveId } from '../../utils/misc';
import { Pool_t } from 'generated/src/db/Entities.gen';
import { createLiquidityPosition } from '../../utils/mutations';
import { BD_ZERO } from '../../utils/constants';
import { divideByBase } from '../../utils/math';

NonfungiblePositionManager.Transfer.handlerWithLoader({
  loader: async ({ event, context }) => {
    const mintTrackerId = deriveId(event.transaction.hash, event.chainId);
    const mintTracker = await context.NFPMLPMintTracker.get(mintTrackerId);
    const recipient = getAddress(event.params.to);
    const gauges = await context.Gauge.getWhere.address.eq(recipient);
    const lpPositions = await context.LiquidityPosition.getWhere.clPositionTokenId.eq(event.params.tokenId);
    const gauge = gauges.at(0);
    const existentLP = lpPositions.at(0);
    return { mintTracker, gauge, mintTrackerId, existentLP };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const recipient = getAddress(event.params.to);
    let poolId: string;
    const { mintTracker, gauge, mintTrackerId, existentLP } = loaderReturn;

    if (mintTracker) poolId = mintTracker.pool_id;
    else if (gauge) poolId = gauge.depositPool_id;
    else if (existentLP) poolId = existentLP.pool_id;
    else return;

    const pool = (await context.Pool.get(poolId)) as Pool_t;
    const isMintOrTransfer = recipient !== zeroAddress;
    const lpPositionId = deriveId(
      deriveId(recipient, event.chainId) + ':' + pool.id + ':' + event.params.tokenId,
      event.chainId,
    );

    if (isMintOrTransfer) {
      let lpPosition = await context.LiquidityPosition.get(lpPositionId);
      if (!lpPosition && !gauge)
        await createLiquidityPosition(context, {
          pool,
          amount: BD_ZERO,
          blockNumber: event.block.number,
          txId: mintTrackerId,
          clTokenId: event.params.tokenId,
          address: recipient,
          positionId: lpPositionId,
        });
      else if (lpPosition && !gauge) {
        lpPosition = { ...lpPosition, account_id: deriveId(recipient, event.chainId) };
        context.LiquidityPosition.set(lpPosition);
      }
    } else context.LiquidityPosition.deleteUnsafe(lpPositionId);

    if (mintTracker) context.NFPMLPMintTracker.deleteUnsafe(mintTracker.id);
  },
});

NonfungiblePositionManager.IncreaseLiquidity.handlerWithLoader({
  loader: async ({ event, context }) => {
    const lpPositions = await context.LiquidityPosition.getWhere.clPositionTokenId.eq(event.params.tokenId);
    return { lpPosition: lpPositions[lpPositions.length - 1] };
  },
  handler: async ({ event, context, loaderReturn }) => {
    let { lpPosition } = loaderReturn;
    const amount = divideByBase(event.params.liquidity);

    lpPosition = { ...lpPosition, position: lpPosition.position.plus(amount) };
    context.LiquidityPosition.set(lpPosition); // Update position
  },
});

NonfungiblePositionManager.DecreaseLiquidity.handlerWithLoader({
  loader: async ({ event, context }) => {
    const lpPositions = await context.LiquidityPosition.getWhere.clPositionTokenId.eq(event.params.tokenId);
    return { lpPosition: lpPositions[lpPositions.length - 1] };
  },
  handler: async ({ event, context, loaderReturn }) => {
    let { lpPosition } = loaderReturn;
    const amount = divideByBase(event.params.liquidity);
    lpPosition = { ...lpPosition, position: lpPosition.position.minus(amount) };
    context.LiquidityPosition.set(lpPosition);
  },
});
