import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  ArrowRight,
  Heart,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
} from 'lucide-react';

import { useShop } from '../context/ShopContext';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';

import {
  isCoin,
  inr,
  productImage,
  resolveWhatsApp,
} from '../utils/format';

import { submitEnquiry } from '../api/client';

// ==========================================
// SECTION HEADING
// ==========================================

export function SectionHeading({
  eyebrow,
  title,
  description,
  to,
  action = 'View Collection',
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>

        <h2>{title}</h2>

        {description && (
          <p className="section-description">
            {description}
          </p>
        )}
      </div>

      {to && (
        <Link className="section-link" to={to}>
          {action}
          <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}

// ==========================================
// PRODUCT IMAGE
// ==========================================

export function ProductArt({
  product,
  className = '',
}) {
  const image = productImage(product);

  const [failed, setFailed] = useState(false);

  return (
    <div className={`product-art ${className}`}>
      {image && !failed ? (
        <img
          key={image}
          loading="lazy"
          src={image}
          alt={product.name || 'Jewellery'}
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="product-art-empty"
          aria-label="Product image not available"
        >
          <span className="product-art-icon">
            ✧
          </span>

          <span>IMAGE COMING SOON</span>
        </div>
      )}
    </div>
  );
}

// ==========================================
// EMPTY STATE
// ==========================================

export function EmptyState({
  title,
  message,
  actionLabel = 'Explore Collection',
  to = '/collection',
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">✧</div>

      <h3>{title}</h3>

      <p>{message}</p>

      {to && (
        <Link
          className="btn btn-primary"
          to={to}
        >
          {actionLabel}
          <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}

// ==========================================
// LOADING STATE
// ==========================================

export function LoadingState() {
  return (
    <div className="loading-state">
      <div className="spinner" />

      <span>
        Discovering the collection…
      </span>
    </div>
  );
}

// ==========================================
// ERROR NOTICE
// ==========================================

export function ErrorNotice({
  text,
  onRetry,
}) {
  if (!text) return null;

  return (
    <div
      className="error-notice"
      role="alert"
    >
      <p>{text}</p>

      {onRetry && (
        <button
          type="button"
          className="btn btn-small btn-outline"
          onClick={onRetry}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// ==========================================
// WHATSAPP ENQUIRY
// ==========================================

export function useEnquiry() {
  const { store } = useStore();
  const { loggedIn } = useAuth();

  return async (items, quantities = {}) => {
    const number = resolveWhatsApp(store);

    if (!number) {
      window.alert(
        'Store WhatsApp number is not configured. Please contact the store directly.'
      );
      return;
    }

    const lines = [
      `Hello ${
        store.name || 'Ratan Lal Saraf'
      }, I am interested in the following products:`,

      ...items.map(
        (product) =>
          `• ${product.name}${
            product.productCode
              ? ` — ${product.productCode}`
              : ''
          } | ${
            product.purity || 'Purity on request'
          } | ${
            product.weight || 'Weight on request'
          } | Qty ${
            quantities[product.id] || 1
          }${
            isCoin(product)
              ? ` | Indicative price ${inr(
                  product.price || 0
                )}`
              : ''
          }`
      ),

      'Please confirm availability and final price.',
    ];

    const body = lines.join('\n');

    const whatsappUrl =
      `https://wa.me/${number}?text=${encodeURIComponent(body)}`;

    // Open WhatsApp immediately to avoid popup blockers
    const tab = window.open(
      whatsappUrl,
      '_blank',
      'noopener,noreferrer'
    );

    if (!tab) {
      window.location.href = whatsappUrl;
    }

    // Save enquiry history for authenticated customers
    if (loggedIn) {
      try {
        await Promise.all(
          items.map((product) =>
            submitEnquiry(
              product.id,
              body.slice(0, 1000)
            )
          )
        );
      } catch (error) {
        window.alert(
          `WhatsApp opened, but enquiry history was not saved: ${error.message}`
        );
      }
    }
  };
}

// ==========================================
// PRODUCT CARD
// ==========================================

export function ProductCard({ product }) {
  const navigate = useNavigate();

  const {
    favorites,
    toggle,
    add,
  } = useShop();

  const enquire = useEnquiry();

  const saved = favorites.includes(product.id);

  const coin = isCoin(product);

  const soldOut = product.stock === 0;

  // ========================================
  // ADD TO CART + REDIRECT
  // ========================================

  const handleAddToCart = () => {
    if (soldOut) return;

    // Add selected product to cart
    add(product.id);

    // Automatically navigate to cart
    navigate('/cart');
  };

  // ========================================
  // TOGGLE WISHLIST
  // ========================================

  const handleWishlist = () => {
    toggle(product.id);
  };

  // ========================================
  // WHATSAPP ENQUIRY
  // ========================================

  const handleEnquiry = () => {
    enquire([product]);
  };

  return (
    <article className="product-card">

      {/* PRODUCT IMAGE */}
      <div className="product-image-wrap">
        <Link
          to={`/product/${encodeURIComponent(product.id)}`}
          aria-label={`View ${product.name}`}
        >
          <ProductArt product={product} />
        </Link>

        {/* PRODUCT METAL BADGE */}
        <span className="product-pill">
          {coin
            ? `${product.metal} Coin`
            : product.metal || 'Jewellery'}
        </span>

        {/* WISHLIST BUTTON */}
        <button
          type="button"
          className={`card-favorite ${
            saved ? 'saved' : ''
          }`}
          aria-label={
            saved
              ? `Remove ${product.name} from wishlist`
              : `Save ${product.name} to wishlist`
          }
          onClick={handleWishlist}
        >
          <Heart
            size={18}
            fill={
              saved
                ? 'currentColor'
                : 'none'
            }
          />
        </button>
      </div>

      {/* PRODUCT INFORMATION */}
      <div className="product-body">

        {/* PRODUCT NAME */}
        <Link
          to={`/product/${encodeURIComponent(product.id)}`}
          className="product-name"
        >
          {product.productCode || product.name}
        </Link>

        {/* PRODUCT SPECIFICATIONS */}
        <p className="product-spec">
          {[
            product.purity,
            product.weight,
          ]
            .filter(Boolean)
            .join(' · ') ||
            product.category ||
            'Fine Jewellery'}
        </p>

        {/* PRODUCT PRICE */}
        <p
          className={`product-price ${
            !coin ? 'no-amount' : ''
          }`}
        >
          {coin
            ? inr(product.price || 0)
            : product.availability ||
              'Price on enquiry'}
        </p>

        {/* PRODUCT ACTIONS */}
        <div className="product-actions">

          {/* ADD TO CART BUTTON */}
          <button
            type="button"
            className="product-add"
            disabled={soldOut}
            onClick={handleAddToCart}
          >
            <ShoppingBag size={15} />

            {soldOut
              ? 'Out of stock'
              : 'Add to Bag'}
          </button>

          {/* WHATSAPP ENQUIRY BUTTON */}
          <button
            type="button"
            className="product-enquire"
            onClick={handleEnquiry}
            aria-label={`Enquire about ${product.name}`}
          >
            <MessageCircle size={18} />
          </button>

        </div>
      </div>
    </article>
  );
}

// ==========================================
// QUANTITY CONTROL
// ==========================================

export function QtyControl({
  qty,
  minus,
  plus,
}) {
  return (
    <div className="qty-control">

      {/* DECREASE QUANTITY */}
      <button
        type="button"
        onClick={minus}
        aria-label="Decrease quantity"
      >
        <Minus size={15} />
      </button>

      {/* CURRENT QUANTITY */}
      <span>{qty}</span>

      {/* INCREASE QUANTITY */}
      <button
        type="button"
        onClick={plus}
        aria-label="Increase quantity"
      >
        <Plus size={15} />
      </button>

    </div>
  );
}