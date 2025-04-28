import { Pool } from 'generated';
import { Bundle_t, Token_t } from 'generated/src/db/Entities.gen';
import { getAddress } from 'viem';
import { divideByBase } from '../../utils/math';

Pool.Swap.handler(async ({ event, context }) => {
  const poolId = getAddress(event.srcAddress);
  const pool = await context.Pool.get(poolId);

  if (!pool) return; // Must pass

  const token0 = (await context.Token.get(pool.token0_id)) as Token_t;
  const token1 = (await context.Token.get(pool.token1_id)) as Token_t;
  const amount0In = divideByBase(event.params.amount0In, token0.decimals);
  const amount1In = divideByBase(event.params.amount1In, token1.decimals);
  const amount0Out = divideByBase(event.params.amount0Out, token0.decimals);
  const amount1Out = divideByBase(event.params.amount1Out, token1.decimals);
  const bundle = (await context.Bundle.get('1')) as Bundle_t;
  const amount0Total = amount0In.plus(amount0Out);
  const amount1Total = amount1In.plus(amount1Out);

  // Transaction
  const txId = event.transaction.hash;
  let transaction = await context.Transaction.get(txId);

  if (!transaction) {
    transaction = {
      id: txId,
      block: BigInt(event.block.number),
      timestamp: BigInt(event.block.timestamp),
    };

    context.Transaction.set(transaction);
  }
});

Pool.Mint.handler(async ({ event, context }) => {});

Pool.Sync.handler(async ({ event, context }) => {});

Pool.Burn.handler(async ({ event, context }) => {});

Pool.Fees.handler(async ({ event, context }) => {});
