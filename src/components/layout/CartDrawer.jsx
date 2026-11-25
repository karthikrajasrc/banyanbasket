import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { money } from '../../data/products.js';

export default function CartDrawer({ open, onClose }) {
  const { lines, subtotal, total, currencyCode, setQty, checkout, busy, loading } = useCart();
  return (
    <aside className={`dr r${open ? ' on' : ''}`} aria-label="Cart" aria-hidden={!open}>
      <div className="dh"><h3>Your Cart</h3><button className="ib" onClick={onClose} aria-label="Close cart">✕</button></div>
      <div className="db">
        {loading ? <p role="status">Restoring your Shopify cart…</p> : lines.length === 0 ? (
          <div className="empty">
            <p style={{ fontSize: 18, color: 'var(--g)', fontFamily: 'var(--h)' }}>Your cart is empty</p>
            <p>Why not explore and find something special?</p><br />
            <Link className="btn" to="/collections/all" onClick={onClose}>Continue shopping</Link>
          </div>
        ) : lines.map(({ key, product: p, variant, qty }) => (
          <div className="ci" key={key}>
            <i><img src={p.imageUrl} alt={p.imageAlt || p.name} /></i>
            <div>
              <b>{p.name}</b>
              {variant.label && <small className="cart-size-label">{variant.label}</small>}
              <div className="q">
                <button disabled={busy || loading} onClick={() => setQty(key, qty - 1)} aria-label="Decrease quantity">−</button>
                <span>{qty}</span>
                <button disabled={busy || loading} onClick={() => setQty(key, qty + 1)} aria-label="Increase quantity">+</button>
              </div>
            </div>
            <b>{money(variant.price * qty, variant.currencyCode)}</b>
          </div>
        ))}
      </div>
      {lines.length > 0 && (
        <div className="df">
          <p><span>Subtotal</span><span>{money(subtotal, currencyCode)}</span></p>
          <p><span>Estimated total</span><span>{money(total, currencyCode)}</span></p>
          <small style={{ color: 'var(--mut)' }}>Taxes and shipping are finalized at Shopify checkout.</small>
          <button className="btn" disabled={busy || loading} onClick={checkout}>
            {busy ? 'Please wait…' : 'Checkout'}
          </button>
        </div>
      )}
    </aside>
  );
}
