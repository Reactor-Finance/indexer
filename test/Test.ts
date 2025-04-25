import assert from 'assert';
import { TestHelpers, PairFactory_PairCreated } from 'generated';
const { MockDb, PairFactory } = TestHelpers;

describe('PairFactory contract PairCreated event tests', () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for PairFactory contract PairCreated event
  const event = PairFactory.PairCreated.createMockEvent({
    /* It mocks event fields with default values. You can overwrite them if you need */
  });

  it('PairFactory_PairCreated is created correctly', async () => {
    // Processing the event
    const mockDbUpdated = await PairFactory.PairCreated.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualPairFactoryPairCreated = mockDbUpdated.entities.PairFactory_PairCreated.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`,
    );

    // Creating the expected entity
    const expectedPairFactoryPairCreated: PairFactory_PairCreated = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      token0: event.params.token0,
      token1: event.params.token1,
      stable: event.params.stable,
      pair: event.params.pair,
      _4: event.params._4,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(
      actualPairFactoryPairCreated,
      expectedPairFactoryPairCreated,
      'Actual PairFactoryPairCreated should be the same as the expectedPairFactoryPairCreated',
    );
  });
});
