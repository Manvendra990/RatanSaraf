import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getCatalog, getHome, getStore, getStoreRates } from '../api/client';
import { normalizeCategories } from '../utils/format';

const StoreContext = createContext(null);
export function StoreProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [store, setStore] = useState({ name: 'Ratan Lal Saraf', descriptor: 'FINE JEWELLERY' });
  const [home, setHome] = useState(null);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratesError, setRatesError] = useState('');
  const latest = useRef(0);

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    const current = ++latest.current;
    if (!quiet) setLoading(true);
    const results = await Promise.allSettled([getCatalog(), getStore(), getHome(), getStoreRates()]);
    if (current !== latest.current) return;
    const [catalogResult, storeResult, homeResult, ratesResult] = results;
    if (catalogResult.status === 'fulfilled' && Array.isArray(catalogResult.value?.products)) {
      setProducts(catalogResult.value.products);
      setCategories(normalizeCategories(catalogResult.value.categories));
      setError('');
    } else {
      setError(catalogResult.status === 'rejected' ? catalogResult.reason.message : 'Invalid catalog data received from backend.');
    }
    if (storeResult.status === 'fulfilled' && storeResult.value && typeof storeResult.value === 'object')
      setStore(previous => ({ ...previous, ...storeResult.value }));
    if (homeResult.status === 'fulfilled') setHome(homeResult.value);
    if (ratesResult.status === 'fulfilled' && Array.isArray(ratesResult.value)) {
      setRates(ratesResult.value);
      setRatesError('');
    } else {
      setRatesError(ratesResult.status === 'rejected' ? ratesResult.reason.message : 'Store rates are currently unavailable.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => { if (!document.hidden) refresh({ quiet: true }); }, 15000);
    const onFocus = () => refresh({ quiet: true });
    window.addEventListener('focus', onFocus);
    const onVisibility = () => { if (!document.hidden) refresh({ quiet: true }); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { latest.current++; clearInterval(timer); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVisibility); };
  }, [refresh]);

  const getRate = (metal) => rates.find(rate => rate?.metal === metal);
  return <StoreContext.Provider value={{ products, categories, store, home, rates, getRate, loading, error, ratesError, refresh }}>{children}</StoreContext.Provider>;
}
export const useStore = () => useContext(StoreContext);
