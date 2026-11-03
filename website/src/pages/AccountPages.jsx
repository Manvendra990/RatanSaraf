import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Gem, LogOut, UserRound } from 'lucide-react';
import { useAuth, useShop, useToast } from '../context';
import { PageBanner } from '../components';
export function AuthPage({ register = false }) {
    const { user, login, register: join } = useAuth(), { notify } = useToast(), nav = useNavigate();
    const [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', login: '' });
    if (user)
        return <Navigate to="/profile" replace/>;
    const submit = async (e) => { e.preventDefault(); setBusy(true); setError(''); try {
        if (register) {
            if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || form.password.length < 8)
                throw new Error('Enter your details and a password of at least 8 characters.');
            await join({ name: form.name, phone: form.phone, email: form.email, password: form.password });
        }
        else {
            if (!form.login.trim() || !form.password)
                throw new Error('Enter your login and password.');
            await login(form.login, form.password);
        }
        notify(register ? 'Account created successfully.' : 'Welcome back!', 'success');
        nav('/profile');
    }
    catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to sign in.');
    }
    finally {
        setBusy(false);
    } };
    return <><PageBanner eyebrow="YOUR ACCOUNT" title={register ? 'Create an Account' : 'Welcome Back'} subtitle="Your collection, your savings, your story."/><div className="container auth-container"><div className="auth-intro"><div className="auth-jewel"><Gem size={78}/></div><span className="eyebrow light">YOUR RATAN LAL SARAF ACCOUNT</span><h2>Something beautiful<br />begins <em>here.</em></h2><p>Save your favourite pieces, keep a shopping bag, and manage your Gold SIP records with a single account.</p><div><span><CheckCircle2 size={16}/> Saved favourites and cart</span><span><CheckCircle2 size={16}/> Gold SIP record access</span><span><CheckCircle2 size={16}/> Manual KYC status tracking</span></div></div><form className="auth-form panel" onSubmit={submit}><h2>{register ? 'Join the Family' : 'Sign in'}</h2><p>{register ? 'Create an account to continue.' : 'Enter your email or mobile number and password.'}</p>{register && <><label className="form-field"><span>Full Name</span><input required autoComplete="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name"/></label><label className="form-field"><span>Mobile Number</span><input required inputMode="tel" autoComplete="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Mobile number"/></label><label className="form-field"><span>Email Address</span><input required type="email" autoComplete="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com"/></label></>}{!register && <label className="form-field"><span>Email or Mobile Number</span><input required autoComplete="username" value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} placeholder="Enter email or mobile"/></label>}<label className="form-field"><span>Password</span><input required type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : undefined} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Enter your password"/></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-dark auth-submit" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create Account' : 'Sign In'} <ArrowRight size={17}/></button><p className="auth-switch">{register ? 'Already have an account?' : 'New to Ratan Lal Saraf?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></p><Link to="/" className="guest-link">Continue browsing as a guest</Link></form></div></>;
}
export function ProfilePage() { const { user, ready, logout } = useAuth(), { cart, favorites } = useShop(), nav = useNavigate(), { notify } = useToast(); if (!ready)
    return <div className="container content-wrap">Loading account…</div>; if (!user)
    return <Navigate to="/login" replace/>; return <><PageBanner eyebrow="MY ACCOUNT" title="Your Profile" subtitle={`Welcome back, ${user.name}.`}/><div className="container content-wrap"><div className="profile-layout"><div className="panel profile-card"><div className="profile-avatar"><UserRound size={36}/></div><h2>{user.name}</h2><p>{user.email}</p><div className="profile-info"><div><span>Mobile</span><strong>{user.phone || 'Not provided'}</strong></div><div><span>Email</span><strong>{user.email}</strong></div></div><button type="button" className="button button-outline" onClick={async () => { await logout(); notify('Signed out.', 'success'); nav('/'); }}><LogOut size={17}/> Sign Out</button></div><div className="profile-links"><Link className="profile-link" to="/sip"><Gem /><span><strong>Gold SIP Yojana</strong><small>Plans, KYC and gold balance</small></span><ArrowRight /></Link><Link className="profile-link" to="/cart"><Gem /><span><strong>Shopping Bag</strong><small>{cart.reduce((n, x) => n + x.qty, 0)} items selected</small></span><ArrowRight /></Link><Link className="profile-link" to="/wishlist"><Gem /><span><strong>My Wishlist</strong><small>{favorites.length} saved pieces</small></span><ArrowRight /></Link></div></div></div></>; }
