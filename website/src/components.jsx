import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Calculator, ChevronDown, ChevronRight, Facebook, Heart, Instagram, MapPin, Menu, Search, ShieldCheck, ShoppingBag, UserRound, X, Gem, Sparkles, Coins, TrendingUp, Store as StoreIcon } from 'lucide-react';
import logo from './assets/logo-gold.png';
import { useAuth, useCatalog, useShop, useToast } from './context';
import { directions, inr, storeAddress } from './data';
export function Logo({ compact = false }) { return <Link to="/" className={`brand ${compact ? 'brand-compact' : ''}`} aria-label="Ratan Lal Saraf home"><img src={logo} alt="Ratan Lal Saraf golden emblem"/><span className="brand-copy"><strong>RATAN LAL SARAF</strong><small>J E W E L L E R S</small></span></Link>; }
export function SiteHeader() {
    const { user } = useAuth(), { cart, favorites } = useShop(), { store, demo } = useCatalog(), [open, setOpen] = useState(false), [searchOpen, setSearchOpen] = useState(false), [term, setTerm] = useState('');
    const nav = useNavigate(), location = useLocation();
    React.useEffect(() => { setOpen(false); setSearchOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname, location.search]);
    function goSearch(e) { e.preventDefault(); if (term.trim())
        nav(`/shop?q=${encodeURIComponent(term.trim())}`); setSearchOpen(false); setTerm(''); }
    return <>
   <div className="topbar"><div className="container topbar-inner"><span><Sparkles size={12}/> TIMELESS BEAUTY FOR YOUR SPECIAL MOMENTS</span><span><MapPin size={13}/> {store.addressLine1}, {store.city} <i className="topbar-divider"/> <Link to="/store">Visit Our Store <ArrowUpRight size={12}/></Link></span></div></div>
   <header className="header"><div className="container header-inner">
      <button className="icon-button menu-toggle" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={23}/></button>
      <Logo />
      <nav className="desktop-nav" aria-label="Main navigation"><NavLink end to="/">Home</NavLink><NavLink to="/shop?metal=Gold">Gold Jewellery</NavLink><NavLink to="/shop?metal=Silver">Silver Jewellery</NavLink><div className="nav-dropdown"><span>Collections <ChevronDown size={13}/></span><div className="dropdown-panel"><Link to="/shop">All Jewellery</Link><Link to="/coins/Gold">Gold Coins</Link><Link to="/coins/Silver">Silver Coins</Link><Link to="/shop?category=Rings">Rings</Link><Link to="/shop?category=Necklaces">Necklaces</Link></div></div><NavLink to="/sip">Gold SIP</NavLink><NavLink to="/calculator">Rate Calculator</NavLink></nav>
      <div className="header-actions"><button className="icon-button search-toggle" aria-label="Search products" onClick={() => setSearchOpen(v => !v)}><Search size={20}/></button><Link className="icon-button profile-icon" aria-label={user ? 'My account' : 'Login'} to={user ? '/profile' : '/login'}><UserRound size={20}/></Link><Link className="icon-button hide-small" aria-label="Wishlist" to="/wishlist"><Heart size={20}/>{favorites.length > 0 && <em>{favorites.length}</em>}</Link><Link className="icon-button" aria-label="Shopping bag" to="/cart"><ShoppingBag size={20}/>{cart.length > 0 && <em>{cart.reduce((n, x) => n + x.qty, 0)}</em>}</Link></div>
    </div>{searchOpen && <form className="search-overlay container" onSubmit={goSearch}><Search size={18}/><input autoFocus placeholder="Search rings, necklaces, coins..." value={term} onChange={e => setTerm(e.target.value)}/><button className="button button-dark">Search</button></form>}</header>
    {demo && <div className="demo-strip"><span>Preview catalogue — sample products and prices only.</span><Link to="/store">Contact the store for availability <ArrowRight size={13}/></Link></div>}
    <div className={`mobile-overlay ${open ? 'visible' : ''}`} onClick={() => setOpen(false)}></div><aside className={`mobile-drawer ${open ? 'open' : ''}`} aria-label="Mobile menu"><div className="drawer-head"><Logo compact/><button className="icon-button" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button></div><nav>
     {[['Home', '/'], ['Shop All Jewellery', '/shop'], ['Gold Jewellery', '/shop?metal=Gold'], ['Silver Jewellery', '/shop?metal=Silver'], ['Gold Coins', '/coins/Gold'], ['Silver Coins', '/coins/Silver'], ['Gold SIP Yojana', '/sip'], ['Metal Rates', '/rates'], ['Rate Calculator', '/calculator'], ['Wishlist', '/wishlist'], ['My Account', user ? '/profile' : '/login'], ['Visit Our Store', '/store']].map(([label, path]) => <Link onClick={() => setOpen(false)} key={label} to={path}>{label}<ChevronRight size={17}/></Link>)}
     </nav><div className="drawer-bottom"><MapPin size={16}/> {storeAddress(store)}</div></aside>
  </>;
}
export function SiteFooter() { const { store } = useCatalog(); return <footer className="footer"><div className="container"><div className="footer-grid"><div className="footer-about"><Logo /><p>A celebration of timeless design, meaningful moments, and jewellery made to be treasured.</p><div className="footer-social"><span aria-label="Instagram icon"><Instagram size={18}/></span><span aria-label="Facebook icon"><Facebook size={18}/></span></div></div><div><h4>Explore</h4><Link to="/shop?metal=Gold">Gold Jewellery</Link><Link to="/shop?metal=Silver">Silver Jewellery</Link><Link to="/coins/Gold">Gold Coins</Link><Link to="/coins/Silver">Silver Coins</Link></div><div><h4>Useful Links</h4><Link to="/sip">Gold SIP Yojana</Link><Link to="/calculator">Rate Calculator</Link><Link to="/rates">Metal Rates</Link><Link to="/wishlist">My Wishlist</Link></div><div><h4>Visit the Showroom</h4><p className="footer-address"><MapPin size={17}/>{storeAddress(store)}</p><a href={directions(store)} target="_blank" rel="noopener noreferrer" className="footer-directions">Get directions <ArrowUpRight size={15}/></a>{store.phone && <a href={`tel:${store.phone}`}>{store.phone}</a>}</div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {store.name}. All rights reserved.</span><span>Indicative prices only. Final pricing and availability confirmed at the store.</span></div></div></footer>; }
export function Shell({ children }) { return <><SiteHeader /><main id="main">{children}</main><SiteFooter /></>; }
export function SectionTitle({ eyebrow, title, description, center = false }) { return <div className={`section-title ${center ? 'centered' : ''}`}><span className="eyebrow"><span className="eyebrow-line"/>{eyebrow}<span className="eyebrow-line"/></span><h2>{title}</h2>{description && <p>{description}</p>}</div>; }
export function PageBanner({ eyebrow, title, subtitle }) { return <section className="page-banner"><div className="container"><span className="eyebrow light">{eyebrow}</span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div></section>; }
export function Breadcrumb({ items }) { return <nav aria-label="Breadcrumb" className="breadcrumbs"><Link to="/">Home</Link>{items.map((item, i) => <React.Fragment key={i}><ChevronRight size={13}/>{item.href ? <Link to={item.href}>{item.label}</Link> : <span>{item.label}</span>}</React.Fragment>)}</nav>; }
export function ProductImage({ product, className = '' }) {
    const [failed, setFailed] = useState(false);
    const gold = product.metal === 'Gold';
    return <div className={`product-image ${className}`}>
  {product.image && !failed ? <img loading="lazy" src={product.image} alt={product.name} onError={() => setFailed(true)}/> : product.category === 'Coins' ? <div className={`coin-illustration ${gold ? 'coin-gold' : 'coin-silver'}`}><div className="coin-inner"><span>{product.metal.toUpperCase()}</span><strong>{product.coinWeight}g</strong><small>999 • SAMPLE</small></div></div> : <JewelleryIllustration kind={product.category} metal={product.metal}/>}
    </div>;
}
export function JewelleryIllustration({ kind = 'Necklaces', metal = 'Gold' }) {
    const silver = metal === 'Silver';
    return <div className={`jewel-illustration ${silver ? 'is-silver' : ''}`} aria-label={`${metal} ${kind} illustration`}>
  <svg viewBox="0 0 280 280" role="img" aria-label={`${kind} artwork`}><defs><linearGradient id="jewelGold" x1="0" x2="1" y1="0" y2="1"><stop stopColor={silver ? '#f2f4f5' : '#fdf2c2'}/><stop offset=".4" stopColor={silver ? '#a4abb4' : '#d4a43b'}/><stop offset="1" stopColor={silver ? '#dde0e4' : '#8a5e12'}/></linearGradient></defs>
  {kind === 'Rings' ? <><ellipse cx="140" cy="168" rx="65" ry="70" fill="none" stroke="url(#jewelGold)" strokeWidth="22"/><path d="M123 96 L140 70 L157 96 L149 113 L131 113 Z" fill="url(#jewelGold)" stroke="#ad7926" strokeWidth="3"/><path d="M126 89 L140 77 L154 89 L140 108 Z" fill={silver ? '#d9e6ee' : '#fef7d6'}/></> : kind === 'Earrings' ? <>{[92, 188].map(x => <g key={x}><circle cx={x} cy="90" r="13" fill="url(#jewelGold)"/><path d={`M${x} 105 Q${x - 45} 164 ${x} 218 Q${x + 45} 164 ${x} 105Z`} fill="none" stroke="url(#jewelGold)" strokeWidth="15"/><circle cx={x} cy="186" r="14" fill="url(#jewelGold)"/></g>)}</> : kind === 'Bangles' || kind === 'Bracelets' ? <><ellipse cx="125" cy="156" rx="75" ry="49" transform="rotate(-19 125 156)" fill="none" stroke="url(#jewelGold)" strokeWidth="20"/><ellipse cx="157" cy="140" rx="75" ry="49" transform="rotate(17 157 140)" fill="none" stroke="url(#jewelGold)" strokeWidth="17"/></> : <><path d="M51 84 Q58 201 140 212 Q220 198 229 84" fill="none" stroke="url(#jewelGold)" strokeWidth="13" strokeLinecap="round"/><path d="M73 105 Q85 171 140 187 Q197 173 209 105" fill="none" stroke="url(#jewelGold)" strokeWidth="8"/>{[79, 102, 124, 145, 167, 188, 209].map((x, i) => <circle key={i} cx={x} cy={152 + (3 - Math.abs(i - 3)) * 11} r={9 + (3 - Math.abs(i - 3)) * 2} fill="url(#jewelGold)"/>)}<path d="M140 187 L119 219 L140 249 L161 219 Z" fill="url(#jewelGold)"/></>}</svg>
 </div>;
}
export function ProductCard({ product }) { const { favorites, toggle, add } = useShop(), { notify } = useToast(), saved = favorites.includes(product.id); const { demo } = useCatalog(); return <article className="product-card"><div className="product-card-media"><Link to={`/product/${encodeURIComponent(product.id)}`}><ProductImage product={product}/></Link><button type="button" onClick={() => { toggle(product.id); notify(saved ? 'Removed from wishlist' : 'Saved to wishlist', 'success'); }} className={`favorite-button ${saved ? 'saved' : ''}`} aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}><Heart size={19} fill={saved ? 'currentColor' : 'none'}/></button><span className="product-tag">{product.metal === 'Gold' ? 'GOLD' : 'SILVER'}{demo ? ' · SAMPLE' : ''}</span><button type="button" className="quick-add" onClick={() => { if (product.stock === 0) {
    notify('Currently out of stock', 'error');
    return;
} add(product.id); notify('Added to your bag', 'success'); }}><ShoppingBag size={16}/> Add to Bag</button></div><Link to={`/product/${encodeURIComponent(product.id)}`} className="product-name">{product.name}</Link><p className="product-details">{product.purity} <span>·</span> {product.weight}</p><p className="product-price">{inr(product.price)} <small>indicative</small></p></article>; }
export function EmptyState({ title, description, icon = 'bag', action }) { const Icon = icon === 'heart' ? Heart : icon === 'search' ? Search : ShoppingBag; return <div className="empty-state"><div className="empty-icon"><Icon size={28}/></div><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>; }
export function ProductGrid({ products }) { return <div className="product-grid">{products.map(p => <ProductCard key={p.id} product={p}/>)}</div>; }
export function StatsStrip() { return <div className="stats-strip"><div><Gem /><span><strong>Thoughtfully Curated</strong><small>Gold & silver selections</small></span></div><div><ShieldCheck /><span><strong>Clear Enquiries</strong><small>Confirm all details with our store</small></span></div><div><Coins /><span><strong>Gold SIP Yojana</strong><small>Plan your gold savings</small></span></div><div><TrendingUp /><span><strong>Rate Calculator</strong><small>Estimate before you buy</small></span></div></div>; }
export function WhatsAppLink({ items, quantities }) {
    const { store } = useCatalog(), { user } = useAuth(), { notify } = useToast();
    const handle = async () => {
        if (!store.whatsapp) {
            notify('WhatsApp number is not configured. Please contact the store.', 'error');
            return;
        }
        const body = [`Hello ${store.name}, I am interested in:`, ...items.map(p => `• ${p.name} (${p.id}) | ${p.purity} | ${p.weight} | Qty ${quantities?.[p.id] || 1} | Indicative ${inr(p.price)}`), 'Please confirm availability and the final price.'].join('\n');
        if (user) {
            const { api } = await import('./api');
            void Promise.allSettled(items.map(p => api('/enquiries', 'POST', { productId: p.id, message: body.slice(0, 1000) })));
        }
        window.open(`https://wa.me/${store.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(body)}`, '_blank', 'noopener,noreferrer');
    };
    return <button type="button" className="button button-outline" onClick={handle}><ArrowUpRight size={18}/> Enquire on WhatsApp</button>;
}
export const SERVICES = [{ icon: Gem, title: 'Fine Jewellery', text: 'Browse timeless gold and silver collections.' }, { icon: Calculator, title: 'Price Calculator', text: 'Understand your indicative jewellery cost.' }, { icon: StoreIcon, title: 'Visit in Gwalior', text: 'Speak with the team at Daulat Ganj.' }];
