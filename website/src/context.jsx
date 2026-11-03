import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, getToken, setToken } from './api';
import { CATEGORIES, DEFAULT_STORE, SAMPLE_PRODUCTS } from './data';
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
function AuthProvider({ children }) {
    const [user, setUser] = useState(null), [ready, setReady] = useState(false);
    useEffect(() => { let active = true; (async () => { if (getToken()) {
        try {
            const u = await api('/auth/me');
            if (active)
                setUser(u);
        }
        catch {
            setToken(null);
        }
    } if (active)
        setReady(true); })(); return () => { active = false; }; }, []);
    const accept = async (result) => { if (!result?.token || !result?.user)
        throw new Error('Unexpected login response.'); setToken(result.token); setUser(result.user); };
    const login = async (login, password) => accept(await api('/auth/login', 'POST', { login, password }));
    const register = async (body) => accept(await api('/auth/register', 'POST', { ...body, login: body.email }));
    const logout = async () => { try {
        await api('/auth/logout', 'POST');
    }
    catch { /* sign out locally even if the server is unavailable */ }
    finally {
        setToken(null);
        setUser(null);
    } };
    return <AuthContext.Provider value={{ user, ready, login, register, logout }}>{children}</AuthContext.Provider>;
}
const CatalogContext = createContext(null);
export const useCatalog = () => useContext(CatalogContext);
function CatalogProvider({ children }) {
    const [products, setProducts] = useState(SAMPLE_PRODUCTS), [categories, setCategories] = useState(CATEGORIES), [store, setStore] = useState(DEFAULT_STORE);
    const [loading, setLoading] = useState(true), [demo, setDemo] = useState(true), [error, setError] = useState('');
    const refresh = useCallback(async () => {
        try {
            const [catalog, info] = await Promise.all([api('/catalog'), api('/store')]);
            if (!Array.isArray(catalog.products) || !Array.isArray(catalog.categories))
                throw new Error('Unexpected catalogue response.');
            setProducts(catalog.products);
            setCategories({ Gold: catalog.categories.filter(c => c.metal === 'Gold' && c.name !== 'Coins').map(c => c.name), Silver: catalog.categories.filter(c => c.metal === 'Silver' && c.name !== 'Coins').map(c => c.name) });
            setStore({ ...DEFAULT_STORE, ...info });
            setDemo(false);
            setError('');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to load catalogue.');
            setDemo(true);
            setProducts(SAMPLE_PRODUCTS);
            setCategories(CATEGORIES);
            setStore(DEFAULT_STORE);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { void refresh(); const timer = setInterval(() => { if (document.visibilityState === 'visible')
        void refresh(); }, 60000); return () => clearInterval(timer); }, [refresh]);
    return <CatalogContext.Provider value={{ products, categories, store, loading, demo, error, refresh }}>{children}</CatalogContext.Provider>;
}
const ShopContext = createContext(null);
export const useShop = () => useContext(ShopContext);
function safeRead(key, fallback) { try {
    const x = localStorage.getItem(key);
    return x ? JSON.parse(x) : fallback;
}
catch {
    return fallback;
} }
function normalize(raw) {
    return {
        cart: Array.isArray(raw?.cart) ? raw.cart.filter((x) => typeof x?.id === 'string' && Number.isInteger(x.qty) && x.qty > 0).map((x) => ({ id: x.id, qty: Math.min(x.qty, 999) })) : [],
        favorites: Array.isArray(raw?.favorites) ? raw.favorites.filter((x) => typeof x === 'string') : []
    };
}
function ShopProvider({ children }) {
    const { user, ready } = useAuth();
    const [state, setState] = useState(() => normalize(safeRead('rls_guest_shop', { cart: [], favorites: [] })));
    const [loading, setLoading] = useState(false);
    const current = useRef(state);
    const owner = useRef(null);
    const queue = useRef(Promise.resolve());
    useEffect(() => {
        if (!ready)
            return;
        const id = user?.id || null;
        owner.current = id;
        let active = true;
        if (!id) {
            const guest = normalize(safeRead('rls_guest_shop', { cart: [], favorites: [] }));
            current.current = guest;
            setState(guest);
            setLoading(false);
            return;
        }
        setLoading(true);
        const empty = { cart: [], favorites: [] };
        current.current = empty;
        setState(empty);
        void api('/shop').then(raw => { if (active && owner.current === id) {
            const next = normalize(raw);
            current.current = next;
            setState(next);
        } }).catch(() => { }).finally(() => { if (active && owner.current === id)
            setLoading(false); });
        return () => { active = false; };
    }, [user?.id, ready]);
    const mutate = (fn) => {
        if (loading)
            return;
        const next = fn(current.current);
        current.current = next;
        setState(next);
        const uid = owner.current;
        if (uid) {
            queue.current = queue.current.catch(() => { }).then(async () => { if (uid === owner.current)
                await api('/shop', 'PUT', next); });
        }
        else
            localStorage.setItem('rls_guest_shop', JSON.stringify(next));
    };
    return <ShopContext.Provider value={{ ...state, loading, add: id => mutate(s => ({ ...s, cart: s.cart.some(x => x.id === id) ? s.cart.map(x => x.id === id ? { ...x, qty: Math.min(x.qty + 1, 999) } : x) : [...s.cart, { id, qty: 1 }] })), change: (id, delta) => mutate(s => ({ ...s, cart: s.cart.map(x => x.id === id ? { ...x, qty: Math.min(x.qty + delta, 999) } : x).filter(x => x.qty > 0) })), toggle: id => mutate(s => ({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter(x => x !== id) : [...s.favorites, id] })), clear: () => mutate(s => ({ ...s, cart: [] })) }}>{children}</ShopContext.Provider>;
}
const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);
function ToastProvider({ children }) {
    const [notice, setNotice] = useState(null);
    const id = useRef(0);
    const notify = (message, kind = 'info') => setNotice({ id: ++id.current, message, kind });
    useEffect(() => { if (!notice)
        return; const timer = setTimeout(() => setNotice(null), 4500); return () => clearTimeout(timer); }, [notice]);
    return <ToastContext.Provider value={{ notify }}>{children}{notice && <div role="status" className={`toast toast-${notice.kind}`}><span>{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notice">×</button></div>}</ToastContext.Provider>;
}
export function Providers({ children }) { return <ToastProvider><AuthProvider><CatalogProvider><ShopProvider>{children}</ShopProvider></CatalogProvider></AuthProvider></ToastProvider>; }
