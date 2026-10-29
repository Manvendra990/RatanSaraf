export type CalculationInput = { rate: number; weight: number; makingPercent: number; discountPercent: number; diamond: number; other: number; gstPercent: number };
export function calculateJewellery(x: CalculationInput) {
  if (Object.values(x).some(v => !Number.isFinite(v) || v < 0) || x.rate <= 0 || x.weight <= 0 || x.discountPercent > 100 || x.makingPercent > 100 || x.gstPercent > 100 || x.rate > 10000000 || x.weight > 100000 || x.diamond > 100000000 || x.other > 100000000) throw new Error('Enter valid positive rate and weight; percentages must be between 0 and 100.');
  const round = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
  const gold = round(x.rate * x.weight);
  const making = round(gold * x.makingPercent / 100);
  const discount = round(making * x.discountPercent / 100);
  const subtotal = round(gold + making - discount + x.diamond + x.other);
  const gst = round(subtotal * x.gstPercent / 100);
  return { ...x, gold, making, discount, subtotal, gst, total: round(subtotal + gst) };
}
