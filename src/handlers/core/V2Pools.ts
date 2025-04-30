import { Burn, Mint, Pool, Statistics, Swap } from 'generated';
import { Token_t } from 'generated/src/db/Entities.gen';
import { getAddress, toHex, zeroAddress } from 'viem';
import { divideByBase } from '../../utils/math';
import { loadBundlePrice, loadTokenPrices } from '../../utils/loaders';
import {
  createLiquidityPosition,
  updateOverallDayData,
  updatePoolDayData,
  updatePoolHourlyData,
  updateTokenDayData,
} from '../../utils/mutations';
import { ERC20 } from '../../utils/onchain/erc20';
import { BD_ZERO } from '../../utils/constants';

Pool.Swap.handlerWithLoader({
  loader: async ({ event, context }) => {
    const txId = event.transaction.hash;
    const swaps = await context.Swap.getWhere.transaction_id.eq(txId);
    return { swaps };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const poolId = getAddress(event.srcAddress);
    let pool = await context.Pool.get(poolId);

    if (!pool) return; // Must pass

    // Load ETH price first
    await loadBundlePrice(context, event.chainId);
    let token0 = (await context.Token.get(pool.token0_id)) as Token_t;
    let token1 = (await context.Token.get(pool.token1_id)) as Token_t;

    // Tokens
    token0 = await loadTokenPrices(context, token0, event.chainId);
    token1 = await loadTokenPrices(context, token1, event.chainId);

    const amount0In = divideByBase(event.params.amount0In, token0.decimals);
    const amount1In = divideByBase(event.params.amount1In, token1.decimals);
    const amount0Out = divideByBase(event.params.amount0Out, token0.decimals);
    const amount1Out = divideByBase(event.params.amount1Out, token1.decimals);
    const amount0Total = amount0In.plus(amount0Out);
    const amount1Total = amount1In.plus(amount1Out);
    const amount0ETH = amount0Total.multipliedBy(token0.derivedETH);
    const amount0USD = amount0Total.multipliedBy(token0.derivedUSD);
    const amount1ETH = amount1Total.multipliedBy(token1.derivedETH);
    const amount1USD = amount1Total.multipliedBy(token1.derivedUSD);

    pool = {
      ...pool,
      volumeETH: pool.volumeETH.plus(amount0ETH).plus(amount1ETH),
      volumeUSD: pool.volumeUSD.plus(amount0USD).plus(amount1USD),
      volumeToken0: pool.volumeToken0.plus(amount0Total),
      volumeToken1: pool.volumeToken1.plus(amount1Total),
      txCount: pool.txCount + 1n,
    };

    context.Pool.set(pool);

    token0 = {
      ...token0,
      tradeVolume: amount0Total.plus(token0.tradeVolume),
      tradeVolumeUSD: amount0USD.plus(token0.tradeVolumeUSD),
      txCount: token0.txCount + 1n,
    };

    context.Token.set(token0);

    token1 = {
      ...token1,
      tradeVolume: amount1Total.plus(token1.tradeVolume),
      tradeVolumeUSD: amount1USD.plus(token1.tradeVolumeUSD),
      txCount: token1.txCount + 1n,
    };

    context.Token.set(token1);
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

    const { swaps } = loaderReturn;
    const swapId = txId + ':' + toHex(swaps.length);
    const swap: Swap = {
      id: swapId,
      transaction_id: transaction.id,
      timestamp: BigInt(event.block.timestamp),
      pool_id: pool.id,
      sender: event.params.sender,
      from: event.transaction.from ? event.transaction.from : event.params.sender,
      to: event.params.to,
      amount0In,
      amount1In,
      amount0Out,
      amount1Out,
      amountUSD: amount0USD.plus(amount1USD),
      logIndex: BigInt(event.logIndex),
    };

    context.Swap.set(swap);

    let statistics = (await context.Statistics.get('1')) as Statistics;
    statistics = {
      ...statistics,
      txCount: statistics.txCount + 1n,
      totalTradeVolumeUSD: statistics.totalTradeVolumeUSD.plus(pool.volumeUSD),
      totalTradeVolumeETH: statistics.totalTradeVolumeETH.plus(pool.volumeETH),
    };

    context.Statistics.set(statistics);

    // Update total data
    updateOverallDayData(context, {
      blockTimestamp: event.block.timestamp,
      token0,
      token1,
      amount0: amount0Total,
      amount1: amount1Total,
    });

    // Update pool hourly data
    updatePoolHourlyData(context, {
      pool,
      blockTimestamp: event.block.timestamp,
      amount0: amount0Total,
      amount1: amount1Total,
      token0,
      token1,
    });

    // Update pool day data
    updatePoolDayData(context, {
      blockTimestamp: event.block.timestamp,
      pool,
      token0,
      token1,
      amount0: amount0Total,
      amount1: amount1Total,
    });

    // Update token day data
    updateTokenDayData(context, { blockTimestamp: event.block.timestamp, token: token0, amount: amount0Total });
    updateTokenDayData(context, { blockTimestamp: event.block.timestamp, token: token1, amount: amount1Total });
  },
});

Pool.Mint.handlerWithLoader({
  loader: async ({ event, context }) => {
    const txId = event.transaction.hash;
    const mints = await context.Mint.getWhere.transaction_id.eq(txId);
    return { mints };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const poolId = getAddress(event.srcAddress);
    let pool = await context.Pool.get(poolId);
    let statistics = await context.Statistics.get('1');

    if (!pool || !statistics) return; // Must pass

    // Load ETH price first
    await loadBundlePrice(context, event.chainId);
    let token0 = (await context.Token.get(pool.token0_id)) as Token_t;
    let token1 = (await context.Token.get(pool.token1_id)) as Token_t;

    // Tokens
    token0 = await loadTokenPrices(context, token0, event.chainId);
    token1 = await loadTokenPrices(context, token1, event.chainId);

    // Amounts
    const amount0 = divideByBase(event.params.amount0, token0.decimals);
    const amount1 = divideByBase(event.params.amount1, token1.decimals);
    const amount0USD = amount0.multipliedBy(token0.derivedUSD);
    const amount1USD = amount1.multipliedBy(token1.derivedUSD);

    token0 = { ...token0, txCount: token0.txCount + 1n };
    context.Token.set(token0);

    token1 = { ...token1, txCount: token1.txCount + 1n };
    context.Token.set(token1);

    statistics = { ...statistics, txCount: statistics.txCount + 1n };
    context.Statistics.set(statistics);

    pool = { ...pool, txCount: pool.txCount + 1n };
    context.Pool.set(pool);

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

    const { mints } = loaderReturn;
    let mint = mints[mints.length - 1];
    mint = {
      ...mint,
      amount0,
      amount1,
      sender: event.params.sender,
      amountUSD: amount0USD.plus(amount1USD),
      logIndex: BigInt(event.logIndex),
    };

    context.Mint.set(mint);

    // Update total data
    updateOverallDayData(context, {
      blockTimestamp: event.block.timestamp,
      token0,
      token1,
      amount0,
      amount1,
    });

    // Update pool hourly data
    updatePoolHourlyData(context, {
      pool,
      blockTimestamp: event.block.timestamp,
      amount0,
      amount1,
      token0,
      token1,
    });

    // Update pool day data
    updatePoolDayData(context, {
      blockTimestamp: event.block.timestamp,
      pool,
      token0,
      token1,
      amount0,
      amount1,
    });

    // Update token day data
    updateTokenDayData(context, { blockTimestamp: event.block.timestamp, token: token0, amount: amount0 });
    updateTokenDayData(context, { blockTimestamp: event.block.timestamp, token: token1, amount: amount1 });
  },
});

Pool.Sync.handler(async ({ event, context }) => {});

Pool.Burn.handler(async ({ event, context }) => {});

Pool.Fees.handler(async ({ event, context }) => {});

Pool.Transfer.handlerWithLoader({
  loader: async ({ event, context }) => {
    const txId = event.transaction.hash;
    const mints = await context.Mint.getWhere.transaction_id.eq(txId);
    const burns = await context.Burn.getWhere.transaction_id.eq(txId);
    return { mints, burns };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const poolId = getAddress(event.srcAddress);
    let pool = await context.Pool.get(poolId);

    if (!pool) return;

    const poolContract = ERC20.init(event.chainId, poolId);
    const value = divideByBase(event.params.value, 18);
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

    const mutablePool = { ...pool };
    const { mints, burns } = loaderReturn;
    const isMint = event.params.from === zeroAddress;
    const isBurn = event.params.to === zeroAddress;

    if (isMint) {
      mutablePool.totalSupply = mutablePool.totalSupply.plus(value);
      context.Pool.set(mutablePool);

      if (mints.length === 0 || !!mints[mints.length - 1].sender) {
        const mintId = txId + ':' + toHex(mints.length);
        const mint: Mint = {
          id: mintId,
          transaction_id: transaction.id,
          pool_id: pool.id,
          to: event.params.to,
          liquidity: value,
          timestamp: transaction.timestamp,
          amount0: undefined,
          amount1: undefined,
          sender: undefined,
          amountUSD: undefined,
          feeLiquidity: undefined,
          feeTo: undefined,
          logIndex: undefined,
        };

        context.Mint.set(mint);
        mints.push(mint);
      }
    }

    if (getAddress(event.params.to) === poolId) {
      const burnId = txId + ':' + toHex(burns.length);
      const burn: Burn = {
        id: burnId,
        transaction_id: transaction.id,
        pool_id: pool.id,
        liquidity: value,
        timestamp: transaction.timestamp,
        sender: event.params.from,
        to: event.params.to,
        needsComplete: true,
        amount0: undefined,
        amount1: undefined,
        amountUSD: undefined,
        feeLiquidity: undefined,
        feeTo: undefined,
        logIndex: undefined,
      };

      context.Burn.set(burn);
      burns.push(burn);
    }

    if (isBurn && getAddress(event.params.from) === poolId) {
      mutablePool.totalSupply = mutablePool.totalSupply.minus(value);
      context.Pool.set(mutablePool);

      let burn: Burn;

      if (burns.length) {
        const currentBurn = burns[burns.length];
        if (currentBurn.needsComplete) burn = currentBurn;
        else {
          const burnId = txId + ':' + toHex(burns.length);
          burn = {
            id: burnId,
            transaction_id: transaction.id,
            needsComplete: false,
            pool_id: pool.id,
            liquidity: value,
            timestamp: transaction.timestamp,
            amount0: undefined,
            amount1: undefined,
            amountUSD: undefined,
            feeLiquidity: undefined,
            feeTo: undefined,
            logIndex: undefined,
            sender: undefined,
            to: undefined,
          };
        }
      } else {
        const burnId = txId + ':' + toHex(burns.length);
        burn = {
          id: burnId,
          transaction_id: transaction.id,
          needsComplete: false,
          pool_id: pool.id,
          liquidity: value,
          timestamp: transaction.timestamp,
          amount0: undefined,
          amount1: undefined,
          amountUSD: undefined,
          feeLiquidity: undefined,
          feeTo: undefined,
          logIndex: undefined,
          sender: undefined,
          to: undefined,
        };
      }

      if (mints.length && !mints[mints.length - 1].sender) {
        const mint = mints[mints.length - 1];
        burn = { ...burn, feeTo: mint.to, feeLiquidity: mint.liquidity };
        mints.pop();
      }

      context.Burn.set(burn);
    }

    if (!isMint && getAddress(event.params.from) !== poolId) {
      const address = getAddress(event.params.from);
      const balance = await poolContract.balanceOf(address);
      const amount = balance ? divideByBase(balance) : BD_ZERO;
      createLiquidityPosition(context, { address, pool, amount, blockNumber: event.block.number, txId });
    }

    if (!isBurn && getAddress(event.params.to) !== poolId) {
      const address = getAddress(event.params.to);
      const balance = await poolContract.balanceOf(address);
      const amount = balance ? divideByBase(balance) : BD_ZERO;
      createLiquidityPosition(context, { address, pool, amount, blockNumber: event.block.number, txId });
    }
  },
});
