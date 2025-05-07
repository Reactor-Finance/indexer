import { BigDecimal } from 'generated';

export function divideByBase(a: bigint | BigDecimal, base: number = 18) {
  if (typeof a === 'bigint') {
    a = new BigDecimal(a.toString());
  }
  return a.dividedBy(10 ** base);
}
