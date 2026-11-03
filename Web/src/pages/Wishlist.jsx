import { useShop } from '../context/ShopContext';
import { useStore } from '../context/StoreContext';
import { EmptyState, ProductCard } from '../components/UI';
export default function Wishlist() {
  const { favorites } = useShop();
  const { products, loading } = useStore();
  const selected = products.filter(p => favorites.includes(p.id));
  return <><div className="page-heading compact-page-heading"><div className="container"><p className="eyebrow">SAVED FOR YOU</p><h1>Your <em>Wishlist</em></h1><p>Beautiful things deserve to be remembered.</p></div></div><div className="container section">{selected.length ? <div className="product-grid">{selected.map(p=><ProductCard key={p.id} product={p}/>)}</div> : loading && !products.length ? <div className="loading-state">Loading saved pieces…</div> : <EmptyState title="Nothing saved yet" message="Tap the heart on any jewellery piece to add it to your wishlist."/>}<p className="wishlist-hint">Your wishlist is saved in this browser; it does not automatically sync with other devices.</p></div></>;
}
