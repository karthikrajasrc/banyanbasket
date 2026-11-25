import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { money } from '../../data/products.js';
import { getProductVariants, getVariantOptionName, startingVariant } from '../../data/productVariants.js';

export default function ProductCard({ product: p, hoverSecondaryImage = true, subcategoryBadge }) {
  const { add, loading: cartLoading, busy } = useCart();
  const variants = getProductVariants(p);
  const [selectedVariantId, setSelectedVariantId] = useState(() => startingVariant(p).id);
  const variant = variants.find((item) => item.id === selectedVariantId) || startingVariant(p);
  const variantOptionName = getVariantOptionName(variants);
  const secondaryImage = hoverSecondaryImage && Array.isArray(p.images)
    ? p.images.find((image) => typeof image === 'string' && image && image !== p.imageUrl)
    : null;
  const off = variant.mrp > variant.price
    ? Math.round((1 - variant.price / variant.mrp) * 100)
    : 0;
  return (
    <article className={`card${secondaryImage ? ' has-secondary-image' : ''}`}>
      {subcategoryBadge && (
        <span className="product-card-subcategory-badge">{subcategoryBadge}</span>
      )}
      {off > 0 && <span className="tg">-{off}%</span>}
      <Link className="im" to={`/products/${p.handle}`} aria-label={p.name}>
        <span className="product-card-image-frame">
          <img className="product-card-primary-image" src={p.imageUrl} alt={p.imageAlt || p.name} loading="lazy" />
          {secondaryImage && (
            <span className="product-card-secondary-image" aria-hidden="true">
              <img src={secondaryImage} alt="" loading="lazy" />
            </span>
          )}
        </span>
      </Link>
      <div className="in">
        <h3><Link to={`/products/${p.handle}`}>{p.name}</Link></h3>
        {variants.length > 1 ? (
          <div className="product-card-size-picker" role="group" aria-label={`Choose a pack size for ${p.name}`}>
            {variantOptionName && <span className="product-card-size-label">{variantOptionName}</span>}
            <div className="product-card-size-options">
              {variants.map((item) => (
                <button
                  className={`product-card-size-option${item.id === variant.id ? ' selected' : ''}`}
                  key={item.id}
                  type="button"
                  aria-pressed={item.id === variant.id}
                  disabled={!item.availableForSale}
                  onClick={() => setSelectedVariantId(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : variant.label ? (
          <small className="product-card-size">
            {variant.optionLabel || (variantOptionName ? `${variantOptionName}: ${variant.label}` : variant.label)}
          </small>
        ) : null}
        <div className="pr">
          <b>{money(variant.price, variant.currencyCode)}</b>
          {off > 0 && <s>{money(variant.mrp, variant.currencyCode)}</s>}
        </div>
        <button className="add" disabled={!variant.availableForSale || cartLoading || busy}
          onClick={() => add(1, variant)}>
          {variant.availableForSale === false ? 'Sold out' : `Add to cart${variant.label ? ` · ${variant.label}` : ''}`}
        </button>
      </div>
    </article>
  );
}
