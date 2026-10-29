/** Money is integer paisa, gold is integer micrograms. Never round a sale up. */
export const MICRO = 1000000n;
export function parseUnits(input: string, places: number): bigint {
  if (!/^\d+(\.\d+)?$/.test(input)) throw new Error('Enter a positive decimal value');
  const [whole, fraction = ''] = input.split('.');
  if (fraction.length > places || whole.length > 10) throw new Error('Amount precision or size exceeded');
  const value = BigInt(whole) * 10n ** BigInt(places) + BigInt(fraction.padEnd(places, '0'));
  if (value <= 0n) throw new Error('Amount must be positive');
  return value;
}
export const buyGrams = (paise: bigint, ratePaise: bigint) => paise * MICRO / ratePaise;
export const sellPaise = (micrograms: bigint, ratePaise: bigint) => micrograms * ratePaise / MICRO;
export const display = (n: bigint | string, places: number) => {
  const v = BigInt(n), b = 10n ** BigInt(places);
  return `${v / b}.${(v % b).toString().padStart(places, '0')}`;
};
export function nextDue(anchor: string | Date, count: number, interval: number) {
  const a = new Date(anchor), d = new Date(a);
  d.setUTCDate(1); d.setUTCMonth(a.getUTCMonth() + count * interval);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(a.getUTCDate(), last)); return d;
}
