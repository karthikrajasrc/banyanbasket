import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { discount, money } from '../../data/products.js';
import { getProductVariants, getVariantOptionName, startingVariant } from '../../data/productVariants.js';
import { useWishlist } from '../../context/WishlistContext.jsx';

const comboBadgeLabels = {
  'best value': 'Best Value',
  popular: 'Popular',
  new: 'New',
  'combo deal': 'Combo Deal',
};

export default function ProductCard({
  product: p,
  hoverSecondaryImage = true,
  subcategoryBadge,
  groceryStyle = false,
  showWishlist = false,
  compactRail = false,
  comboCard = false,
}) {
  const { add, lines, setQty, loading: cartLoading, busy } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [adding, setAdding] = useState(false);
  const variants = getProductVariants(p);
  const [selectedVariantId, setSelectedVariantId] = useState(() => startingVariant(p).id);
  const variant = variants.find((item) => item.id === selectedVariantId) || startingVariant(p);
  const variantCartLines = lines.filter((line) => line.variant.id === variant.id);
  const cartQuantity = variantCartLines.reduce((quantity, line) => quantity + line.qty, 0);
  const cartLine = variantCartLines[0];
  const variantOptionName = getVariantOptionName(variants);
  const secondaryImage = hoverSecondaryImage && Array.isArray(p.images)
    ? p.images.find((image) => typeof image === 'string' && image && image !== p.imageUrl)
    : null;
  const price = variant.price === null || variant.price === undefined || variant.price === ''
    ? Number.NaN
    : Number(variant.price);
  const compareAtPrice = variant.mrp === null || variant.mrp === undefined || variant.mrp === ''
    ? Number.NaN
    : Number(variant.mrp);
  const hasDiscount = Number.isFinite(price)
    && price > 0
    && Number.isFinite(compareAtPrice)
    && compareAtPrice > price;
  const discountPercentage = discount({ price, mrp: compareAtPrice });
  const explicitDiscountLabel = [p.discountLabel, ...(Array.isArray(p.tags) ? p.tags : [])]
    .find((label) => typeof label === 'string' && /^(?:flat\s+)?\d{1,2}%\s+off$/i.test(label.trim()))
    ?.trim();
  const discountLabel = explicitDiscountLabel || (discountPercentage > 0 ? `${discountPercentage}% OFF` : '');
  const comboBadgeLabel = comboCard
    ? (Array.isArray(p.tags) ? p.tags : [])
      .map((tag) => comboBadgeLabels[tag.trim().toLowerCase()])
      .find(Boolean)
    : '';
  const badgeLabel = groceryStyle || compactRail
    ? discountLabel
    : comboCard
      ? discountLabel || comboBadgeLabel
      : discountPercentage > 0
        ? `-${discountPercentage}%`
        : '';
  const comboDetails = comboCard
    ? (Array.isArray(p.tags) ? p.tags : []).filter((tag) => (
      /^\d+\s+products?$/i.test(tag.trim())
      || /^\d+(?:\.\d+)?\s*(?:kg|g)\s*(?:total)?$/i.test(tag.trim())
    ))
    : [];
  const comboSavings = comboCard && hasDiscount
    ? `Save ${money(compareAtPrice - price, variant.currencyCode)}`
    : '';
  const displayedPrice = Number.isFinite(price) && price >= 0
    ? money(price, variant.currencyCode)
    : '—';
  const wishlisted = isWishlisted(p.id || p.handle);
  const priceMarkup = (
    <div className={`pr${groceryStyle ? ' grocery-price-row' : ''}${compactRail ? ' category-rail-price-row' : ''}`}>
      <b>{displayedPrice}</b>
      {hasDiscount && <s>{money(compareAtPrice, variant.currencyCode)}</s>}
      {comboSavings && <span className="combo-saving">{comboSavings}</span>}
    </div>
  );
  const compactAddButton = groceryStyle || compactRail;

  const handleAdd = async () => {
    if (adding) return;
    setAdding(true);
    try {
      await add(1, variant);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className={`card${secondaryImage ? ' has-secondary-image' : ''}${groceryStyle ? ' grocery-product-card' : ''}${compactRail ? ' category-rail-card' : ''}${comboCard ? ' combo-product-card' : ''}`}>
      {subcategoryBadge && (
        <span className="product-card-subcategory-badge">{subcategoryBadge}</span>
      )}
      {badgeLabel && (
        <span className={`tg${comboCard ? ' combo-card-badge' : ''}${comboCard && discountLabel ? ' combo-discount-badge' : ''}${groceryStyle || compactRail ? ' grocery-discount-badge' : ''}`}>
          {badgeLabel}
        </span>
      )}
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
        {compactRail && priceMarkup}
        <h3><Link to={`/products/${p.handle}`}>{p.name}</Link></h3>
        {comboDetails.length > 0 && (
          <div className="combo-product-meta">
            {comboDetails.map((detail, index) => (
              <span key={`${detail}-${index}`}>{detail}</span>
            ))}
          </div>
        )}
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
        {!compactRail && priceMarkup}
        {cartQuantity > 0 ? (
          <div
            className={`add product-card-quantity-control${compactAddButton ? ' grocery-add-button' : ''}${comboCard ? ' combo-add-button' : ''}`}
            role="group"
            aria-label={`${p.name}${variant.label ? `, ${variant.label}` : ''} quantity in cart`}
            aria-busy={busy || cartLoading}
          >
            <button
              type="button"
              aria-label={`Decrease ${p.name} quantity`}
              disabled={cartLoading || busy}
              onClick={() => setQty(cartLine.key, cartLine.qty - 1)}
            >
              −
            </button>
            <span aria-live="polite">{cartQuantity}</span>
            <button
              type="button"
              aria-label={`Increase ${p.name} quantity`}
              disabled={!variant.availableForSale || cartLoading || busy}
              onClick={() => setQty(cartLine.key, cartLine.qty + 1)}
            >
              +
            </button>
          </div>
        ) : (
          <button
            className={`add${compactAddButton ? ' grocery-add-button' : ''}${comboCard ? ' combo-add-button' : ''}`}
            disabled={!variant.availableForSale || cartLoading || adding}
            aria-label={`Add ${p.name}${variant.label ? `, ${variant.label}` : ''} to cart`}
            aria-busy={adding}
            onClick={handleAdd}
          >
            {variant.availableForSale === false
              ? 'Sold out'
              : compactAddButton
                ? (
                  <>
                    {adding ? (
                      <span className="grocery-add-loading" aria-hidden="true" />
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 3h2l2.2 11.1a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L22 8H6" />
                        <circle cx="10" cy="20" r="1.2" />
                        <circle cx="18" cy="20" r="1.2" />
                      </svg>
                    )}
                    {adding ? 'LOADING' : 'ADD'}
                  </>
                )
                : comboCard
                  ? (
                    <>
                      {adding ? (
                        <span className="combo-add-spinner" aria-hidden="true" />
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 3h2l2.2 11.1a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L22 8H6" />
                          <circle cx="10" cy="20" r="1.2" />
                          <circle cx="18" cy="20" r="1.2" />
                        </svg>
                      )}
                      {adding ? 'Adding…' : 'Add to cart'}
                    </>
                  )
                  : adding
                    ? 'Adding…'
                    : `Add to cart${variant.label ? ` · ${variant.label}` : ''}`}
          </button>
        )}
      </div>
    </article>
  );
}
