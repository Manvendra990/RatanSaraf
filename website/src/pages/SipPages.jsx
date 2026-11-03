import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Coins, FileCheck2, Gem, History, PlusCircle, RefreshCcw, ShieldCheck, Wallet } from 'lucide-react';
import { api } from '../api';
import { grams, paise } from '../data';
import { useAuth, useToast } from '../context';
import { PageBanner } from '../components';
const TABS = ['Dashboard', 'KYC', 'Start SIP', 'Payment', 'Sell Gold', 'History'];
const toDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : '—';
export function SipPage() {
    const { user, ready } = useAuth(), { notify } = useToast(), nav = useNavigate();
    const [tab, setTab] = useState('Dashboard'), [data, setData] = useState(null), [plans, setPlans] = useState([]), [quotes, setQuotes] = useState([]), [store, setStore] = useState(null), [busy, setBusy] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState('');
    const [planId, setPlanId] = useState(''), [amount, setAmount] = useState('1000'), [subscriptionId, setSubscriptionId] = useState(''), [reference, setReference] = useState(''), [sellGrams, setSellGrams] = useState(''), [payout, setPayout] = useState('');
    const refresh = useCallback(async () => {
        if (!user)
            return; setLoading(true); try {
                const [dashboard, p, r, s] = await Promise.all([api('/sip/dashboard'), api('/sip/plans'), api('/sip/rates'), api('/store')]);
                setData(dashboard);
                setPlans(p);
                setQuotes(r);
                setStore(s);
                setError('');
            }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load Gold SIP account.');
        }
        finally {
            setLoading(false);
        }
    }, [user?.id]);
    useEffect(() => { void refresh(); }, [refresh]);
    const act = async (fn) => {
        if (busy)
            return; setBusy(true); setError(''); try {
                await fn();
                notify('Request submitted successfully.', 'success');
                await refresh();
            }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Request failed.');
        }
        finally {
            setBusy(false);
        }
    };
    if (!ready)
        return <div className="container content-wrap">Loading…</div>;
    if (!user)
        return <><PageBanner eyebrow="A FUTURE IN GOLD" title="Gold SIP Yojana" subtitle="Set a plan. Build a habit. Follow your gold balance." /><div className="container content-wrap sip-guest"><div className="sip-guest-icon"><Gem size={54} /></div><h2>Your gold savings, all in one place.</h2><p>Sign in to complete KYC, explore plans and manage manual purchases and sales. Gold is credited only after store verification and actual allocation.</p><Link to="/login" className="button button-dark">Sign in to Gold SIP <ArrowRight size={16} /></Link><small>No auto-debit. No deposits are taken by this website directly.</small></div></>;
    const gold = quotes.find(q => q.metal === 'Gold'), kycOk = data?.kyc?.status === 'VERIFIED' || data?.manualKyc?.status === 'APPROVED';
    const chosen = data?.subscriptions?.find(s => s.id === subscriptionId);
    const quoteAge = gold ? Date.now() - Date.parse(gold.createdAt) : Infinity;
    const purchaseQuoteFresh = Boolean(gold && Number.isFinite(quoteAge) && quoteAge >= 0 && quoteAge < 15 * 60 * 1000);
    const saleQuoteFresh = Boolean(gold && Number.isFinite(quoteAge) && quoteAge >= 0 && quoteAge < 5 * 60 * 1000);
    const quoteText = gold ? `Store quote · Buy ${paise(gold.buyPaise)}/g · Sell ${paise(gold.sellPaise)}/g · ${gold.source} · ${new Date(gold.createdAt).toLocaleString('en-IN')}` : 'The store has not published a Gold SIP trade quote. Contact the store.';
    const action = (label, handler, disabled = false) => <button type="button" disabled={busy || disabled} className="button button-dark" onClick={handler}>{busy ? 'Please wait…' : label} <ArrowRight size={16} /></button>;
    return <><PageBanner eyebrow="YOUR GOLD JOURNEY" title="Gold SIP Yojana" subtitle="Manual payments · Gold credited only after verification and allocation." /><div className="container content-wrap sip-wrap"><div className="sip-head"><div><span className="eyebrow">YOUR SAVINGS HUB</span><h2>Welcome, {user.name.split(' ')[0]}.</h2></div><button className="button button-outline" disabled={busy || loading} onClick={() => void refresh()}><RefreshCcw size={16} className={loading ? 'spin' : ''} /> Refresh Records</button></div>{error && <div className="form-error" role="alert">{error}</div>}<div className="sip-tab-bar" role="tablist" aria-label="Gold SIP sections">{TABS.map((t, i) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{[<Wallet />, <ShieldCheck />, <PlusCircle />, <Coins />, <Gem />, <History />][i]}{t}</button>)}</div>
        {tab === 'Dashboard' && <><div className="sip-dashboard-grid"><div className="sip-balance"><span>YOUR TOTAL GOLD BALANCE</span><h2>{data?.balance || '0.000000'} <small>grams</small></h2><div><span>Available <strong>{data?.available || '0.000000'}g</strong></span><span>Reserved <strong>{data?.reserved || '0.000000'}g</strong></span></div></div><div className="sip-balance-summary panel"><span className="eyebrow">PAYMENT SUMMARY</span><h3>{paise((data?.payments || []).filter(p => p.status === 'APPROVED').reduce((n, p) => n + Number(p.amountPaise), 0))}</h3><p>Confirmed payments</p><div><CheckCircle2 size={17} /> Only approved payments count toward your balance.</div></div></div><p className="sip-quote">{quoteText}</p><div className="sip-section-title"><h3>My SIP Plans</h3><button className="text-link" onClick={() => setTab('Start SIP')}>New Plan <ArrowRight size={16} /></button></div>{data?.subscriptions?.length ? data.subscriptions.map(sub => <div className="sip-plan-row panel" key={sub.id}><div><span className="status-tag">{sub.status}</span><h4>{sub.name}</h4><p>{paise(sub.amountPaise)} every {sub.months} month(s) · Next due: {toDate(sub.nextDue)}</p><small>{sub.paidCount} confirmed payments · Plan ID: {sub.id}</small></div>{sub.status !== 'CANCELLED' && <div><button className="button button-outline" disabled={busy} onClick={() => void act(async () => { await api(`/sip/subscriptions/${sub.id}`, 'PUT', { status: sub.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }); })}>{sub.status === 'ACTIVE' ? 'Pause' : 'Resume'}</button><button className="simple-danger" disabled={busy} onClick={() => {
            if (window.confirm('Cancel this plan? Your existing gold and payment records remain available.'))
                void act(async () => { await api(`/sip/subscriptions/${sub.id}`, 'PUT', { status: 'CANCELLED' }); });
        }}>Cancel</button></div>}</div>) : <div className="sip-empty panel"><Gem size={36} /><h3>No SIP plans yet</h3><p>Complete your KYC and choose a plan to get started.</p><button className="button button-dark" onClick={() => setTab(kycOk ? 'Start SIP' : 'KYC')}>Get Started <ArrowRight size={16} /></button></div>}</>}
        {tab === 'KYC' && <section className="sip-tab-panel panel"><div className="panel-heading"><span className="panel-heading-icon"><FileCheck2 size={22} /></span><div><h3>KYC Review</h3><p>Personal details and PAN verification by the store admin.</p></div></div><div className="kyc-status"><span>Current Status</span><strong>{data?.manualKyc?.status === 'APPROVED' ? 'Manually Approved' : data?.manualKyc?.status === 'PENDING' ? 'Awaiting Admin Review' : data?.manualKyc?.status === 'REJECTED' ? 'Rejected — Resubmit' : data?.kyc?.status === 'VERIFIED' ? 'Provider Verified' : 'Not Submitted'}</strong></div>{data?.manualKyc?.note && <p className="info-line">Admin note: {data.manualKyc.note}</p>}<p className="info-line">Upload your PAN details for manual review. This is not real-time Aadhaar or PAN API verification.</p>{!kycOk && data?.manualKyc?.status !== 'PENDING' && <Link to="/kyc" className="button button-dark">{data?.manualKyc?.status === 'REJECTED' ? 'Correct & Resubmit KYC' : 'Enter KYC Details'} <ArrowRight size={16} /></Link>}<button className="button button-outline" onClick={() => void refresh()} disabled={loading}>Refresh Review Status</button></section>}
        {tab === 'Start SIP' && <section className="sip-tab-panel panel"><div className="panel-heading"><span className="panel-heading-icon"><PlusCircle size={22} /></span><div><h3>Choose Your Plan</h3><p>Create a plan for manual instalments. No automatic debit.</p></div></div>{!kycOk && <div className="form-error">Complete KYC verification before starting a SIP. <button className="text-link" onClick={() => setTab('KYC')}>Go to KYC</button></div>}<div className="sip-plan-options">{plans.map(plan => <button key={plan.id} className={`sip-option ${planId === plan.id ? 'selected' : ''}`} onClick={() => setPlanId(plan.id)}><span>{plan.name}</span><strong>Minimum {paise(plan.minPaise)}</strong><small>Every {plan.months} month(s)</small></button>)}{!plans.length && <p>No plans are available. Contact the store.</p>}</div><label className="form-field"><span>Instalment Amount (₹)</span><input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="1" step="0.01" /></label><p className="info-line">Payment amount converts to gold using an accepted store quote after payment approval. Plan frequency is only a reminder schedule.</p>{action('Create SIP', () => void act(async () => {
            if (!kycOk)
                throw new Error('Complete KYC first.'); if (!planId)
                throw new Error('Select a plan.'); if (!Number.isFinite(Number(amount)) || Number(amount) <= 0)
                throw new Error('Enter a valid amount.'); const result = await api('/sip/subscriptions', 'POST', { planId, amount }); setSubscriptionId(result.id); setTab('Payment');
        }), !kycOk || !plans.length)}</section>}
        {tab === 'Payment' && <section className="sip-tab-panel panel"><div className="panel-heading"><span className="panel-heading-icon"><Wallet size={22} /></span><div><h3>Manual Payment</h3><p>Submit a bank/UPI transaction reference for admin verification.</p></div></div><div className="payment-instructions">{store?.paymentInstructions || 'The store has not published payment instructions. Please contact the showroom.'}</div>{!store?.paymentsEnabled && <div className="form-error">Manual payments are not enabled by the store. Do not transfer funds until the store confirms the details.</div>}<label className="form-field"><span>Active SIP Plan</span><select value={subscriptionId} onChange={e => setSubscriptionId(e.target.value)}><option value="">Select your plan</option>{data?.subscriptions?.filter(s => s.status === 'ACTIVE').map(s => <option key={s.id} value={s.id}>{s.name} · {paise(s.amountPaise)} · {s.id.slice(0, 8)}</option>)}</select></label><p className="sip-quote">{quoteText}{!purchaseQuoteFresh && <><br />Refresh the quote before submitting a payment (15-minute limit).</>}</p>{chosen && gold && <div className="amount-estimate">Indicative gold credit: <strong>{(Math.floor(Number(chosen.amountPaise) * 1e6 / Number(gold.buyPaise)) / 1e6).toFixed(6)} g</strong></div>}<label className="form-field"><span>Bank / UPI Transaction Reference</span><input value={reference} onChange={e => setReference(e.target.value)} placeholder="Enter transaction ID after transfer" /></label>{action('Submit for Verification', () => {
            if (!gold || !chosen || !purchaseQuoteFresh) {
                setError('Select an active SIP and refresh a quote less than 15 minutes old.');
                return;
            } if (!reference.trim()) {
                setError('Enter the bank/UPI reference.');
                return;
            } if (!window.confirm(`Confirm you already paid ${paise(chosen.amountPaise)} and accept the Gold quote of ${paise(gold.buyPaise)}/gram? Your payment will be submitted for verification.`))
                return; void act(async () => { await api('/sip/payments', 'POST', { subscriptionId, rateId: gold.id, reference: reference.trim() }); setReference(''); setTab('History'); });
        }, !store?.paymentsEnabled || !purchaseQuoteFresh)}</section>}
        {tab === 'Sell Gold' && <section className="sip-tab-panel panel"><div className="panel-heading"><span className="panel-heading-icon"><Coins size={22} /></span><div><h3>Sell Available Gold</h3><p>Request a manual sale and payout to your account.</p></div></div><div className="amount-estimate">Available Balance: <strong>{data?.available || '0.000000'} g</strong></div><p className="sip-quote">{quoteText}{!saleQuoteFresh && <><br />Refresh the quote before requesting a sale (5-minute limit).</>}</p><div className="form-grid"><label className="form-field"><span>Gold to Sell (grams)</span><input min="0" step="any" type="number" value={sellGrams} onChange={e => setSellGrams(e.target.value)} /></label><label className="form-field"><span>Bank / IFSC / UPI Payout Details</span><input value={payout} onChange={e => setPayout(e.target.value)} placeholder="Your payout details" /></label></div>{gold && Number(sellGrams) > 0 && <div className="amount-estimate">Indicative payout: <strong>{paise(Math.floor(Number(sellGrams) * Number(gold.sellPaise)))}</strong></div>}<p className="info-line">Gold will be reserved until a sale is rejected or paid. Approved sale requests await manual bank payout.</p>{action('Request Gold Sale', () => {
            if (!gold || !saleQuoteFresh) {
                setError('Refresh the store quote. Sales require a quote less than 5 minutes old.');
                return;
            } if (!Number.isFinite(Number(sellGrams)) || Number(sellGrams) <= 0 || !payout.trim()) {
                setError('Enter a valid weight and payout details.');
                return;
            } if (!window.confirm(`Sell ${sellGrams}g at ${paise(gold.sellPaise)}/g? This will reserve the gold for a manual payout.`))
                return; void act(async () => { await api('/sip/sales', 'POST', { rateId: gold.id, grams: sellGrams, payoutDetails: payout }); setSellGrams(''); setPayout(''); setTab('History'); });
        }, !saleQuoteFresh)}</section>}
        {tab === 'History' && <section className="sip-tab-panel"><h3>Payment History</h3>{data?.payments?.length ? data.payments.map(p => <div className="sip-history-row" key={p.id}><div><strong>{paise(p.amountPaise)}</strong><span>{grams(p.grams)} · {p.reference}</span>{p.note && <small>{p.note}</small>}</div><div><span className="status-tag">{p.status}</span><small>{toDate(p.createdAt)}</small></div></div>) : <div className="sip-history-empty">No payments recorded.</div>}<h3>Sales & Payouts</h3>{data?.sales?.length ? data.sales.map(s => <div className="sip-history-row" key={s.id}><div><strong>{grams(s.grams)} · {paise(s.amountPaise)}</strong>{s.payoutReference && <span>Payout: {s.payoutReference}</span>}{s.note && <small>{s.note}</small>}</div><div><span className="status-tag">{s.status}</span><small>{toDate(s.createdAt)}</small></div></div>) : <div className="sip-history-empty">No sales recorded.</div>}<h3>Gold Ledger</h3>{data?.ledger?.length ? data.ledger.map(l => <div className="sip-history-row" key={l.id}><div><strong>{l.kind}</strong><span>{grams(l.grams)}</span></div><div><strong>{paise(l.amountPaise)}</strong><small>{toDate(l.createdAt)}</small></div></div>) : <div className="sip-history-empty">No gold ledger entries yet.</div>}</section>}
    </div></>;
}
const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];
export function KycPage() {
    const { user, ready } = useAuth(), nav = useNavigate(), { notify } = useToast();
    const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', country: 'India', phone: user?.phone || '', address: '', city: '', pincode: '', state: 'Madhya Pradesh', dob: '', spouseDob: '', anniversary: '', pan: '' });
    const [file, setFile] = useState(null), [consent, setConsent] = useState(false), [stage, setStage] = useState(1), [busy, setBusy] = useState(false), [error, setError] = useState('');
    useEffect(() => {
        if (user)
            setForm(f => ({ ...f, name: f.name || user.name, email: f.email || user.email, phone: f.phone || user.phone }));
    }, [user]);
    if (!ready)
        return <div className="container content-wrap">Loading…</div>;
    if (!user)
        return <Navigate to="/login" replace />;
    const change = (key, value) => setForm(f => ({ ...f, [key]: value }));
    const validate = () => {
        if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.state || !form.dob)
            throw new Error('Complete the required personal details.'); if (!/^[1-9][0-9]{5}$/.test(form.pincode))
            throw new Error('Enter a valid 6-digit Indian pincode.'); if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.pan))
            throw new Error('Enter a valid PAN number.'); if (!file)
            throw new Error('Upload a PAN document.'); if (file.size > 5 * 1024 * 1024)
            throw new Error('PAN document must be smaller than 5 MB.'); if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type))
            throw new Error('Upload a JPEG, PNG or PDF.');
    };
    const next = (e) => {
        e.preventDefault(); try {
            validate();
            setError('');
            setStage(2);
        }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Check your details.');
            }
    };
    const submit = async () => {
        try {
            validate();
            if (!consent)
                throw new Error('Consent to manual KYC review is required.');
            setBusy(true);
            setError('');
            const body = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (v)
                    body.append(k, v);
            });
            body.append('consent', 'true');
            body.append('document', file, file.name);
            await api('/manual-kyc/submit', 'POST', body);
            notify('KYC submitted for store-admin review.', 'success');
            nav('/sip');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to submit KYC.');
        }
        finally {
            setBusy(false);
        }
    };
    const field = (key, label, required = false, type = 'text', readOnly = false) => <label className="form-field"><span>{label}{required ? ' *' : ''}</span><input type={type} required={required} readOnly={readOnly} value={form[key]} maxLength={key === 'pan' ? 10 : key === 'pincode' ? 6 : 500} onChange={e => change(key, key === 'pan' ? e.target.value.toUpperCase() : e.target.value)} /></label>;
    return <><PageBanner eyebrow="GOLD SIP · STEP 1" title="Personal Details & KYC" subtitle="Complete your details for manual store-admin review." /><div className="container kyc-wrap content-wrap"><div className="kyc-progress"><span className={stage === 1 ? 'active' : ''}>01 · Personal Details</span><span className={stage === 2 ? 'active' : ''}>02 · Review & Consent</span></div><div className="panel kyc-panel"><div className="panel-heading"><span className="panel-heading-icon"><FileCheck2 size={22} /></span><div><h3>{stage === 1 ? 'Tell us about yourself' : 'Review your information'}</h3><p>Fields marked * are required. Documents are sent to the existing secure backend.</p></div></div>{error && <div role="alert" className="form-error">{error}</div>}{stage === 1 ? <form onSubmit={next}><div className="form-grid">{field('name', 'Full Name', true)}{field('email', 'Email', false, 'email')}{field('country', 'Country', true, 'text', true)}{field('phone', 'Mobile Number', true, 'tel', true)}</div>{field('address', 'Address', true)}<div className="form-grid">{field('city', 'City', true)}{field('pincode', 'Pincode', true)}</div><label className="form-field"><span>State *</span><select value={form.state} required onChange={e => change('state', e.target.value)}>{INDIAN_STATES.map(s => <option key={s}>{s}</option>)}</select></label><div className="form-grid">{field('dob', 'Date of Birth', true, 'date')}{field('spouseDob', 'Spouse Date of Birth', false, 'date')}{field('anniversary', 'Anniversary Date', false, 'date')}{field('pan', 'PAN Number', true)}</div><label className="form-field"><span>Upload PAN Card * (JPEG, PNG or PDF · max 5 MB)</span><input className="file-input" required={!file} type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} /></label><p className="info-line">Manual admin review only; submission does not verify PAN or Aadhaar with a government API.</p><button className="button button-dark">Review Details <ArrowRight size={16} /></button></form> : <><div className="kyc-review-grid">{Object.entries(form).filter(([, v]) => Boolean(v)).map(([key, value]) => <div key={key}><span>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</span><strong>{key === 'pan' ? '••••••' + value.slice(-4) : value}</strong></div>)}<div><span>PAN DOCUMENT</span><strong>{file?.name}</strong></div></div><label className="consent-checkbox"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>I consent to my personal details and PAN document being used for manual KYC verification by the jewellery showroom.</span></label><div className="form-actions"><button className="button button-outline" disabled={busy} onClick={() => setStage(1)}>Edit Details</button><button className="button button-dark" disabled={busy} onClick={() => void submit()}>{busy ? 'Submitting…' : 'Submit for Admin Review'} <ArrowRight size={16} /></button></div></>}</div></div></>;
}
