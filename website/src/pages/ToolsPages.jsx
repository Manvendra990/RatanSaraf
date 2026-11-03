import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, ArrowUpRight, Calculator, CheckCircle2, Gem, RefreshCcw, TrendingUp } from 'lucide-react';
import { loadHistory, loadLiveRates } from '../api';
import { calculateJewellery, inr, prettyTime } from '../data';
import { PageBanner } from '../components';
const PURITIES = [{ name: '22 KT (916)', value: 916 }, { name: '18 KT (750)', value: 750 }, { name: '14 KT (585)', value: 585 }, { name: '9 KT (375)', value: 375 }];
const INITIAL = { rate: '', weight: '', makingPercent: '', discountPercent: '', diamond: '', other: '', gstPercent: '3' };
export function CalculatorPage() {
    const [purity, setPurity] = useState(0), [fields, setFields] = useState({ ...INITIAL }), [result, setResult] = useState(null), [error, setError] = useState('');
    const update = (key, value) => { setFields(f => ({ ...f, [key]: value })); setResult(null); setError(''); };
    const calculate = (e) => { e.preventDefault(); try {
        if (Object.values(fields).some(v => v.trim() && !/^\d+(\.\d*)?$/.test(v.trim())))
            throw new Error('Only numbers are allowed; remove commas or currency symbols.');
        setResult(calculateJewellery(Object.fromEntries(Object.entries(fields).map(([key, val]) => [key, Number(val)]))));
        setError('');
    }
    catch (err) {
        setResult(null);
        setError(err instanceof Error ? err.message : 'Unable to calculate.');
    } };
    const field = (key, label, suffix) => <label className="form-field"><span>{label}</span><div className="input-suffix"><input type="number" min="0" step="any" value={fields[key]} placeholder="0.00" onChange={e => update(key, e.target.value)}/>{suffix && <em>{suffix}</em>}</div></label>;
    const rows = [['Gold Weight Amount', result?.gold || 0], ['Making Charges', result?.making || 0], ['Diamond Charges', result?.diamond || 0], ['Other Charges', result?.other || 0], ['Making Charges Discount', -(result?.discount || 0)], ['GST', result?.gst || 0]];
    return <><PageBanner eyebrow="KNOW BEFORE YOU BUY" title="Jewellery Rate Calculator" subtitle="A clear breakdown, every step of the way."/><div className="container content-wrap"><div className="calculator-intro"><span className="eyebrow">SIMPLE & TRANSPARENT</span><h2>Every detail <em>counts.</em></h2><p>Estimate the price of your gold jewellery with a complete breakdown of making charges, discounts and taxes.</p></div><div className="calculator-layout"><form className="calculator-form panel" onSubmit={calculate}><div className="panel-heading"><span className="panel-heading-icon"><Gem size={20}/></span><div><h3>Enter Jewellery Details</h3><p>Fill in the values to calculate your estimate.</p></div></div><label className="field-label">SELECT GOLD PURITY</label><div className="purity-grid">{PURITIES.map((item, i) => <button type="button" key={item.value} onClick={() => { setPurity(i); update('rate', ''); }} className={`purity-card ${i === purity ? 'active' : ''}`}><span className="radio-mark">{i === purity ? '●' : '○'}</span><strong>{item.name}</strong><small>GOLD</small></button>)}</div><p className="form-help">Enter the store's current rate for {PURITIES[purity].name}. Rates are entered manually, not assumed to be live.</p><div className="form-grid">{field('rate', 'Selected Purity Rate *', '₹/g')}{field('weight', 'Weight *', 'grams')}{field('makingPercent', 'Making Charges', '%')}{field('discountPercent', 'Making Discount', '%')}{field('diamond', 'Diamond Charges', '₹')}{field('other', 'Other Charges', '₹')}{field('gstPercent', 'GST Rate', '%')}</div>{error && <div role="alert" className="form-error">{error}</div>}<div className="form-actions"><button type="button" className="button button-outline" onClick={() => { setPurity(0); setFields({ ...INITIAL }); setResult(null); setError(''); }}>Reset</button><button type="submit" className="button button-dark">Calculate Estimate <ArrowRight size={17}/></button></div></form><aside className="calculator-result panel"><div className="result-top"><span className="eyebrow">YOUR ESTIMATE</span><div className="result-emblem"><Calculator size={24}/></div><h3>Cost Breakdown</h3><p>Estimated pricing for {result?.weight || 0} grams of {PURITIES[purity].name} gold</p></div><div className="result-lines">{rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value < 0 ? '− ' + inr(Math.abs(value), 2) : inr(value, 2)}</strong></div>)}</div><div className="result-total"><span>Estimated Payable Amount</span><strong>{inr(result?.total || 0, 2)}</strong><small>{result ? 'Based on your entered values' : 'Enter values and click Calculate'}</small></div><div className="result-note"><CheckCircle2 size={18}/><p>Discount applies to making charges. GST is calculated on gold, discounted making, diamond and other charges. This is only an estimate; confirm tax and invoice with the showroom.</p></div></aside></div></div></>;
}
function Chart({ points, metal }) {
    if (points.length < 2)
        return <div className="chart-empty">Not enough history to draw a price trend.</div>;
    const values = points.map(p => p.close), min = Math.min(...values), max = Math.max(...values), pad = (max - min) * .12 || Math.max(max * .02, 1), low = min - pad, high = max + pad;
    const coords = points.map((p, i) => `${35 + (i / (points.length - 1)) * 700},${275 - ((p.close - low) / (high - low)) * 230}`);
    const line = 'M' + coords.join(' L');
    const area = line + ' L735 275 L35 275 Z';
    return <div className="chart-box"><svg viewBox="0 0 770 315" preserveAspectRatio="none" role="img" aria-label={`${metal} historical daily spot closing prices in US dollars per gram`}>
 <defs><linearGradient id="areaFade" x1="0" x2="0" y1="0" y2="1"><stop stopColor={metal === 'Gold' ? '#c79c49' : '#8997ac'} stopOpacity=".28"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient></defs>
 {[0, 1, 2, 3].map(i => <g key={i}><line x1="35" y1={40 + i * 77} x2="735" y2={40 + i * 77} stroke="#e5ded6" strokeDasharray="4 6"/><text x="33" y={32 + i * 77} textAnchor="end" fontSize="9" fill="#8b7e74">{(high - (i * (high - low) / 3)).toFixed(0)}</text></g>)}
 <path d={area} fill="url(#areaFade)"/><path d={line} fill="none" stroke={metal === 'Gold' ? '#ba8c36' : '#8290a0'} strokeWidth="3.6" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
 <circle cx={coords[coords.length - 1].split(',')[0]} cy={coords[coords.length - 1].split(',')[1]} r="6" fill={metal === 'Gold' ? '#ba8c36' : '#8290a0'} stroke="#fff" strokeWidth="3"/>
 </svg><div className="chart-axis"><span>{new Date(points[0].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span><span>{new Date(points[Math.floor(points.length / 2)].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span><span>{new Date(points[points.length - 1].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></div></div>;
}
export function RatesPage() {
    const [metal, setMetal] = useState('Gold'), [days, setDays] = useState(30), [rates, setRates] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [history, setHistory] = useState([]), [chartLoading, setChartLoading] = useState(true), [chartError, setChartError] = useState(''), [retry, setRetry] = useState(0);
    const refresh = async () => { setLoading(true); setError(''); try {
        setRates(await loadLiveRates());
    }
    catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load quotes.');
    }
    finally {
        setLoading(false);
    } };
    useEffect(() => { void refresh(); const timer = setInterval(() => { if (document.visibilityState === 'visible')
        void refresh(); }, 60000); return () => clearInterval(timer); }, []);
    useEffect(() => { let active = true; setHistory([]); setChartLoading(true); setChartError(''); loadHistory(metal, days).then(p => { if (active)
        setHistory(p); }).catch(err => { if (active)
        setChartError(err instanceof Error ? err.message : 'Unable to fetch history.'); }).finally(() => { if (active)
        setChartLoading(false); }); return () => { active = false; }; }, [metal, days, retry]);
    const current = rates?.[metal], change = history.length > 1 ? (history[history.length - 1].close / history[0].close - 1) * 100 : null;
    return <><PageBanner eyebrow="STAY INFORMED" title="Live Metal Rates" subtitle="View provider quotes and international price trends."/><div className="container content-wrap"><div className="metal-switch"><button className={metal === 'Gold' ? 'active' : ''} onClick={() => setMetal('Gold')}><Gem size={18}/> Gold</button><button className={metal === 'Silver' ? 'active' : ''} onClick={() => setMetal('Silver')}><Gem size={18}/> Silver</button></div><div className="rates-grid"><div className="rate-major panel"><div className="rate-major-head"><span className="eyebrow">OROPOCKET · BUY RATE</span><TrendingUp size={25}/></div><p>Current {metal} Price</p><strong className="rate-big">{current ? inr(current.buy, 2) : '—'} <small>/ gram</small></strong>{current?.change24h != null && <div className={`rate-change ${current.change24h >= 0 ? 'positive' : 'negative'}`}>{current.change24h > 0 ? '+' : ''}{current.change24h.toFixed(2)}% buy rate / 24h</div>}<div className="rate-mini-stats"><div><span>Sell price / gram</span><strong>{current ? inr(current.sell, 2) : '—'}</strong></div><div><span>Buy including GST / gram</span><strong>{current ? inr(current.buyWithGst, 2) : '—'}</strong></div></div><div className="rate-bottom"><small>{rates ? `Updated ${prettyTime(rates.timestamp)}` : 'Waiting for provider quote'}</small><button onClick={() => void refresh()} disabled={loading}><RefreshCcw size={15} className={loading ? 'spin' : ''}/> Refresh</button></div>{error && <p className="form-error">{error}{current ? ' Last received quote is shown.' : ''}</p>}</div><div className="rate-explainer panel"><span className="eyebrow">ABOUT THESE RATES</span><h3>A little clarity goes a long way.</h3><p>Buy and sell quotes come directly from the external OroPocket provider. These may differ from jewellery showroom rates, which can include making charges and tax.</p><Link to="/calculator" className="text-link">Try Jewellery Calculator <ArrowUpRight size={18}/></Link><div className="rate-explainer-icon"><Gem size={62}/></div></div></div>
 <div className="history-card panel"><div className="history-head"><div><span className="eyebrow">THE BIGGER PICTURE</span><h2>{metal} International Trend</h2><p>Historical spot closing prices · USD per gram</p></div><div className="chart-ranges">{[7, 14, 30].map(d => <button key={d} onClick={() => setDays(d)} className={days === d ? 'active' : ''}>{d}D</button>)}</div></div>{chartLoading ? <div className="chart-empty"><Activity className="spin"/> Loading historical chart…</div> : chartError ? <div className="chart-empty"><p>{chartError}</p><button className="button button-outline" onClick={() => setRetry(r => r + 1)}>Retry Chart</button></div> : history.length < 2 ? <div className="chart-empty">Historical data is not available for this date range.</div> : <><div className="chart-metrics"><strong>${history.at(-1).close.toFixed(2)} <small>/gram</small></strong><span className={`rate-change ${(change || 0) >= 0 ? 'positive' : 'negative'}`}>{(change || 0) >= 0 ? '+' : ''}{change.toFixed(2)}% during selected period</span></div><Chart points={history} metal={metal}/><div className="history-foot"><span>High: ${Math.max(...history.map(p => p.high ?? p.close)).toFixed(2)}</span><span>Low: ${Math.min(...history.map(p => p.low ?? p.close)).toFixed(2)}</span><span>{history.length} daily observations</span></div></>}
 </div><p className="rate-fineprint">Source: OroPocket for live INR quotes; goldprice.dev for historic international USD spot prices. These feeds are not interchangeable. External APIs may be unavailable due to network, access plan or browser CORS restrictions; no replacement rates are invented.</p></div></>;
}
