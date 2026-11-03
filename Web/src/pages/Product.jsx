import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  ArrowRight,
  Heart,
  MessageCircle,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';

import { useStore } from '../context/StoreContext';
import { useShop } from '../context/ShopContext';

import {
  EmptyState,
  LoadingState,
  ProductArt,
  ProductCard,
  useEnquiry,
} from '../components/UI';

import { inr, isCoin } from '../utils/format';

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { products, loading } = useStore();
  const { add, favorites, toggle } = useShop();

  const enquire = useEnquiry();

  // Find selected product
  const p = products.find((x) => String(x.id) === id);

  // Loading state
  if (loading && !products.length) {
    return <LoadingState />;
  }

  // Product not found
  if (!p) {
    return (
      <div className="container section">
        <EmptyState
          title="Product not found"
          message="This product may no longer be in the store’s collection."
        />
      </div>
    );
  }

  const coin = isCoin(p);
  const saved = favorites.includes(p.id);
  const soldOut = p.stock === 0;

  // Product specifications
  const specs = [
    ['Product Name', p.name],
    ['Brand Name', p.brand],
    ['Product Code', p.productCode],
    ['Availability', p.availability],
    ['Product Metal', p.metal],
    ['Product Purity', p.purity],
    ['Product Colour', p.colour],
    ['Net Weight', p.weight],
    ['Certified by', p.certifiedBy],
  ].filter((item) => item[1]);

  // Related products
  const related = products
    .filter(
      (x) =>
        x.id !== p.id &&
        x.metal === p.metal &&
        isCoin(x) === coin
    )
    .slice(0, 4);

  // Add product to cart and redirect
  const handleAddToCart = () => {
    if (soldOut) return;

    add(p.id);

    // Redirect directly to cart page
    navigate('/cart');
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="container product-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>

        <Link to={coin ? '/coins' : '/collection'}>
          {coin ? 'Coins' : 'Jewellery'}
        </Link>

        <span>/</span>
        <span>{p.name}</span>
      </div>

      {/* Product Details */}
      <section className="container product-detail">
        {/* Product Image */}
        <div className="detail-image">
          <ProductArt product={p} />

          <div className="detail-image-hint">
            <span>✧</span>
            {p.metal || 'Jewellery'} Collection
          </div>
        </div>

        {/* Product Information */}
        <div className="detail-info">
          <p className="eyebrow">A PIECE TO TREASURE</p>

          <h1>{p.name}</h1>

          <p className="detail-code">
            {p.productCode
              ? `Product Code: ${p.productCode}`
              : 'Ratan Lal Saraf Collection'}
          </p>

          <div className="detail-rule" />

          {/* Price */}
          <p className="detail-price">
            {coin
              ? inr(p.price || 0)
              : p.availability || 'Price on enquiry'}
          </p>

          <p className="detail-price-hint">
            {coin
              ? 'Indicative price. Taxes and final price to be confirmed.'
              : 'Contact the store for availability and final price.'}
          </p>

          {/* Metal / Purity / Weight */}
          <div className="detail-mini-specs">
            {[p.metal, p.purity, p.weight]
              .filter(Boolean)
              .map((tag, index) => (
                <span key={index}>{tag}</span>
              ))}
          </div>

          {/* Action Buttons */}
          <div className="detail-actions">
            <button
              type="button"
              disabled={soldOut}
              className="btn btn-primary"
              onClick={handleAddToCart}
            >
              <ShoppingBag size={19} />

              {soldOut
                ? 'Out of Stock'
                : 'Add to Shopping Bag'}
            </button>

            <button
              type="button"
              className={`btn btn-outline favorite-detail ${
                saved ? 'saved' : ''
              }`}
              onClick={() => toggle(p.id)}
            >
              <Heart
                size={18}
                fill={saved ? 'currentColor' : 'none'}
              />

              {saved ? 'Saved' : 'Save'}
            </button>
          </div>

          {/* WhatsApp Enquiry */}
          <button
            type="button"
            className="btn btn-whatsapp detail-whatsapp"
            onClick={() => enquire([p])}
          >
            <MessageCircle size={19} />
            Enquire on WhatsApp
            <ArrowRight size={17} />
          </button>

          {/* Store Information */}
          <div className="detail-support">
            <ShieldCheck size={20} />

            <span>
              For final pricing, making charges & availability,
              please contact the store.
            </span>
          </div>

          {/* Product Description */}
          <div className="detail-description">
            <h3>Product Description</h3>

            <p>
              {p.description ||
                'For more details about this piece, please contact our store.'}
            </p>
          </div>
        </div>
      </section>

      {/* Product Specifications */}
      <section className="container specs-section">
        <h2>Product Details</h2>

        <div className="specs-grid">
          {specs.map(([name, value]) => (
            <div key={name} className="spec-row">
              <span>{name}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="container section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                MORE TO FALL IN LOVE WITH
              </p>

              <h2>
                You may also <em>like.</em>
              </h2>
            </div>

            <Link
              className="section-link"
              to={coin ? '/coins' : '/collection'}
            >
              View Collection
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="product-grid">
            {related.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}