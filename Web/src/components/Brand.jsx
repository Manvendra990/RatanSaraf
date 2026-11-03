import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
export default function Brand({ invert = false, compact = false }) {
  const { store } = useStore();
  return <Link to="/" className={`brand ${invert ? 'brand-inverse' : ''}`} aria-label={`${store.name || 'Ratan Lal Saraf'} home`}>
    <span className="brand-symbol" aria-hidden="true"><span>R</span><i>✦</i></span>
    {!compact && <span className="brand-wordmark"><strong>{store.name || 'Ratan Lal Saraf'}</strong><small>{store.descriptor || 'FINE JEWELLERY'}</small></span>}
  </Link>;
}
