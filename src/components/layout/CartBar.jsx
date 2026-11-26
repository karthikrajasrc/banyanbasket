import { useCart } from '../../context/CartContext.jsx';
import { money } from '../../data/products.js';
import Icon from '../ui/Icon.jsx';

const arrowIcon = '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>';

export default function CartBar({ onOpen, drawerOpen }) {
  const { lines, count, subtotal, currencyCode, loading } = useCart();

  if (loading || !lines.length || drawerOpen) return null;

  const visibleLines = lines.slice(0, 3);
  const subtotalLabel = money(subtotal, currencyCode);

  return (
    <aside className="cart-bottom-bar" aria-label="Cart summary">
      <div className="cart-bar-products" aria-hidden="true">
        {visibleLines.map(({ key, product, qty }) => (
          <span className="cart-bar-product" key={key}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt="" />
            ) : (
              <span className="cart-bar-product-fallback">{product.name.slice(0, 1)}</span>
            )}
            <span className="cart-bar-quantity">{qty}</span>
          </span>
        ))}
        {lines.length > visibleLines.length && (
          <span className="cart-bar-more">+{lines.length - visibleLines.length}</span>
        )}
      </div>
      <div className="cart-bar-details" aria-live="polite">
        <strong>{count} {count === 1 ? 'item' : 'items'} in your cart</strong>
        <span>{subtotalLabel} subtotal</span>
      </div>
      <button
        className="cart-bar-action"
        type="button"
        aria-label={`View cart with ${count} ${count === 1 ? 'item' : 'items'}, subtotal ${subtotalLabel}`}
        onClick={onOpen}
      >
        View cart <Icon d={arrowIcon} size={18} />
      </button>
    </aside>
  );
}
