import { ArrowUpRight, Instagram, MapPin, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import Brand from './Brand';
import { useStore } from '../context/StoreContext';
import { storeAddress, resolveWhatsApp } from '../utils/format';
export default function Footer() {
  const { store } = useStore();
  const address = storeAddress(store);
  const whatsapp = resolveWhatsApp(store);
  return <footer className="footer"><div className="container footer-inner"><div className="footer-brand"><Brand invert/><p>Thoughtful designs, lasting memories. Explore our curated collection of gold and silver jewellery.</p>{whatsapp && <a className="footer-whatsapp" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">Chat on WhatsApp <ArrowUpRight size={16}/></a>}</div><div className="footer-links"><h4>Explore</h4><Link to="/collection?metal=Gold">Gold Jewellery</Link><Link to="/collection?metal=Silver">Silver Jewellery</Link><Link to="/coins?metal=Gold">Gold Coins</Link><Link to="/coins?metal=Silver">Silver Coins</Link></div><div className="footer-links"><h4>Quick Links</h4><Link to="/rates">Live Store Rates</Link><Link to="/wishlist">My Wishlist</Link><Link to="/cart">Shopping Bag</Link><Link to="/account">My Account</Link></div><div className="footer-contact"><h4>Visit Us</h4>{address && <p><MapPin size={17}/>{address}</p>}{store.phone && <p><Phone size={17}/><a href={`tel:${String(store.phone).replace(/[^+\d]/g, '')}`}>{store.phone}</a></p>}{store.email && <p><Mail size={17}/><a href={`mailto:${store.email}`}>{store.email}</a></p>}<Link to="/store" className="footer-visit">Store details <ArrowUpRight size={16}/></Link></div></div><div className="container footer-bottom"><p>© {new Date().getFullYear()} {store.name || 'Ratan Lal Saraf'}. All rights reserved.</p><p>Jewellery prices and availability confirmed by store. <Link to="/admin" style={{color:"inherit",textDecoration:"underline",textUnderlineOffset:4,marginLeft:12}}>Admin login</Link></p></div></footer>;
}
