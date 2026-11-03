import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, LogOut, ShoppingBag, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../api/client';
export default function Account() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [mode,setMode] = useState('login');
  const [form,setForm] = useState({ identifier:'',name:'',email:'',phone:'',password:'' });
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  const set=(key,value)=>setForm(f=>({...f,[key]:value}));
  const submit = async e => {
    e.preventDefault();setError('');setNotice('');setBusy(true);
    try {
      if (mode==='login') {await auth.login(form.identifier,form.password); navigate('/');}
      else { await registerUser({ name:form.name, email:form.email, phone:form.phone, password:form.password }); setMode('login');setNotice('Account created. Please sign in.'); }
    } catch(e) {setError(e.message);} finally {setBusy(false);}
  };
  return <><div className="page-heading compact-page-heading"><div className="container"><p className="eyebrow">WELCOME</p><h1>My <em>Account</em></h1></div></div><div className="container account-layout">{auth.loggedIn ? <div className="profile-panel"><div className="profile-icon"><UserRound size={35}/></div><p className="eyebrow">YOUR PROFILE</p><h2>Welcome{auth.user?.name ? `, ${auth.user.name}` : ' back'}.</h2><p>{auth.user?.email || auth.user?.phone || 'You are signed in to the store.'}</p><div className="account-shortcuts"><Link to="/wishlist"><Heart/>Wishlist <ArrowRight size={18}/></Link><Link to="/cart"><ShoppingBag/>Shopping Bag <ArrowRight size={18}/></Link></div><button onClick={()=>auth.logout()} className="btn btn-outline"><LogOut size={17}/> Sign Out</button></div> : <><div className="account-welcome"><span>✦</span><h2>Your jewellery journey, <em>made personal.</em></h2><p>Sign in with your existing store account. You can also continue browsing the collection as a guest.</p><Link to="/collection" className="text-arrow-link">Browse as a Guest <ArrowRight size={18}/></Link></div><form className="account-form" onSubmit={submit}><div className="account-toggle"><button type="button" className={mode==='login'?'active':''} onClick={()=>{setMode('login');setError('');}}>Sign In</button><button type="button" className={mode==='register'?'active':''} onClick={()=>{setMode('register');setError('');}}>Create Account</button></div><h3>{mode==='login'?'Welcome Back':'Join Our Collection'}</h3><p>{mode==='login'?'Sign in to continue with your store account.':'Register with the same store backend.'}</p>{mode==='register' && <><label>Full Name<input required autoComplete="name" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Your full name"/></label><label>Email Address<input required type="email" autoComplete="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="name@example.com"/></label><label>Mobile Number<input required autoComplete="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="10-digit mobile number"/></label></>}{mode==='login' && <label>Email or Mobile Number<input required autoComplete="username" value={form.identifier} onChange={e=>set('identifier',e.target.value)} placeholder="Your registered email or number"/></label>}<label>Password<input required minLength={mode==='register'?8:1} type="password" autoComplete={mode==='login'?'current-password':'new-password'} value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Enter password"/></label>{notice && <p className="success-note">{notice}</p>}{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" className="btn btn-primary full-width" disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign In':'Create Account'} <ArrowRight size={18}/></button><p className="account-disclaimer">Your existing backend’s authentication route must be configured in <code>.env</code>. No new accounts are stored by this website itself.</p></form></>}</div></>;
}
