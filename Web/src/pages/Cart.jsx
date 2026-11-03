import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useStore } from '../context/StoreContext';
import { EmptyState, ProductArt, QtyControl, useEnquiry } from '../components/UI';
import { inr, isCoin } from '../utils/format';
export default function Cart() {
  const { cart, change, remove } = useShop();
  const { products, loading } = useStore();
  const enquire = useEnquiry();
  const lines = cart.map(line=>({ ...line, product:products.find(p=>p.id===line.id) })).filter(x=>x.product);
  const total = lines.reduce((s,x)=>s+(isCoin(x.product) ? Number(x.product.price || 0)*x.qty : 0),0);
  const allCoins = lines.length > 0 && lines.every(x => isCoin(x.product));
  return <><div className="page-heading compact-page-heading"><div className="container"><p className="eyebrow">YOUR SELECTION</p><h1>Your Shopping <em>Bag</em></h1></div></div><div className="container cart-layout">{lines.length ? <><div className="cart-items">{lines.map(({product:p,qty})=><article className="cart-line" key={p.id}><Link to={`/product/${encodeURIComponent(p.id)}`}><ProductArt product={p}/></Link><div className="cart-line-info"><Link to={`/product/${encodeURIComponent(p.id)}`}><h3>{p.name}</h3></Link><p>{[p.purity,p.weight].filter(Boolean).join(' · ')}</p><strong>{isCoin(p) ? inr(p.price || 0) : 'Price on enquiry'}</strong><QtyControl qty={qty} minus={()=>change(p.id,-1)} plus={()=>change(p.id,1)}/></div><button className="cart-delete" aria-label={`Remove ${p.name}`} onClick={()=>remove(p.id)}><Trash2 size={19}/></button></article>)}</div><aside className="cart-summary"><h3>Enquiry Summary</h3><div className="cart-summary-line"><span>Products</span><strong>{lines.reduce((s,x)=>s+x.qty,0)}</strong></div><div className="cart-summary-line"><span>Estimated coin subtotal</span><strong>{allCoins ? inr(total) : 'On enquiry'}</strong></div><p>Taxes, making charges, stock and final prices must be confirmed with the store.</p><button className="btn btn-whatsapp full-width" onClick={()=>enquire(lines.map(x=>x.product),Object.fromEntries(lines.map(x=>[x.product.id,x.qty])))}>Enquire on WhatsApp <ArrowRight size={18}/></button><Link className="continue-shopping" to="/collection">Continue exploring <ArrowRight size={16}/></Link></aside></> : loading && !products.length ? <div className="loading-state">Loading your bag…</div> : <EmptyState title="Your bag is waiting" message="Add a piece you love, and we’ll keep it here for you."/>}</div></>;
}
