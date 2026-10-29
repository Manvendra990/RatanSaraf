import type { Metal, Product } from '../types';
import { demoRates } from './rates';

export const coinWeights = [0.5, 1, 10, 20, 50] as const;
const coins: Product[] = (['Gold', 'Silver'] as Metal[]).flatMap(metal =>
  coinWeights.map(weight => ({
    id: `RG-COIN-${metal.toUpperCase()}-${weight}`,
    name: `${metal} Coin ${weight}g`,
    metal, category: 'Coins', coinWeight: weight,
    price: Math.round(demoRates[metal] * weight),
    weight: `${weight} grams`,
    purity: metal === 'Gold' ? '24K (999)' : '999 Fine Silver',
    image: '',
    description: `${weight} gram ${metal.toLowerCase()} coin. Demo catalogue item; confirm purity, stock and final pricing with the store.`,
  })),
);

export const products: Product[] = [
  {
    id: 'RG-001',
    name: 'Traditional Gold Necklace',
    metal: 'Gold',
    category: 'Necklaces',
    price: 145000,
    weight: '18.5 grams',
    purity: '22K (916)',
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=900',
    description: 'Elegant traditional jewellery, crafted for special occasions.',
  },
  {
    id: 'RG-002',
    name: 'Temple Gold Necklace',
    metal: 'Gold',
    category: 'Necklaces',
    price: 192000,
    weight: '24 grams',
    purity: '22K (916)',
    image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=900',
    description: 'Statement necklace inspired by temple jewellery.',
  },
  {
    id: 'RG-003',
    name: 'Designer Gold Ring',
    metal: 'Gold',
    category: 'Rings',
    price: 38500,
    weight: '5.1 grams',
    purity: '22K (916)',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=900',
    description: 'Detailed designer ring.',
  },
  {
    id: 'RG-004',
    name: 'Gold Earrings',
    metal: 'Gold',
    category: 'Earrings',
    price: 48000,
    weight: '6.2 grams',
    purity: '22K (916)',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=900',
    description: 'Classic earrings for every occasion.',
  },
  {
    id: 'RG-005',
    name: 'Gold Bangles',
    metal: 'Gold',
    category: 'Bangles',
    price: 88000,
    weight: '12 grams',
    purity: '22K (916)',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900',
    description: 'Traditional gold bangles.',
  },
  {
    id: 'RG-006',
    name: 'Silver Ring',
    metal: 'Silver',
    category: 'Rings',
    price: 2800,
    weight: '14 grams',
    purity: '925 Sterling',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=900',
    description: 'Polished silver ring.',
  },
  {
    id: 'RG-007',
    name: 'Silver Bracelet',
    metal: 'Silver',
    category: 'Bracelets',
    price: 4300,
    weight: '28 grams',
    purity: '925 Sterling',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900',
    description: 'Refined everyday bracelet.',
  },
  {
    id: 'RG-008',
    name: 'Silver Chain',
    metal: 'Silver',
    category: 'Chains',
    price: 3600,
    weight: '22 grams',
    purity: '925 Sterling',
    image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=900',
    description: 'Minimal silver chain.',
  },
];

products.push(...coins);

export const findProduct = (id: string) => products.find(p => p.id === id);
