import { createContext, useContext, useEffect, useState } from 'react';

const ShopContext = createContext(null);
function restored(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
}
export function ShopProvider({ children }) {
  // The uploaded source omitted mobile ShopContext. Cart/wishlist are browser-local,
  // never claimed to sync to the backend across devices.
  const [cart, setCart] = useState(() => restored('ratan_web_cart_v1', []));
  const [favorites, setFavorites] = useState(() => restored('ratan_web_favs_v1', []));
  useEffect(() => localStorage.setItem('ratan_web_cart_v1', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('ratan_web_favs_v1', JSON.stringify(favorites)), [favorites]);
  const add = (id) => setCart(lines => lines.some(x => x.id === id) ? lines.map(x => x.id === id ? { ...x, qty: Math.min(x.qty + 1, 99) } : x) : [...lines, { id, qty: 1 }]);
  const change = (id, delta) => setCart(lines => lines.map(x => x.id === id ? { ...x, qty: Math.max(0, Math.min(x.qty + delta, 99)) } : x).filter(x => x.qty));
  const remove = (id) => setCart(lines => lines.filter(x => x.id !== id));
  const toggle = (id) => setFavorites(items => items.includes(id) ? items.filter(x => x !== id) : [...items, id]);
  return <ShopContext.Provider value={{ cart, favorites, add, change, remove, toggle, cartCount: cart.reduce((t, p) => t + p.qty, 0) }}>{children}</ShopContext.Provider>;
}
export const useShop = () => useContext(ShopContext);
