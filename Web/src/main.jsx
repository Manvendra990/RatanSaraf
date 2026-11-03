import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { ShopProvider } from './context/ShopContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Collection from './pages/Collection';
import Product from './pages/Product';
import Rates from './pages/Rates';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Account from './pages/Account';
import Store from './pages/Store';
import Admin from './admin/Admin';
import './styles.css';
function PublicSite() { return <StoreProvider><ShopProvider><AuthProvider><Layout/></AuthProvider></ShopProvider></StoreProvider>; }
const router = createBrowserRouter([
  { path: '/admin/*', element: <Admin/> },
  { path: '/', element: <PublicSite/>, children: [
  { index: true, element: <Home/> },
  { path: 'collection', element: <Collection/> },
  { path: 'coins', element: <Collection coinsOnly/> },
  { path: 'product/:id', element: <Product/> },
  { path: 'rates', element: <Rates/> },
  { path: 'cart', element: <Cart/> },
  { path: 'wishlist', element: <Wishlist/> },
  { path: 'account', element: <Account/> },
  { path: 'store', element: <Store/> },
  { path: '*', element: <div className="container section"><h1>Page not found</h1><a href="/">Return home →</a></div> },
]}]);
createRoot(document.getElementById('root')).render(<React.StrictMode><RouterProvider router={router}/></React.StrictMode>);
