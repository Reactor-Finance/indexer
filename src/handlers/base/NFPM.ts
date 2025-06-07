import { NonfungiblePositionManager } from 'generated';
import { getAddress, zeroAddress } from 'viem';
import { deriveId } from '../../utils/misc';
import { NFPMLPChangeTracker_t, Pool_t, User_t } from 'generated/src/db/Entities.gen';
import { createLiquidityPosition } from '../../utils/mutations';
import { BD_ZERO } from '../../utils/constants';
import { divideByBase } from '../../utils/math';

NonfungiblePositionManager.Transfer.handler(async ({ event, context }) => {
  const from = getAddress(event.params.from);
  const recipient = getAddress(event.params.to);
  const trackedTxId = deriveId(event.transaction.hash, event.chainId);
  const _tracker = (await context.NFPMLPChangeTracker.get(trackedTxId)) as NFPMLPChangeTracker_t;
  const pool = (await context.Pool.get(_tracker.pool_id)) as Pool_t;
  const isMintOrTransfer = recipient !== zeroAddress;

  if (isMintOrTransfer) {
    const lpPositionId = deriveId(
      deriveId(recipient, event.chainId) + ':' + pool.id + ':' + event.params.tokenId,
      event.chainId,
    );
    const lpPosition = await context.LiquidityPosition.get(lpPositionId);
    if (!lpPosition)
      await createLiquidityPosition(context, {
        pool,
        amount: BD_ZERO,
        blockNumber: event.block.number,
        txId: trackedTxId,
        clTokenId: event.params.tokenId,
        address: recipient,
        positionId: lpPositionId,
      });
  }

  // Clear position for sender
  await createLiquidityPosition(context, {
    pool,
    amount: BD_ZERO,
    blockNumber: event.block.number,
    txId: trackedTxId,
    clTokenId: undefined,
    address: from,
  });
});

NonfungiblePositionManager.IncreaseLiquidity.handlerWithLoader({
  loader: async ({ event, context }) => {
    const lpPositions = await context.LiquidityPosition.getWhere.clPositionTokenId.eq(event.params.tokenId);
    return { lpPosition: lpPositions[lpPositions.length - 1] };
  },
  handler: async ({ event, context, loaderReturn }) => {
    let { lpPosition } = loaderReturn;
    const amount = divideByBase(event.params.liquidity);
    const trackedTxId = deriveId(event.transaction.hash, event.chainId);

    lpPosition = { ...lpPosition, position: lpPosition.position.plus(amount) };
    context.LiquidityPosition.set(lpPosition); // Update position
    context.NFPMLPChangeTracker.deleteUnsafe(trackedTxId); // Delete at this point
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
