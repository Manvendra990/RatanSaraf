import { demoRates } from '../data/rates';
import type { Metal, RatePoint } from '../types';

// Demo only. Replace with a licensed metal-pricing API and server-side caching.
export const getDemoRate = (metal: Metal) => ({
  value: demoRates[metal],
  unit: 'gram',
  isLive: false,
});

export const getDemoHistory = (metal: Metal): RatePoint[] =>
  Array.from({ length: 18 }, (_, i) => ({
    label: String(i + 1),
    value: demoRates[metal] * (0.94 + i * 0.003 + Math.sin(i * 1.8) * 0.004),
  }));
