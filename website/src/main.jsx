import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Providers } from './context';
import { Shell } from './components';
import { HomePage, ShopPage, CoinsPage, ProductPage, CartPage, WishlistPage, StorePage } from './pages/ShopPages';
import { CalculatorPage, RatesPage } from './pages/ToolsPages';
import { AuthPage, ProfilePage } from './pages/AccountPages';
import { SipPage, KycPage } from './pages/SipPages';
import './styles.css';
function App() {
    return <Providers><BrowserRouter><Shell><Routes>
  <Route path="/" element={<HomePage />}/><Route path="/shop" element={<ShopPage />}/>
  <Route path="/coins/:metal" element={<CoinsPage />}/><Route path="/product/:id" element={<ProductPage />}/>
  <Route path="/cart" element={<CartPage />}/><Route path="/wishlist" element={<WishlistPage />}/>
  <Route path="/rates" element={<RatesPage />}/><Route path="/calculator" element={<CalculatorPage />}/>
  <Route path="/sip" element={<SipPage />}/><Route path="/kyc" element={<KycPage />}/>
  <Route path="/store" element={<StorePage />}/><Route path="/login" element={<AuthPage />}/>
  <Route path="/register" element={<AuthPage register/>}/><Route path="/profile" element={<ProfilePage />}/>
  <Route path="*" element={<div className="container content-wrap not-found"><h1>Page Not Found</h1><p>We couldn't find this page.</p><a className="button button-dark" href="/">Back to Home</a></div>}/>
    </Routes></Shell></BrowserRouter></Providers>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
