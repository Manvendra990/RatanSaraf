import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ErrorNotice, EmptyState, LoadingState, ProductCard } from '../components/UI';
import { isCoin } from '../utils/format';
export default function Collection({ coinsOnly = false }) {
  const { products, categories, error, loading, refresh } = useStore();
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState('featured');
  const [localSearch, setLocalSearch] = useState(params.get('q') || '');
  const metal = params.get('metal') || 'All';
  const category = params.get('category') || 'All';
  const q = (params.get('q') || '').toLowerCase().trim();
  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'All') next.delete(key); else next.set(key, value);
    setParams(next);
  };
  const matchingCategories = categories.filter(c => metal === 'All' || c.metal === metal);
  const selected = useMemo(() => {
    const matching = products.filter(p => isCoin(p) === coinsOnly &&
      (metal === 'All' || p.metal === metal) &&
      (category === 'All' || p.category === category) &&
      (!q || [p.name,p.productCode,p.metal,p.category,p.purity].filter(Boolean).join(' ').toLowerCase().includes(q)));
    if (sort === 'alpha') matching.sort((a,b) => (a.name || '').localeCompare(b.name || ''));
    else if (sort === 'newest') matching.reverse();
    else if (sort === 'price-low' && coinsOnly) matching.sort((a,b) => (a.price || 0) - (b.price || 0));
    else if (sort === 'price-high' && coinsOnly) matching.sort((a,b) => (b.price || 0) - (a.price || 0));
    else matching.sort((a,b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    return matching;
  }, [products,coinsOnly,metal,category,q,sort]);
  return <><div className="page-heading"><div className="container"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><span>{coinsOnly ? 'Gold & Silver Coins' : 'Jewellery Collection'}</span></div><p className="eyebrow">THE RLS EDIT</p><h1>{coinsOnly ? <>Gold & Silver <em>Coins</em></> : <>Explore Our <em>Collection</em></>}</h1><p>{coinsOnly ? 'Browse our store’s coin collection, beautifully suited for gifting and cherished moments.' : 'Find the perfect piece, thoughtfully curated for your special moments.'}</p></div></div>
    <div className="container collection-layout"><aside className="catalog-filters"><div className="filters-heading"><SlidersHorizontal size={18}/> FILTER COLLECTION</div><h3>Shop by Metal</h3><div className="filter-choices">{['All','Gold','Silver'].map(m => <label key={m} className="filter-choice"><input type="radio" checked={metal===m} onChange={() => {setFilter('metal',m); setFilter('category','All');}}/><span>{m === 'All' ? 'All Metals' : m}</span></label>)}</div>{!coinsOnly && matchingCategories.length > 0 && <><div className="filter-divider"/><h3>Category</h3><div className="filter-choices">{[{name:'All',metal:'All'},...matchingCategories].map(c => <label className="filter-choice" key={`${c.metal}-${c.name}`}><input type="radio" checked={category === c.name} onChange={() => setFilter('category', c.name)}/><span>{c.name === 'All' ? 'All Categories' : c.name}</span></label>)}</div></>}<div className="filter-divider"/><Link to="/store" className="filter-help">Need help choosing? <span>Contact our store →</span></Link></aside><div className="collection-main"><div className="catalog-tools"><div className="catalog-count"><strong>{selected.length}</strong> {selected.length === 1 ? 'piece' : 'pieces'} found</div><form className="catalog-search" onSubmit={e => {e.preventDefault(); setFilter('q',localSearch.trim());}}><Search size={17}/><input aria-label="Search collection" value={localSearch} onChange={e=>setLocalSearch(e.target.value)} placeholder="Search by name or code…"/><button type="submit" aria-label="Apply search"><Search size={16}/></button></form><div className="catalog-sort"><label htmlFor="sort-products">Sort by</label><select id="sort-products" value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="newest">Recently Added</option><option value="alpha">Name A–Z</option>{coinsOnly && <><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option></>}</select><ChevronDown size={16}/></div></div><div className="mobile-filter-pills"><button className={metal === 'All' ? 'active' : ''} onClick={() => {setFilter('metal','All'); setFilter('category','All');}}>All</button><button className={metal === 'Gold' ? 'active' : ''} onClick={() => {setFilter('metal','Gold'); setFilter('category','All');}}>Gold</button><button className={metal === 'Silver' ? 'active' : ''} onClick={() => {setFilter('metal','Silver'); setFilter('category','All');}}>Silver</button></div>{q && <div className="active-search">Showing results for “{params.get('q')}” <button onClick={() => {setFilter('q','');setLocalSearch('');}} aria-label="Clear search"><X size={16}/></button></div>}<ErrorNotice text={error} onRetry={() => refresh()}/>{loading && !products.length ? <LoadingState/> : selected.length ? <div className="product-grid catalog-grid">{selected.map(p => <ProductCard key={p.id} product={p}/>)}</div> : <EmptyState title="No pieces found" message={error ? 'Unable to load the store’s collection right now.' : 'Try a different metal, search term or category.'} actionLabel="Clear Filters" to={coinsOnly?'/coins':'/collection'}/>}</div></div></>;
}
