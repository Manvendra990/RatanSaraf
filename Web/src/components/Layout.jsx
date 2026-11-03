import { Outlet, ScrollRestoration } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import FloatingContact from './FloatingContact';

export default function Layout() {
  return (
    <>
      <Header />
      <main id="main"><Outlet /></main>
      <Footer />
      <FloatingContact />
      <ScrollRestoration />
    </>
  );
}
