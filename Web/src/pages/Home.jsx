import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Gem,
  HeartHandshake,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import { useStore } from '../context/StoreContext';

import {
  inr,
  isCoin,
  paiseToInr,
  readableTime,
} from '../utils/format';

import {
  ErrorNotice,
  ProductCard,
  SectionHeading,
} from '../components/UI';

import img1 from "../../public/img1.jpeg"

// Images stored in Vite public/ are used as URL paths, not JS imports.
// Add, remove, or reorder images here. Only list files that exist in public/.
const heroImages = [
  { src: '/img1.jpeg', alt: 'Ratan Lal Saraf jewellery collection one' },
  { src: '/img2.jpeg', alt: 'Ratan Lal Saraf jewellery collection two' },
  { src: '/img3.jpeg', alt: 'Ratan Lal Saraf jewellery collection three' },
];

export default function Home() {
  const {
    products,
    getRate,
    error,
    ratesError,
    refresh,
    loading,
  } = useStore();

  const [metal, setMetal] = useState('Gold');

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  // Change the hero jewellery image every five seconds.
  useEffect(() => {
    if (heroImages.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setCurrentHeroIndex((index) => (index + 1) % heroImages.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  // Automatically switch between Gold and Silver rates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetal((previous) =>
        previous === 'Gold' ? 'Silver' : 'Gold'
      );
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Current selected metal rate
  const rate = getRate(metal);

  // Featured jewellery
  const featured = [
    ...products.filter(
      (product) => !isCoin(product) && product.featured
    ),
    ...products.filter(
      (product) => !isCoin(product) && !product.featured
    ),
  ].slice(0, 4);

  // Gold and Silver coins
  const coinList = products.filter(isCoin).slice(0, 4);

  return (
    <>
      {/* ================= HERO SECTION ================= */}

      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="hero-eyebrow">
              <span />
              THE ART OF TIMELESS BEAUTY
            </p>

            <h1>
              A little <em>luxury,</em>
              <br />
              a lifetime of <em>love.</em>
            </h1>

            <p className="hero-subtitle">
              An exquisite collection of gold & silver jewellery,
              thoughtfully chosen to celebrate your most meaningful
              moments.
            </p>

            <div className="hero-buttons">
              <Link className="btn btn-gold" to="/collection">
                Explore Collection
                <ArrowUpRight size={18} />
              </Link>

              <Link className="btn btn-ghost-white" to="/store">
                Discover Our Store
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="hero-footer">
              <span className="hero-star">✶</span>
              <span>
                TRADITION · CRAFTSMANSHIP · ELEGANCE
              </span>
            </div>
          </div>

          <div className="hero-visual">
            {/* <div className="hero-image-backdrop" /> */}

            {/* Keep all slides in the same position for a smooth crossfade. */}
            {heroImages.map((image, index) => (
              <img
                key={image.src}
                src={image.src}
                alt={image.alt}
                className={`hero-slide-image ${index === currentHeroIndex ? 'is-active' : ''}`}
                aria-hidden={index !== currentHeroIndex}
                fetchPriority={index === 0 ? 'high' : 'auto'}
              />
            ))}

            <div className="hero-visual-tag">
              <span className="tag-star">✧</span>

              <span>
                Jewellery for
                <br />
                <strong>every celebration</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="hero-line" />
      </section>

      {/* ================= BENEFITS SECTION ================= */}

      <section className="benefit-strip">
        <div className="container benefit-inner">
          <div>
            <Gem size={26} />
            <span>
              Elegant Designs
              <small>Explore a curated collection</small>
            </span>
          </div>

          <div>
            <ShieldCheck size={25} />
            <span>
              Detailed Product Info
              <small>Purity & weight details</small>
            </span>
          </div>

          <div>
            <HeartHandshake size={26} />
            <span>
              Personal Assistance
              <small>Enquire with our store</small>
            </span>
          </div>

          <div>
            <Sparkles size={25} />
            <span>
              Meaningful Gifts
              <small>For all special occasions</small>
            </span>
          </div>
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}

      <section className="section section-categories container">
        <SectionHeading
          eyebrow="DISCOVER YOUR STYLE"
          title={
            <>
              Find something <em>extraordinary.</em>
            </>
          }
          description="Explore timeless pieces for every mood and milestone."
        />

        <div className="category-showcase">

          {/* Gold Jewellery */}
          <Link
            to="/collection?metal=Gold"
            className="category-tile category-gold"
          >
            <div className="category-art">
              <div className="category-jewellery-image">
                <img
                  src="/img2.jpeg"
                  alt="Ratan Lal Saraf Gold Jewellery Collection"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="category-text">
              <span>01 / THE CLASSICS</span>

              <h3>Gold Jewellery</h3>

              <p>Everyday elegance, forever treasured.</p>

              <span className="category-link">
                Explore Gold
                <ArrowRight size={18} />
              </span>
            </div>
          </Link>

          {/* Silver Jewellery */}
          <Link
            to="/collection?metal=Silver"
            className="category-tile category-silver"
          >
            <div className="category-art">
              <div className="category-jewellery-image">
                <img
                  src="/img3.jpeg"
                  alt="Ratan Lal Saraf Gold Jewellery Collection"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="category-text">
              <span>02 / THE MODERN EDIT</span>

              <h3>Silver Jewellery</h3>

              <p>A little shine for every moment.</p>

              <span className="category-link">
                Explore Silver
                <ArrowRight size={18} />
              </span>
            </div>
          </Link>

          {/* Coins */}
          <Link
            to="/coins"
            className="category-tile category-coins"
          >
            <div className="category-art">
              <div className="category-jewellery-image">
                <img
                  src="/img1.jpeg"
                  alt="Ratan Lal Saraf Gold Jewellery Collection"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="category-text">
              <span>03 / TIMELESS VALUE</span>

              <h3>Gold & Silver Coins</h3>

              <p>Thoughtful gifts, precious keepsakes.</p>

              <span className="category-link">
                Explore Coins
                <ArrowRight size={18} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ================= FEATURED PRODUCTS ================= */}

      <section className="section featured-bg">
        <div className="container">
          <SectionHeading
            eyebrow="HANDPICKED FOR YOU"
            title={
              <>
                Pieces worth <em>remembering.</em>
              </>
            }
            description="Discover the latest jewellery published by our store."
            to="/collection"
            action="View All Jewellery"
          />

          <ErrorNotice
            text={error}
            onRetry={() => refresh()}
          />

          {featured.length > 0 ? (
            <div className="product-grid">
              {featured.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="collection-empty">
              {loading
                ? 'Loading jewellery…'
                : 'Jewellery will appear here when the store publishes its collection.'}
            </div>
          )}
        </div>
      </section>

      {/* ================= GOLD & SILVER LIVE RATES ================= */}

      <section className="section rate-feature container">
        <div className="rate-feature-left">
          <p className="eyebrow">METAL RATE WATCH</p>

          <h2>
            Today’s brilliance,
            <br />
            <em>at a glance.</em>
          </h2>

          <p>
            Stay informed with current gold and silver rates
            published by our store. Rates refresh automatically
            from the shared backend.
          </p>

          <Link
            className="text-arrow-link"
            to="/rates"
          >
            Explore Gold & Silver Rates
            <ArrowUpRight size={19} />
          </Link>

          <div
            className="rate-ornament"
            aria-hidden="true"
          >
            ✦
          </div>
        </div>

        {/* Metal Rate Card */}
        <div className="rate-feature-card">
          <div className="rate-card-top">
            <span>
              <TrendingUp size={18} />
              CURRENT STORE RATE
            </span>

            <span className="rate-live-dot">
              Published by Store
            </span>
          </div>

          {/* Gold / Silver Switch */}
          <div
            className="rate-tab-switch"
            role="tablist"
            aria-label="Select metal"
          >
            {['Gold', 'Silver'].map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={metal === item}
                key={item}
                className={metal === item ? 'selected' : ''}
                onClick={() => setMetal(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Rate Value */}
          <div className="rate-card-value">
            <span>
              {rate && paiseToInr(rate.buyPaise) != null
                ? inr(paiseToInr(rate.buyPaise))
                : 'Not published'}
            </span>

            {rate && <small>/gram</small>}
          </div>

          {/* Updated Time */}
          <p className="rate-card-caption">
            {rate?.createdAt
              ? `Last published ${readableTime(rate.createdAt)}`
              : 'Ask the store for the latest price'}
          </p>

          <ErrorNotice text={ratesError} />

          <div className="rate-card-bottom">
            <span>
              Prices displayed are from the store’s backend
            </span>

            <button
              type="button"
              aria-label="Refresh rates"
              onClick={() => refresh({ quiet: true })}
            >
              <RefreshCcw size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ================= COINS BANNER ================= */}

      <section className="coins-banner">
        <div className="container coins-banner-inner">
          {/* <div className="coins-banner-art">
            <span>✦</span>

            <div className="gold-coin-drawing">
              R
            </div>

            <div className="silver-coin-drawing">
              R
            </div>
          </div> */}
          <div className="coins-banner-art">
            <img
              src={img1}
              alt="Gold and silver coins"
              className="coins-banner-image"
            />
          </div>

          <div className="coins-banner-copy">
            <p className="eyebrow">A GIFT THAT LASTS</p>

            <h2>
              Precious moments deserve
              <br />
              <em>precious gifts.</em>
            </h2>

            <p>
              Discover elegant gold and silver coins
              in a range of weights.
            </p>

            <Link
              className="btn btn-gold"
              to="/coins"
            >
              Shop Coins
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FEATURED COINS ================= */}

      {coinList.length > 0 && (
        <section className="section container">
          <SectionHeading
            eyebrow="GIFTING EDIT"
            title={
              <>
                Beautifully <em>considered.</em>
              </>
            }
            to="/coins"
            action="All Coins"
          />

          <div className="product-grid">
            {coinList.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </section>
      )}

      {/* ================= CLOSING SECTION ================= */}

      <section className="closing-note container">
        <span>✧</span>

        <h2>
          Every piece tells a story.
          <br />
          <em>Let yours begin here.</em>
        </h2>

        <Link
          to="/collection"
          className="btn btn-primary"
        >
          Explore The Collection
          <ChevronRight size={18} />
        </Link>
      </section>
    </>
  );
}