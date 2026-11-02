export type Metal = 'Gold' | 'Silver';

export type Product = {
  id: string;
  name: string;
  metal: Metal;
  category: string;
  price?: number;
  productCode?: string;
  brand?: string;
  colour?: string;
  availability?: string;
  certifiedBy?: string;
  featured?: boolean;
  weight: string;
  purity: string;
  image: string;
  description: string;
  coinWeight?: number;
  stock?: number;
};

export type CartLine = { id: string; qty: number };

export type RatePoint = { label: string; value: number };
