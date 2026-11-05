export const coinCategory = category => category?.name === 'Coins';
export const coinProduct = row => row?.category === 'Coins' || Number(row?.coinWeight) > 0;
export function ledgerTotals(rows) {
  let bought = 0n, sold = 0n, buyAmount = 0n, sellAmount = 0n;
  for (const row of rows) {
    const grams = BigInt(row.grams || 0), amount = BigInt(row.amountPaise || 0);
    if (row.kind === 'BUY') { bought += grams < 0n ? -grams : grams; buyAmount += amount; }
    if (row.kind === 'SELL') { sold += grams < 0n ? -grams : grams; sellAmount += amount; }
  }
  return { bought, sold, net: bought - sold, buyAmount, sellAmount };
}
export function fixedUnits(value, scale) {
  const negative = value < 0n; const n = negative ? -value : value;
  const divisor = 10n ** BigInt(scale);
  return `${negative ? '-' : ''}${(n / divisor).toLocaleString('en-IN')}.${(n % divisor).toString().padStart(scale, '0')}`;
}
