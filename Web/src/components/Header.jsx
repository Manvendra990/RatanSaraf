import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, MapPin, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import Brand from './Brand';
import { useShop } from '../context/ShopContext';
import { useStore } from '../context/StoreContext';
export default function Header() {
  const { cartCount, favorites } = useShop();
  const { store } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [location.pathname, location.search]);
  useEffect(() => { if (searchOpen) inputRef.current?.focus(); }, [searchOpen]);
  const submit = e => { e.preventDefault(); navigate(`/collection?q=${encodeURIComponent(query.trim())}`); setSearchOpen(false); };
  const nav = [
    { label: 'Home', to: '/' },
    { label: 'Gold Jewellery', to: '/collection?metal=Gold' },
    { label: 'Silver Jewellery', to: '/collection?metal=Silver' },
    { label: 'Gold Coins', to: '/coins?metal=Gold' },
    { label: 'Silver Coins', to: '/coins?metal=Silver' },
    { label: 'Gold & Silver Rates', to: '/rates' },
  ];
  return <>
    <div className="announcement"><span>✧</span> A legacy of elegance, crafted with care <span>✧</span></div>
    <div className="header-main">
      <div className="container header-main-inner">
        <button aria-label="Open menu" className="icon-button mobile-menu-btn" onClick={() => setMenuOpen(true)}><Menu size={23}/></button>
        <div className="header-side-note"><MapPin size={15}/><span>{store.city || 'Visit our store'}</span></div>
        <Brand />
        <div className="header-actions">
          <button className="icon-button" aria-label="Search products" onClick={() => setSearchOpen(v => !v)}><Search size={21}/></button>
          {/* <Link to="/account" className="icon-button desktop-action" aria-label="My account"><UserRound size={21}/></Link> */}
          <Link to="/wishlist" className="icon-button badge-wrapper" aria-label={`Wishlist, ${favorites.length} items`}><Heart size={21}/>{favorites.length > 0 && <span className="action-badge">{favorites.length}</span>}</Link>
          <Link to="/cart" className="icon-button badge-wrapper" aria-label={`Cart, ${cartCount} items`}><ShoppingBag size={21}/>{cartCount > 0 && <span className="action-badge">{cartCount}</span>}</Link>
        </div>
      </div>
      {searchOpen && <form onSubmit={submit} className="header-search container"><Search size={20} /><input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search jewellery by name or product code…" aria-label="Search products"/><button type="submit">Search <ArrowRight size={15}/></button><button type="button" className="icon-button" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={18}/></button></form>}
    </div>
    <nav className="desktop-nav" aria-label="Main navigation"><div className="container desktop-nav-inner">{nav.map(x => <NavLink end={x.to === '/'} className={({ isActive }) => isActive && !x.to.includes('?') ? 'active' : undefined} key={x.label} to={x.to}>{x.label}</NavLink>)}<Link className="nav-store-link" to="/store">Our Store <ArrowRight size={14}/></Link></div></nav>
    {menuOpen && <div className="mobile-menu-backdrop" onMouseDown={() => setMenuOpen(false)}><aside onMouseDown={e => e.stopPropagation()} className="mobile-menu"><div className="mobile-menu-heading"><Brand compact/><button className="icon-button" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X/></button></div>{nav.map(x => <Link className="mobile-nav-link" to={x.to} key={x.label}>{x.label}<ArrowRight size={17}/></Link>)}<Link className="mobile-nav-link" to="/store">Visit Our Store<ArrowRight size={17}/></Link><Link className="mobile-nav-link" to="/account">My Account<ArrowRight size={17}/></Link></aside></div>}
  </>;
}
