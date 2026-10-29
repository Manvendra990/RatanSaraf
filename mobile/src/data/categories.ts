import type { Metal } from '../types';

export const METALS: Metal[] = ['Gold', 'Silver'];

export const categories: Record<Metal, string[]> = {
  Gold: ['Necklaces', 'Earrings', 'Rings', 'Bangles', 'Chains', 'Pendants', 'Mangalsutra', 'Bracelets'],
  Silver: ['Jewellery', 'Rings', 'Bracelets', 'Anklets', 'Chains', 'Coins', 'Pooja Items', 'Gifts'],
};
