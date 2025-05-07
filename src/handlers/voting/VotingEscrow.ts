import { VotingEscrow } from 'generated';
import { deriveId } from '../../utils/misc';
import { getAddress, zeroAddress } from 'viem';
import { BD_ZERO, BI_ZERO } from '../../utils/constants';
import { LockPosition_t } from 'generated/src/db/Entities.gen';
import { divideByBase } from '../../utils/math';

VotingEscrow.Transfer.handler(async ({ event, context }) => {
  const recipient = getAddress(event.params.to);
  const tokenId = event.params.tokenId;

  const _lockId = deriveId(tokenId.toString(), event.chainId);
  const _recipientId = deriveId(recipient, event.chainId);

  let lock = await context.LockPosition.get(_lockId);
  let rUser = await context.User.get(_recipientId);

  if (!rUser) {
    rUser = {
      id: _recipientId,
      address: recipient,
    };

    context.User.set(rUser);
  }

  if (!lock) {
    lock = {
      id: _lockId,
      lockId: tokenId,
      lockType: 'NORMAL',
      freeRewardManager: undefined,
      lockRewardManager: undefined,
      owner_id: zeroAddress,
      chainId: event.chainId,
      permanent: false,
      creationTransaction: event.transaction.hash,
      creationBlock: BigInt(event.block.number),
      position: BD_ZERO,
      unlockTime: BI_ZERO,
    };
  }

  lock = { ...lock, owner_id: rUser.id };
  context.LockPosition.set(lock);
});

VotingEscrow.Deposit.handlerWithLoader({
  loader: async ({ event, context }) => {
    const lockId = deriveId(event.params.tokenId.toString(), event.chainId);
    const lock = (await context.LockPosition.get(lockId)) as LockPosition_t;
    return { lock };
  },
  handler: async ({ event, context, loaderReturn }) => {
    let { lock } = loaderReturn;
    const amount = divideByBase(event.params.value);
    lock = { ...lock, position: lock.position.plus(amount), unlockTime: event.params.locktime };
    context.LockPosition.set(lock);
  },
});

VotingEscrow.DepositManaged.handlerWithLoader({
  loader: async ({ event, context }) => {
    const lockId = deriveId(event.params._tokenId.toString(), event.chainId);
    const mLockId = deriveId(event.params._mTokenId.toString(), event.chainId);
    const lock = (await context.LockPosition.get(lockId)) as LockPosition_t;
    const mLock = (await context.LockPosition.get(mLockId)) as LockPosition_t;
    return { lock, mLock };
  },
  handler: async ({ event, context, loaderReturn }) => {
    let { lock, mLock } = loaderReturn;
    const amount = divideByBase(event.params._weight);
    lock = { ...lock, position: lock.position.minus(amount) };
    mLock = { ...mLock, position: lock.position.plus(amount) };
    context.LockPosition.set(lock);
    context.LockPosition.set(mLock);
  },
});

VotingEscrow.CreateManaged.handlerWithLoader({
  loader: async ({ event, context }) => {
    const lockId = deriveId(event.params._mTokenId.toString(), event.chainId);
    const lock = (await context.LockPosition.get(lockId)) as LockPosition_t;
    return { lock };
  },
  handler: async ({ event, context, loaderReturn }) => {
    let { lock } = loaderReturn;
    const freeRewardManager = getAddress(event.params._freeManagedReward);
    const lockRewardManager = getAddress(event.params._lockedManagedReward);
    lock = { ...lock, freeRewardManager, lockRewardManager, lockType: 'MANAGED' };
    context.LockPosition.set(lock);
  },
});
