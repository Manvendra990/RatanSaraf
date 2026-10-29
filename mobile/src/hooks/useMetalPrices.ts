import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getMetalPrices, messageOf, peekMetalPrices, type MetalPrices } from '../services/metalPrices';

export function useMetalPrices() {
  const focused = useIsFocused();
  const mounted = useRef(false);
  const busy = useRef(false);
  const [data, setData] = useState<MetalPrices | null>(peekMetalPrices);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    if (mounted.current) setLoading(true);
    try {
      const result = await getMetalPrices();
      if (mounted.current) { setData(result); setError(null); }
    } catch (e) { if (mounted.current) setError(messageOf(e)); }
    finally { busy.current = false; if (mounted.current) { setLoading(false); setNow(Date.now()); } }
  }, []);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!focused) return;
    if (AppState.currentState === 'active') void refresh();
    const timer = setInterval(() => { setNow(Date.now()); if (AppState.currentState === 'active') void refresh(); }, 60000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, [focused, refresh]);
  return { data, loading, error, refresh, stale: !!data && now - Date.parse(data.timestamp) > 5 * 60000 };
}
