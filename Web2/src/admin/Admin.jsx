import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Bell,
  BookOpen, Boxes, Check, CheckCircle2, ChevronDown, CircleAlert, ClipboardCheck,
  FileClock, Gem, ImagePlus, LayoutDashboard, ListFilter, LoaderCircle,
  LogOut, Menu, Package, RefreshCw, Search, Settings2, ShieldCheck, ShoppingBag,
  Sparkles, Store, TrendingUp, Users, Wallet, X, Coins,
} from 'lucide-react';
import { adminApi as api, adminDocumentBlob, adminUploadImage } from './api';
import { productImage } from '../utils/format';
import './admin.css';
import './product-filters.css';

const GROUPS = [
  { name: 'MAIN', items: [['Overview', LayoutDashboard], ['Products', Gem], ['Categories', Boxes], ['Rates', TrendingUp]] },
  { name: 'CUSTOMER OPERATIONS', items: [['Customers', Users], ['KYC', ShieldCheck], ['Gold Buys', ArrowDownLeft], ['Sales', ArrowUpRight], ['Ledger', BookOpen], ['Enquiries', Bell]] },
  { name: 'SYSTEM', items: [['Settings', Settings2], ['Audit', FileClock]] },
];
const names = { Overview: 'Dashboard', Rates: 'Store Rates', 'Gold Buys': 'Metal Purchases', KYC: 'KYC Reviews' };
const paths = { Customers: 'users', KYC: 'kyc', 'Gold Buys': 'purchases' };
const endpoint = tab => paths[tab] || tab.toLowerCase();
const fields = {
  Products: [
    { key: 'name', label: 'Product name', required: true },
    { key: 'productCode', label: 'Product code' },
    { key: 'metal', label: 'Metal', options: ['Gold', 'Silver'] },
    { key: 'gender', label: 'Gender / audience', options: ['', 'Men', 'Women', 'Unisex', 'Children'], required: true },
    { key: 'categoryId', label: 'Category', category: true },
    { key: 'price', label: 'Internal estimate / coin price (₹)', type: 'number', required: true },
    { key: 'weight', label: 'Weight (example: 1 gram)', required: true },
    { key: 'purity', label: 'Purity', required: true },
    { key: 'coinWeight', label: 'Coin weight (grams; coins only)', type: 'number' },
    { key: 'stock', label: 'Stock quantity', type: 'number', required: true },
    { key: 'brand', label: 'Brand' },
    { key: 'colour', label: 'Colour' },
    { key: 'availability', label: 'Availability message' },
    { key: 'certifiedBy', label: 'Certification (if applicable)' },
    { key: 'image', label: 'Image URL', type: 'url', wide: true },
    { key: 'description', label: 'Description', type: 'textarea', wide: true },
    { key: 'featured', label: 'Feature on jewellery homepage', type: 'checkbox' },
    { key: 'active', label: 'Visible on website and mobile app', type: 'checkbox' },
  ],
  Categories: [
    { key: 'name', label: 'Category name', required: true },
    { key: 'metal', label: 'Metal', options: ['Gold', 'Silver'] },
    { key: 'active', label: 'Visible on website and mobile app', type: 'checkbox' },
  ],
  Rates: [
    { key: 'metal', label: 'Metal', options: ['Gold', 'Silver'] },
    { key: 'buy', label: 'New store rate (₹ per gram)', type: 'number', required: true },
    { key: 'source', label: 'Rate source / reference' },
  ],
  Settings: [
    { key: 'name', label: 'Store name' }, { key: 'ownerName', label: 'Owner name' },
    { key: 'tagline', label: 'Tagline' }, { key: 'descriptor', label: 'Descriptor' },
    { key: 'addressLine1', label: 'Street address', wide: true },
    { key: 'city', label: 'City' }, { key: 'state', label: 'State' },
    { key: 'pincode', label: 'Pincode' }, { key: 'mapQuery', label: 'Maps query', wide: true },
    { key: 'latitude', label: 'Latitude', type: 'number' },
    { key: 'longitude', label: 'Longitude', type: 'number' },
    { key: 'whatsapp', label: 'WhatsApp number with country code' },
    { key: 'phone', label: 'Store contact number with country code' },
    { key: 'facebook', label: 'Facebook page URL', type: 'url' },
    { key: 'instagram', label: 'Instagram profile URL', type: 'url' },
    { key: 'youtube', label: 'YouTube channel URL', type: 'url' },
    { key: 'googleMaps', label: 'Google Maps location URL', type: 'url', wide: true },
  ],
};
const defaultForm = tab => Object.fromEntries((fields[tab] || []).map(f => [f.key, f.type === 'checkbox' ? true : f.options?.[0] || '']));
const formatLabel = key => ({
  amountPaise: 'Amount', pricePaise: 'Price', buyPaise: 'Current / accepted ₹/g',
  sellPaise: 'Sell ₹/g', createdAt: 'Date', anchorAt: 'Started',
  nextDue: 'Next due', paidCount: 'Payments', stock: 'Stock',
  productCode: 'Code', categoryName: 'Category', orderNumber: 'Order',
}[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()));
const inrPaise = value => Number.isFinite(Number(value)) ? `₹${(Number(value) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
const readableValue = (key, val) => {
  if (val === null || val === undefined || val === '') return '—';
  if (key.endsWith('Paise')) return inrPaise(val);
  if (key === 'grams') return `${(Number(val) / 1000000).toFixed(6)} g`;
  if (key === 'active' || key === 'featured') return [true, 1, '1'].includes(val) ? 'Yes' : 'No';
  if (/At$|Date$/.test(key) && !Number.isNaN(Date.parse(val))) return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  if (typeof val === 'object') return Array.isArray(val) ? `${val.length} items` : 'View details';
  return String(val);
};
const hiddenColumn = key => /^(id|actor|version|reviewedBy|description|image|payoutDetails|accountEncrypted|pricingPolicy|password)$/i.test(key)
  || /Id$/.test(key) || /^(pan|aadhaar|aadhar|identity|document)/i.test(key)
  || /(token|secret|hash)/i.test(key);
const visibleKeys = (tab, rows) => {
  if (!rows?.length) return [];
  const preferred = {
    Products: ['name', 'productCode', 'gender', 'metal', 'category', 'weight', 'purity', 'stock', 'active'],
    Categories: ['name', 'metal', 'active'],
    Rates: ['metal', 'buyPaise', 'source', 'createdAt'],
    Customers: ['name', 'email', 'phone', 'status', 'createdAt'],
    KYC: ['name', 'userName', 'status', 'submittedAt', 'createdAt'],
    'Gold Buys': ['name', 'metal', 'amountPaise', 'grams', 'status', 'createdAt'],
    Sales: ['name', 'metal', 'amountPaise', 'grams', 'status', 'createdAt'],
    Ledger: ['metal', 'type', 'amountPaise', 'grams', 'status', 'createdAt'],
    Enquiries: ['name', 'message', 'status', 'createdAt'],
    Audit: ['action', 'entity', 'createdAt', 'status'],
  }[tab] || [];
  const actual = [...new Set(rows.slice(0, 6).flatMap(row => Object.keys(row || {})))].filter(k => !hiddenColumn(k) && !(tab === 'Rates' && k === 'sellPaise'));
  const priority = preferred.filter(k => actual.includes(k));
  return [...priority, ...actual.filter(k => !priority.includes(k))].slice(0, 8);
};
const validateKycVersion = version => {
  const n = Number(version);
  if (!Number.isSafeInteger(n) || n < 1) throw new Error('KYC version missing or invalid. Reopen the latest KYC submission before reviewing.');
  return n;
};
const isTruthy = value => [true, 1, '1'].includes(value);

// Local admin-only catalogue filters. They never change stored product data.
const DEFAULT_PRODUCT_FILTERS = {
  metal: 'All',
  gender: 'All',
  categoryId: 'All',
  stock: 'All',
  visibility: 'All',
  featured: 'All',
  sort: 'newest',
};

const productCategoryId = (product, categories) => {
  if (product.categoryId != null) return String(product.categoryId);
  if (product.category && typeof product.category === 'object' && product.category.id != null) {
    return String(product.category.id);
  }
  const name = product.categoryName ||
    (typeof product.category === 'string' ? product.category : product.category?.name);
  const category = categories.find(item =>
    String(item.name || '').toLowerCase() === String(name || '').toLowerCase()
    && (!product.metal || item.metal === product.metal)
  );
  return category ? String(category.id) : '';
};

function ProductFilterBar({ filters, onChange, onReset, categories, shown, total, active }) {
  // Keep the product table visible by default on both desktop and mobile.
  const [expanded, setExpanded] = useState(false);
  const options = categories.filter(category =>
    filters.metal === 'All' || category.metal === filters.metal
  );
  const selectedCount = ['metal', 'gender', 'categoryId', 'stock', 'visibility', 'featured']
    .filter(key => filters[key] !== DEFAULT_PRODUCT_FILTERS[key]).length;

  return (
    <div className="ad-product-filters" aria-label="Product filters">
      <div className="ad-product-filter-toolbar">
        <button
          type="button"
          className={`ad-product-filter-toggle ${expanded ? 'is-open' : ''}`}
          onClick={() => setExpanded(open => !open)}
          aria-expanded={expanded}
          aria-controls="ad-product-advanced-filters"
        >
          <ListFilter size={16} aria-hidden="true" />
          Filters
          {selectedCount > 0 && <span className="ad-product-filter-badge">{selectedCount}</span>}
          <ChevronDown size={15} aria-hidden="true" />
        </button>

        <label className="ad-product-quick-sort">
          <span>Sort</span>
          <select
            aria-label="Sort products"
            value={filters.sort}
            onChange={event => onChange('sort', event.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="nameAsc">Name A–Z</option>
            <option value="nameDesc">Name Z–A</option>
            <option value="stockAsc">Stock: Low–High</option>
            <option value="stockDesc">Stock: High–Low</option>
          </select>
        </label>

        <span className="ad-product-filter-count" role="status" aria-live="polite">
          {shown} of {total} products
        </span>

        {active && (
          <button type="button" className="ad-product-clear" onClick={onReset}>
            <RefreshCw size={13} aria-hidden="true" /> Clear
          </button>
        )}
      </div>

      {expanded && (
        <div className="ad-product-filters-grid" id="ad-product-advanced-filters"><label><span>Gender / audience</span><select aria-label="Filter products by gender" value={filters.gender} onChange={e=>onChange('gender',e.target.value)}><option value="All">All audiences</option>{['Men','Women','Unisex','Children'].map(g=><option key={g}>{g}</option>)}</select></label>
          <label>
            <span>Metal</span>
            <select value={filters.metal} onChange={event => onChange('metal', event.target.value)}>
              <option value="All">All metals</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
            </select>
          </label>
          <label>
            <span>Category</span>
            <select value={filters.categoryId} onChange={event => onChange('categoryId', event.target.value)}>
              <option value="All">All categories</option>
              {options.map(category => (
                <option key={category.id} value={String(category.id)}>
                  {category.name} ({category.metal})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Stock</span>
            <select value={filters.stock} onChange={event => onChange('stock', event.target.value)}>
              <option value="All">Any stock</option>
              <option value="in">In stock</option>
              <option value="low">Low stock (1–5)</option>
              <option value="out">Out of stock</option>
            </select>
          </label>
          <label>
            <span>Visibility</span>
            <select value={filters.visibility} onChange={event => onChange('visibility', event.target.value)}>
              <option value="All">All visibility</option>
              <option value="visible">Visible / active</option>
              <option value="hidden">Hidden / inactive</option>
            </select>
          </label>
          <label>
            <span>Homepage</span>
            <select value={filters.featured} onChange={event => onChange('featured', event.target.value)}>
              <option value="All">All products</option>
              <option value="featured">Featured</option>
              <option value="regular">Not featured</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}

function Status({ status }) {
  const normalized = String(status || '').toLowerCase();
  return <span className={`ad-status ad-status-${normalized.replace(/[^a-z0-9]/g, '')}`}><span className="ad-status-dot" />{status || '—'}</span>;
}
function Notice({ type = 'error', children, onClose }) {
  if (!children) return null;
  return <div role={type === 'error' ? 'alert' : 'status'} className={`ad-notice ad-notice-${type}`}>
    {type === 'error' ? <CircleAlert size={19} /> : <CheckCircle2 size={19} />}<span>{children}</span>{onClose && <button onClick={onClose} aria-label="Dismiss notice"><X size={15} /></button>}
  </div>;
}
function Dialog({ title, subtitle, children, onClose, wide = false }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return <div className="ad-dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className={`ad-dialog ${wide ? 'ad-dialog-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={e => e.stopPropagation()}>
      <div className="ad-dialog-head"><div><p className="ad-eyebrow">RATAN LAL SARAF / ADMIN</p><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="ad-icon-btn" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></div>
      {children}
    </section>
  </div>;
}

export default function Admin() {
  const [bankDetails,setBankDetails]=useState(null);
  async function viewBank(row){const current=requestId.current;await run(async()=>{const details=await api(`/admin/sales/${encodeURIComponent(row.id)}/bank`,{auth:false});if(requestId.current===current)setBankDetails({...details,customer:row.name});});}
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [credentials, setCredentials] = useState({ login: '', password: '' });
  const [tab, setTab] = useState('Overview');
  const [metal, setMetal] = useState('Gold');
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(defaultForm('Overview'));
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [productFilters, setProductFilters] = useState(DEFAULT_PRODUCT_FILTERS);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [decision, setDecision] = useState(null);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [kycDetail, setKycDetail] = useState(null);
  const [kycDocument, setKycDocument] = useState(null);
  const [details, setDetails] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const requestId = useRef(0);
  const kycObjectUrl = useRef(null);

  const clearKycDocument = useCallback(() => {
    if (kycObjectUrl.current) URL.revokeObjectURL(kycObjectUrl.current);
    kycObjectUrl.current = null;
    setKycDocument(null);
  }, []);
  useEffect(() => () => { if (kycObjectUrl.current) URL.revokeObjectURL(kycObjectUrl.current); }, []);
  useEffect(() => {
    let active = true;
    api('/auth/me', { auth: false }).then(value => {
      if (active && (value?.role === 'ADMIN' || value?.user?.role === 'ADMIN')) setUser(value?.user || value);
    }).catch(() => { }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    const current = ++requestId.current;
    setLoading(true); setError('');
    try {
      const url = tab === 'Rates' ? '/gold/rates' : tab === 'KYC' ? '/manual-kyc/admin'
        : `/admin/${endpoint(tab)}${tab === 'Overview' ? `?metal=${encodeURIComponent(metal)}` : ''}`;
      const [loaded, cats] = await Promise.all([
        (async () => {
          if (tab !== 'Rates') return api(url, { auth: false });
          try { return await api(url, { auth: false }); }
          catch (e) { return api('/sip/rates', { auth: false }); } // Only legacy endpoint fallback; no SIP UI.
        })(),
        api('/admin/categories', { auth: false }),
      ]);
      if (requestId.current !== current) return;
      setData(loaded);
      setCategories(Array.isArray(cats) ? cats : []);
      if (tab === 'Settings') setForm({ ...defaultForm(tab), ...(loaded && !Array.isArray(loaded) ? loaded : {}) });
    } catch (e) { if (requestId.current === current) setError(e.message); }
    finally { if (requestId.current === current) setLoading(false); }
  }, [user, tab, metal]);

  useEffect(() => {
    requestId.current += 1;
    setData(null); setError(''); setNotice(''); setSearch(''); setStatusFilter('All');
    setProductFilters(DEFAULT_PRODUCT_FILTERS);
    setForm(defaultForm(tab)); setEditing(null); setFormOpen(tab === 'Rates' || tab === 'Settings');
    clearKycDocument(); setKycDetail(null); setDetails(null); setDecision(null); setBankDetails(null);
    if (user) void load();
  }, [tab, metal, user, load, clearKycDocument]);

  async function run(action) {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (e) { setError(e.message || 'Something went wrong.'); }
    finally { setBusy(false); }
  }
  function go(tabName) { setTab(tabName); setNavOpen(false); window.scrollTo(0, 0); }
  async function signIn(e) {
    e.preventDefault();
    await run(async () => {
      const response = await api('/auth/admin-login', { method: 'POST', body: credentials, auth: false });
      const next = response?.user || response;
      if (next?.role !== 'ADMIN') throw new Error('This account is not authorized for the admin workspace.');
      setCredentials({ login: '', password: '' }); setUser(next);
    });
  }
  async function signOut() {
    setBankDetails(null);
    await run(async () => {
      try { await api('/auth/logout', { method: 'POST', auth: false }); }
      finally { setUser(null); clearKycDocument(); setKycDetail(null); setData(null); }
    });
  }
  async function save(e) {
    e.preventDefault();
    await run(async () => {
      const payload = { ...form };

      if (tab === 'Products') {
        // Keep the same payload keys and price format as the original admin.
        // The previous admin required these fields; the redesign had lost that validation.
        const requiredFields = {
          name: 'Product name',
          metal: 'Metal',
          categoryId: 'Category',
          price: 'Price / internal estimate',
          weight: 'Weight',
          purity: 'Purity',
          stock: 'Stock quantity',
        };

        for (const [key, label] of Object.entries(requiredFields)) {
          if (String(payload[key] ?? '').trim() === '') {
            throw new Error(`${label} is required.`);
          }
        }

        const matchingCategory = categories.find(
          category => String(category.id) === String(payload.categoryId),
        );
        if (!matchingCategory) {
          throw new Error('Select a valid category before saving the product.');
        }
        if (matchingCategory.metal !== payload.metal) {
          throw new Error('The selected category must match the product metal.');
        }

        const price = Number(payload.price);
        if (!Number.isFinite(price) || price <= 0) {
          throw new Error('Enter a valid price greater than zero.');
        }
        // IMPORTANT: price remains a string; that is what the original admin sent.

        const stock = Number(payload.stock);
        if (!Number.isSafeInteger(stock) || stock < 0) {
          throw new Error('Stock must be a non-negative whole number.');
        }
        payload.stock = stock;

        if (payload.coinWeight === '' || payload.coinWeight == null) {
          delete payload.coinWeight;
        } else {
          const weight = Number(payload.coinWeight);
          if (!Number.isFinite(weight) || weight <= 0) {
            throw new Error('Coin weight must be a positive number.');
          }
          // Keep nonempty coinWeight in its original form for backend compatibility.
        }
      }

      if (tab === 'Settings') {
        payload.latitude = Number(payload.latitude);
        payload.longitude = Number(payload.longitude);
      }

      const path = `/admin/${endpoint(tab)}${editing ? '/' + encodeURIComponent(editing) : ''}`;
      await api(path, {
        method: editing || tab === 'Settings' ? 'PUT' : 'POST',
        body: payload,
        auth: false,
      });

      setNotice(
        tab === 'Rates'
          ? 'Rate published successfully. The website and mobile app read from this same backend.'
          : 'Changes saved to your existing backend.',
      );
      setEditing(null);
      setForm(defaultForm(tab));
      setFormOpen(tab === 'Settings' || tab === 'Rates');
      await load();
    });
  }

  function edit(row) {
    const next = defaultForm(tab);
    (fields[tab] || []).forEach(f => { next[f.key] = f.type === 'checkbox' ? isTruthy(row[f.key]) : (row[f.key] ?? next[f.key]); });
    setForm(next); setEditing(row.id); setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function setField(key, value) {
    setForm(current => key === 'metal' && tab === 'Products' ? { ...current, metal: value, categoryId: '' } : { ...current, [key]: value });
  }
  function beginDecision(row, action) {
    setDecision({
      tab, id: row.id, action, legacy: row.requestType === 'LEGACY', customerName: row.name,
      metal: row.metal || 'Gold', grams: row.grams, amountPaise: row.amountPaise
    });
    setNote(''); setReference('');
  }
  async function submitDecision(e) {
    e.preventDefault();
    await run(async () => {
      const isKyc = decision.tab === 'KYC';
      const url = isKyc ? `/manual-kyc/admin/${encodeURIComponent(decision.id)}/decision`
        : `/admin/${decision.tab === 'Gold Buys' ? (decision.legacy ? 'payments' : 'purchases') : decision.tab.toLowerCase()}/${encodeURIComponent(decision.id)}/decision`;
      await api(url, {
        method: 'POST', auth: false, body: {
          action: decision.action, note,
          ...(isKyc ? { version: validateKycVersion(decision.version) } : {}),
          ...(reference ? { reference } : {}),
        }
      });
      setDecision(null); setNotice('Decision recorded on the backend.'); await load();
    });
  }
  async function viewKyc(id) {
    await run(async () => {
      clearKycDocument();
      const loaded = await api(`/manual-kyc/admin/${encodeURIComponent(id)}`, { auth: false });
      setKycDetail(loaded);
    });
  }
  async function openKycDocument() {
    await run(async () => {
      clearKycDocument();
      const blob = await adminDocumentBlob(kycDetail.id);
      const url = URL.createObjectURL(blob);
      kycObjectUrl.current = url;
      setKycDocument({ url, type: blob.type });
    });
  }
  function reviewKyc(action) {
    if (action === 'APPROVE' && !window.confirm('Confirm that you manually reviewed the PAN document and customer details? No automated identity verification is being performed.')) return;
    try {
      const version = validateKycVersion(kycDetail.version);
      setDecision({ tab: 'KYC', id: kycDetail.id, action, version });
      setNote(''); setReference(''); setKycDetail(null); clearKycDocument();
    } catch (e) { setError(e.message); }
  }

  const rows = Array.isArray(data) ? data : [];
  const keys = useMemo(() => visibleKeys(tab, rows), [tab, rows]);

  const setProductFilter = (key, value) => {
    setProductFilters(current => ({
      ...current,
      [key]: value,
      ...(key === 'metal' ? { categoryId: 'All' } : {}),
    }));
  };
  const resetProductFilters = () => {
    setProductFilters(DEFAULT_PRODUCT_FILTERS);
    setSearch('');
  };
  const productFiltersActive = tab === 'Products' && (
    Boolean(search.trim()) ||
    Object.entries(DEFAULT_PRODUCT_FILTERS).some(([key, value]) => productFilters[key] !== value)
  );

  const visibleRows = useMemo(() => {
    const filtered = rows.filter(row => {
      if (['Gold Buys', 'Sales', 'Ledger'].includes(tab) && (row.metal || 'Gold') !== metal) return false;
      if (statusFilter !== 'All' && String(row.status || '').toUpperCase() !== statusFilter) return false;
      if (search.trim()) {
        const haystack = Object.entries(row)
          .filter(([key, val]) => !hiddenColumn(key) && typeof val !== 'object')
          .map(([, val]) => String(val)).join(' ').toLowerCase();
        const categoryName = tab === 'Products' ? (
          categories.find(category => String(category.id) === productCategoryId(row, categories))?.name || ''
        ) : '';
        if (!`${haystack} ${categoryName}`.includes(search.trim().toLowerCase())) return false;
      }
      if (tab !== 'Products') return true;

      if (productFilters.gender !== 'All' && row.gender !== productFilters.gender) return false;
      if (productFilters.metal !== 'All' && row.metal !== productFilters.metal) return false;
      if (productFilters.categoryId !== 'All' &&
        productCategoryId(row, categories) !== productFilters.categoryId) return false;

      const qty = row.stock == null || row.stock === '' ? null : Number(row.stock);
      if (productFilters.stock === 'in' && !(qty > 0)) return false;
      if (productFilters.stock === 'low' && !(qty > 0 && qty <= 5)) return false;
      if (productFilters.stock === 'out' && qty !== 0) return false;

      if (productFilters.visibility !== 'All') {
        if (row.active == null) return false;
        if (isTruthy(row.active) !== (productFilters.visibility === 'visible')) return false;
      }
      if (productFilters.featured !== 'All') {
        if (row.featured == null) return false;
        if (isTruthy(row.featured) !== (productFilters.featured === 'featured')) return false;
      }
      return true;
    });

    if (tab !== 'Products') return filtered;
    const dateNumber = value => {
      const result = Date.parse(String(value || ''));
      return Number.isFinite(result) ? result : 0;
    };
    const stockNumber = value => value == null || value === '' ? null : Number(value);
    return [...filtered].sort((a, b) => {
      switch (productFilters.sort) {
        case 'oldest': return dateNumber(a.createdAt) - dateNumber(b.createdAt);
        case 'nameAsc': return String(a.name || '').localeCompare(String(b.name || ''));
        case 'nameDesc': return String(b.name || '').localeCompare(String(a.name || ''));
        case 'stockAsc': {
          const av = stockNumber(a.stock), bv = stockNumber(b.stock);
          return (av ?? Number.POSITIVE_INFINITY) - (bv ?? Number.POSITIVE_INFINITY);
        }
        case 'stockDesc': {
          const av = stockNumber(a.stock), bv = stockNumber(b.stock);
          return (bv ?? Number.NEGATIVE_INFINITY) - (av ?? Number.NEGATIVE_INFINITY);
        }
        default: return dateNumber(b.createdAt) - dateNumber(a.createdAt);
      }
    });
  }, [rows, tab, metal, statusFilter, search, productFilters, categories]);

  const statuses = [...new Set(rows.map(r => r.status).filter(Boolean))];
  const currentIcon = GROUPS.flatMap(g => g.items).find(([label]) => label === tab)?.[1] || LayoutDashboard;
  const PageIcon = currentIcon;

  if (!ready) return <div className="ad-full-loader"><LoaderCircle className="ad-spin" size={28} /><span>Connecting to your store…</span></div>;
  if (!user) return <div className="ad-login-shell">
    <Link className="ad-back-to-store" to="/"><ArrowLeft size={16} /> Back to storefront</Link>
    <div className="ad-login-visual"><div className="ad-login-brand-mark">R<span>✦</span></div><p className="ad-eyebrow">RATAN LAL SARAF</p><h1>Your store,<br /><em>beautifully managed.</em></h1><p>One elegant workspace to manage products, published rates, customers and store operations.</p><div className="ad-login-footer"><ShieldCheck size={19} /> Secure admin access · Existing store backend</div></div>
    <div className="ad-login-pane"><form className="ad-login-card" onSubmit={signIn}><div className="ad-login-badge"><Sparkles size={18} /> ADMIN WORKSPACE</div><h2>Welcome back.</h2><p>Sign in with your existing admin credentials.</p>
      <label>Admin email<input type="email" required autoComplete="username" value={credentials.login} onChange={e => setCredentials(c => ({ ...c, login: e.target.value }))} placeholder="admin@example.com" /></label>
      <label>Password<input required type="password" autoComplete="current-password" value={credentials.password} onChange={e => setCredentials(c => ({ ...c, password: e.target.value }))} placeholder="Enter your password" /></label>
      <Notice>{error}</Notice><button disabled={busy} type="submit" className="ad-button ad-primary ad-login-button">{busy ? 'Signing in…' : 'Sign in to dashboard'} <ArrowRight size={18} /></button><span className="ad-login-security"><ShieldCheck size={15} /> Uses your current backend login. No separate admin server.</span>
    </form></div>
  </div>;

  return <div className="ad-shell">
    {navOpen && <div className="ad-nav-overlay" role="presentation" onClick={() => setNavOpen(false)} />}
    <aside className={`ad-sidebar ${navOpen ? 'ad-sidebar-open' : ''}`}>
      <div className="ad-sidebar-brand"><div className="ad-brand-emblem">R<span>✦</span></div><div><strong>Ratan Lal Saraf</strong><small>STORE ADMINISTRATION</small></div><button className="ad-mobile-close ad-icon-btn" aria-label="Close menu" onClick={() => setNavOpen(false)}><X size={20} /></button></div>
      <div className="ad-workspace-badge"><span className="ad-workspace-icon"><Store size={19} /></span><span><strong>Store workspace</strong><small>Business management</small></span><ChevronDown size={14} /></div>
      <nav className="ad-sidebar-nav" aria-label="Admin sections">{GROUPS.map(group => <div className="ad-nav-group" key={group.name}><p>{group.name}</p>{group.items.map(([label, Icon]) => <button key={label} type="button" aria-current={tab === label ? 'page' : undefined} className={`ad-nav-item ${tab === label ? 'ad-active' : ''}`} onClick={() => go(label)}><Icon size={18} /><span>{names[label] || label}</span>{tab === label && <span className="ad-active-indicator" />}</button>)}</div>)}</nav>
      <div className="ad-sidebar-bottom"><Link to="/" className="ad-storefront-link"><ArrowUpRight size={17} /> View storefront</Link><button className="ad-signout" onClick={signOut} disabled={busy}><LogOut size={17} /> Sign out</button><div className="ad-sidebar-caption">RLS • Same website & admin port</div></div>
    </aside>

    <div className="ad-workspace">
      <header className="ad-topbar"><div className="ad-topbar-left"><button className="ad-menu-toggle ad-icon-btn" aria-label="Open admin menu" onClick={() => setNavOpen(true)}><Menu size={22} /></button><span className="ad-breadcrumb">Workspace</span><span className="ad-breadcrumb-divider">/</span><strong>{names[tab] || tab}</strong></div><div className="ad-topbar-right"><span className="ad-topbar-status"><span /> Connected to store API</span><div className="ad-admin-avatar" title="Administrator">{(user.name || user.login || user.email || 'A')[0].toUpperCase()}</div></div></header>
      <main className="ad-main">
        <div className="ad-page-intro"><div><p className="ad-eyebrow">STORE MANAGEMENT <span>•</span> {tab.toUpperCase()}</p><h1><PageIcon size={30} />{names[tab] || tab}</h1><p>{({ Overview: 'A clear view of everything happening at your jewellery store.', Products: 'Curate the collections customers discover on the website and mobile app.', Rates: 'Publish live store gold and silver prices from one place.', Categories: 'Keep jewellery and coin collections beautifully organised.', Customers: 'View customer records from your existing backend.', KYC: 'Review identity documents securely and record manual decisions.', 'Gold Buys': 'Verify purchase payments and record real metal allocations.', Sales: 'Review sale requests and record completed bank payouts.', Ledger: 'Track transaction records and changes.', Enquiries: 'Stay on top of incoming customer enquiries.', Settings: 'Keep your store information accurate on both platforms.', Audit: 'Browse the activity recorded by your existing backend.' })[tab]}</p></div><div className="ad-heading-actions"><button className="ad-button ad-outline" disabled={loading || busy} onClick={load}><RefreshCw size={16} className={loading ? 'ad-spin' : ''} /> Refresh</button>{fields[tab] && tab !== 'Settings' && tab !== 'Rates' && <button className="ad-button ad-primary" onClick={() => { setEditing(null); setForm(defaultForm(tab)); setFormOpen(v => !v); }}><span className="ad-add-plus">＋</span>{formOpen ? 'Close form' : `Add ${tab === 'Products' ? 'product' : 'category'}`}</button>}</div></div>
        <Notice onClose={() => setError('')}>{error}</Notice><Notice type="success" onClose={() => setNotice('')}>{notice}</Notice>

        {tab === 'Overview' && <>
          <div className="ad-welcome-banner"><div className="ad-welcome-copy"><span className="ad-banner-label"><Sparkles size={14} /> YOUR STORE AT A GLANCE</span><h2>Welcome to your<br /><em>business dashboard.</em></h2><p>Manage your inventory, approvals and pricing from the same platform your customers use.</p><button type="button" onClick={() => go('Products')} className="ad-banner-action">Manage products <ArrowRight size={17} /></button></div><div className="ad-banner-art" aria-hidden="true"><span className="ad-art-ring ad-art-ring-1" /><span className="ad-art-ring ad-art-ring-2" /><span className="ad-art-diamond">✧</span><span className="ad-art-spark">✦</span></div></div>
          <div className="ad-section-label"><h2>Business snapshot</h2><span>Live values from the backend</span></div>
          <div className="ad-metric-grid">{data && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length ? Object.entries(data).map(([key, value], index) => {
            const Icon = [ShoppingBag, Users, Wallet, Activity, BadgeCheck, Coins][index % 6];
            return <article className="ad-metric" key={key}><div className={`ad-metric-icon ad-metric-icon-${index % 4}`}><Icon size={20} /></div><small>{formatLabel(key)}</small><strong>{typeof value === 'number' ? value.toLocaleString('en-IN') : String(value ?? '—')}</strong><span>From current store data <ArrowUpRight size={14} /></span></article>;
          }) : <div className="ad-empty-metrics">{loading ? 'Loading business metrics…' : 'No dashboard metrics were returned by the backend.'}</div>}</div>
          <div className="ad-section-label ad-shortcuts-heading"><h2>Quick actions</h2><span>Everything important, one click away</span></div><div className="ad-quick-grid">{[['Products', Package, 'Manage your catalogue', 'Add and edit jewellery, coins and stock.'], ['Rates', TrendingUp, 'Update store rates', 'Publish current gold and silver rates.'], ['KYC', ClipboardCheck, 'Review KYC', 'Process identity document requests.'], ['Sales', Wallet, 'Review payouts', 'Track approved sales and bank payouts.']].map(([target, Icon, title, desc]) => <button className="ad-quick-card" key={target} onClick={() => go(target)}><span><Icon size={22} /></span><strong>{title}</strong><small>{desc}</small><ArrowUpRight className="ad-quick-arrow" size={17} /></button>)}</div>
          <div className="ad-info-panel"><ShieldCheck size={23} /><div><strong>One backend. Two experiences.</strong><p>Changes saved in this dashboard are made in the existing store backend. The customer website and mobile app read the same inventory and store rates.</p></div></div>
        </>}

        {tab === 'Rates' && <div className="ad-rate-summary"><div className="ad-rate-title"><p className="ad-eyebrow">CURRENT RATE BOARD</p><h2>Gold & silver, in sync.</h2><p>Only published store rates are used here. No sample prices.</p></div><div className="ad-rate-tiles">{['Gold', 'Silver'].map(m => { const item = rows.find(r => r.metal === m); return <div className={`ad-rate-tile ${m.toLowerCase()}`} key={m}><span>{m === 'Gold' ? <Coins size={21} /> : <Gem size={21} />} {m}</span><strong>{item?.buyPaise != null ? inrPaise(item.buyPaise) : 'Not published'}</strong><small>Per gram · current store rate</small></div>; })}</div></div>}

        {fields[tab] && formOpen && <section className="ad-panel ad-edit-panel"><div className="ad-panel-heading"><div><p className="ad-eyebrow">{editing ? 'EDIT EXISTING' : tab === 'Rates' ? 'RATE MANAGEMENT' : 'STORE INFORMATION'}</p><h2>{editing ? `Edit ${tab.slice(0, -1).toLowerCase()}` : tab === 'Settings' ? 'Store details' : tab === 'Rates' ? 'Publish a new store rate' : `Add ${tab.slice(0, -1).toLowerCase()}`}</h2><p>{tab === 'Rates' ? 'The same published price is used by the existing backend for buy, sell and valuation. Previously accepted trades keep their original amounts.' : tab === 'Products' ? 'Your changes will appear in both the website and mobile app.' : 'Edit the fields below and save changes to the store.'}</p></div>{tab !== 'Settings' && tab !== 'Rates' && <button aria-label="Close form" className="ad-icon-btn" onClick={() => { setFormOpen(false); setEditing(null); }}><X size={18} /></button>}</div>
          <form onSubmit={save}><div className="ad-form-grid">{fields[tab].map(field => <label key={field.key} className={`${field.wide ? 'ad-field-wide' : ''} ${field.type === 'checkbox' ? 'ad-check-field' : ''}`}>
            {field.type === 'checkbox' ? <><input type="checkbox" checked={!!form[field.key]} onChange={e => setField(field.key, e.target.checked)} /><span>{field.label}</span></> : <><span>{field.label}</span>{field.type === 'textarea' ? <textarea rows={4} value={form[field.key] ?? ''} onChange={e => setField(field.key, e.target.value)} /> : field.options || field.category ? <select aria-label={field.label} required={field.category||field.required} value={form[field.key] ?? ''} onChange={e => setField(field.key, e.target.value)}>{field.category ? <><option value="">Choose category</option>{categories.filter(c => c.metal === form.metal).map(c => <option key={c.id} value={c.id}>{c.name}{c.active ? '' : ' (hidden)'}</option>)}</> : field.options.map(opt => <option key={opt} value={opt}>{opt||'Choose audience'}</option>)}</select> : <input type={field.type || 'text'} step={field.type === 'number' ? field.key === 'coinWeight' ? '0.001' : field.key === 'stock' ? '1' : '0.01' : undefined} min={field.type === 'number' ? ['latitude', 'longitude'].includes(field.key) ? -180 : 0 : undefined} required={!!field.required} value={form[field.key] ?? ''} onChange={e => setField(field.key, e.target.value)} />}</>}
          </label>)}</div>
            {tab === 'Products' && <div className="ad-upload-area"><ImagePlus size={22} /><div><strong>Upload a product image</strong><span>JPEG, PNG or WebP · Maximum 5 MB</span></div><input type="file" aria-label="Upload product image" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void run(async () => { setField('image', await adminUploadImage(file)); setNotice('Image uploaded. Save the product to apply it.'); }); e.target.value = ''; }} /></div>}
            {tab === 'Products' && <p className="ad-form-tip"><ShieldCheck size={17} /> Jewellery estimates remain internal; coin prices may appear in the customer catalogue.</p>}
            <div className="ad-form-actions"><button type="submit" className="ad-button ad-primary" disabled={busy}>{busy ? <LoaderCircle className="ad-spin" size={17} /> : <Check size={17} />} {tab === 'Rates' ? 'Publish store rate' : 'Save changes'}</button>{editing && <button type="button" className="ad-button ad-outline" onClick={() => { setEditing(null); setForm(defaultForm(tab)); }}>Cancel edit</button>}</div></form>
        </section>}

        {tab === 'KYC' && <div className="ad-info-panel"><ShieldCheck size={22} /><div><strong>Private document verification</strong><p>View PAN evidence only through a secure admin session. Approval records manual review, not third-party identity verification. A valid submission version is required.</p></div></div>}
        {['Overview', 'Gold Buys', 'Sales', 'Ledger'].includes(tab) && <div className="ad-metal-filter"><span>Metal view</span><div className="ad-metal-segment">{['Gold', 'Silver'].map(m => <button type="button" key={m} className={metal === m ? 'selected' : ''} onClick={() => setMetal(m)}>{m}</button>)}</div></div>}
        {tab !== 'Overview' && tab !== 'Settings' && tab !== 'Rates' && <section className="ad-panel ad-list-panel"><div className="ad-list-head"><div><p className="ad-eyebrow">ALL RECORDS</p><h2>{names[tab] || tab}<span className="ad-record-count">{visibleRows.length}</span></h2></div><div className="ad-list-tools"><label className="ad-table-search"><Search size={16} /><input placeholder="Search records…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search records" /></label>{statuses.length > 0 && <label className="ad-status-filter"><ListFilter size={16} /><select aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="All">All statuses</option>{statuses.map(status => <option key={status} value={String(status).toUpperCase()}>{status}</option>)}</select></label>}</div></div>
          {tab === 'Products' && (
            <ProductFilterBar
              filters={productFilters}
              onChange={setProductFilter}
              onReset={resetProductFilters}
              categories={categories}
              shown={visibleRows.length}
              total={rows.length}
              active={productFiltersActive}
            />
          )}
          <div className="ad-table-scroll">{loading && !data ? <div className="ad-empty"><LoaderCircle className="ad-spin" size={24} /> Loading {tab.toLowerCase()}…</div> : visibleRows.length ? <table className="ad-table"><thead><tr>{tab === 'Products' && <th>PHOTO</th>}{keys.map(key => <th key={key}>{formatLabel(key).toUpperCase()}</th>)}<th className="ad-table-actions">ACTIONS</th></tr></thead><tbody>{visibleRows.map((row, index) => <tr key={row.id || index}>{tab === 'Products' && <td><div className="ad-product-image">{row.image ? <img src={productImage(row)} alt="" loading="lazy" /> : <Gem size={20} />}</div></td>}{keys.map(key => <td key={key}>{key === 'status' ? <Status status={row[key]} /> : <span className={key === 'name' ? 'ad-item-name' : ''}>{readableValue(key, row[key])}</span>}</td>)}<td><div className="ad-row-actions">{tab === 'KYC' && <button className="ad-mini-button" onClick={() => viewKyc(row.id)} disabled={busy}>Review</button>}{fields[tab] && tab !== 'Rates' && <button className="ad-mini-button" onClick={() => edit(row)} disabled={busy}>Edit</button>}{['Gold Buys', 'Sales'].includes(tab) && row.status === 'PENDING' && <><button className="ad-mini-button ad-mini-approve" disabled={busy} onClick={() => beginDecision(row, 'APPROVE')}>Approve</button><button className="ad-mini-button ad-mini-reject" disabled={busy} onClick={() => beginDecision(row, 'REJECT')}>Reject</button></>}{tab === 'Sales' && row.status === 'APPROVED' && <button className="ad-mini-button ad-mini-approve" disabled={busy} onClick={() => beginDecision(row, 'PAID')}>Mark paid</button>}{tab === 'Sales' && <button className="ad-mini-button" disabled={busy} onClick={()=>void viewBank(row)}>Bank details</button>}{tab !== 'KYC' && <button className="ad-mini-button" onClick={() => setDetails(row)}>Details</button>}</div></td></tr>)}</tbody></table> : <div className="ad-empty"><div><Package size={25} /></div><strong>{search || statusFilter !== 'All' || productFiltersActive ? 'No matching records' : 'Nothing here yet'}</strong><p>{search || statusFilter !== 'All' || productFiltersActive ? 'Try a different search or filter, or clear all product filters.' : 'Records will appear when they are available from your existing backend.'}</p></div>}</div></section>}
        {tab === 'Rates' && <section className="ad-panel ad-list-panel"><div className="ad-list-head"><div><p className="ad-eyebrow">PUBLISHED RATE HISTORY</p><h2>Store rate records</h2></div></div>{rows.length ? <div className="ad-table-scroll"><table className="ad-table"><thead><tr>{keys.map(k => <th key={k}>{formatLabel(k).toUpperCase()}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={row.id || i}>{keys.map(k => <td key={k}>{readableValue(k, row[k])}</td>)}</tr>)}</tbody></table></div> : <div className="ad-empty">No rates returned from the backend yet.</div>}</section>}
        {tab === 'Settings' && <div className="ad-info-panel"><Store size={22} /><div><strong>Keep your public details up to date</strong><p>Information saved here is consumed by the public storefront and the mobile app from the same existing backend.</p></div></div>}
      </main>
    </div>

    {bankDetails && <Dialog title="Payout bank details" subtitle={bankDetails.customer||'Customer'} onClose={()=>setBankDetails(null)} wide><dl className="ad-detail-grid">{[['Bank name',bankDetails.bankName],['Account holder',bankDetails.accountHolderName],['Account number',bankDetails.accountNumber],['IFSC',bankDetails.ifsc]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'Not supplied on this older request'}</dd></div>)}</dl>{!bankDetails.accountNumber&&<p>{bankDetails.payoutDetails}</p>}<p className="ad-form-tip">Private bank details. Access is recorded in the audit log.</p><button className="ad-button ad-outline" onClick={()=>setBankDetails(null)}>Close</button></Dialog>}
    {details && <Dialog title="Record details" subtitle="Stored data from your backend" onClose={() => setDetails(null)} wide><dl className="ad-detail-grid">{Object.entries(details).filter(([key]) => !hiddenColumn(key) || key === 'payoutDetails').map(([key, val]) => <div key={key}><dt>{formatLabel(key)}</dt><dd>{typeof val === 'object' ? JSON.stringify(val) : readableValue(key, val)}</dd></div>)}</dl><button className="ad-button ad-outline" onClick={() => setDetails(null)}>Close</button></Dialog>}
    {decision && <Dialog title={`${decision.action === 'PAID' ? 'Mark' : decision.action === 'APPROVE' ? 'Approve' : 'Reject'} ${decision.tab === 'KYC' ? 'manual KYC' : decision.tab === 'Sales' ? 'metal sale' : 'metal purchase'}`} subtitle="This action updates customer records on the existing backend." onClose={() => !busy && setDecision(null)}>
      <Notice>{error}</Notice>
      <form onSubmit={submitDecision} className="ad-decision-form">
        {decision.tab === 'Gold Buys' && <div className="ad-decision-summary"><strong>{decision.customerName || 'Customer'}</strong><span>{decision.metal} · {decision.grams == null ? '—' : `${(Number(decision.grams) / 1000000).toFixed(6)} g`} · {inrPaise(decision.amountPaise)}{decision.legacy ? ' · Legacy payment' : ''}</span></div>}
        <p className="ad-decision-warning">{decision.tab === 'Gold Buys' && decision.action === 'APPROVE' ? 'Confirm the bank payment AND actual metal allocation before approval.' : decision.action === 'PAID' ? 'Confirm the bank payout has reached the customer.' : decision.tab === 'KYC' ? 'Confirm this is a manual review of the latest submission.' : 'This decision is recorded against the customer.'}</p>
        {((decision.tab === 'Gold Buys' && decision.action === 'APPROVE') || decision.action === 'PAID') && <label>{decision.action === 'PAID' ? 'Bank payout reference' : 'Metal allocation reference'}<input required minLength={3} value={reference} onChange={e => setReference(e.target.value)} placeholder="Reference from actual records" /></label>}
        <label>Verification / rejection note<textarea required minLength={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Reason or verification evidence" /></label>
        <div className="ad-dialog-actions"><button className="ad-button ad-primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Confirm decision'}</button><button className="ad-button ad-outline" type="button" onClick={() => setDecision(null)}>Cancel</button></div>
      </form>
    </Dialog>}
    {kycDetail && <Dialog title="Manual KYC review" subtitle={`Status: ${kycDetail.status || '—'} · Submitted: ${kycDetail.submittedAt ? new Date(kycDetail.submittedAt).toLocaleString('en-IN') : '—'}`} onClose={() => { setKycDetail(null); clearKycDocument(); }} wide>
      <Notice>{error}</Notice>
      <div className="ad-detail-grid">{Object.entries(kycDetail.profile || {}).map(([key, value]) => <div key={key}><dt>{formatLabel(key)}</dt><dd>{/(pan|aadhaar|aadhar|idnumber)/i.test(key) ? `•••• ${String(value ?? '').slice(-4)}` : String(value ?? '—')}</dd></div>)}</div>
      <div className="ad-kyc-document"><button className="ad-button ad-outline" onClick={openKycDocument} disabled={busy}><ShieldCheck size={17} /> Open private PAN document</button>{kycDocument && (kycDocument.type === 'application/pdf' ? <iframe title="Private PAN document" src={kycDocument.url} /> : <img alt="Private PAN evidence" src={kycDocument.url} />)}</div>
      {kycDetail.status === 'PENDING' && <div className="ad-dialog-actions"><button className="ad-button ad-primary" disabled={!kycDocument || busy || !Number.isSafeInteger(Number(kycDetail.version)) || Number(kycDetail.version) < 1} onClick={() => reviewKyc('APPROVE')}>Approve review</button><button className="ad-button ad-outline" disabled={busy} onClick={() => reviewKyc('REJECT')}>Reject with reason</button></div>}
    </Dialog>}
  </div>;
}
