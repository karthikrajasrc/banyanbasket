import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  addCartLines,
  createCart,
  getCart,
  removeCartLines,
  updateCartLines,
} from '../services/shopify/index.js';

const CartContext = createContext(null);
const STORAGE_KEY = 'bb-shopify-cart-id';

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const cartRef = useRef(null);
  const busyCount = useRef(0);
  const queue = useRef(Promise.resolve());
  const timer = useRef();

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const commitCart = useCallback((nextCart) => {
    cartRef.current = nextCart;
    setCart(nextCart);
    try {
      if (nextCart?.id) localStorage.setItem(STORAGE_KEY, nextCart.id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      notify(`Cart changes could not be saved in this browser: ${error.message}`, 'error');
    }
  }, [notify]);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const cartId = localStorage.getItem(STORAGE_KEY);
        if (cartId) {
          const restored = await getCart(cartId);
          if (!active) return;
          if (restored) commitCart(restored);
          else {
            commitCart(null);
            notify('Your saved cart has expired. Start a new cart to continue.', 'error');
          }
        }
      } catch (error) {
        if (active) notify(error.message, 'error');
      } finally {
        if (active) setLoading(false);
      }
    };
    restore();
    return () => { active = false; };
  }, [commitCart, notify]);

  const serialize = useCallback((operation) => {
    const pending = queue.current.then(operation, operation);
    queue.current = pending;
    return pending;
  }, []);

  const runOperation = useCallback((operation) => {
    busyCount.current += 1;
    setBusy(true);
    return serialize(operation)
      .catch((error) => notify(error.message, 'error'))
      .finally(() => {
        busyCount.current -= 1;
        setBusy(busyCount.current > 0);
      });
  }, [notify, serialize]);

  const add = useCallback((quantity = 1, requestedVariant) => {
    if (loading) {
      notify('Your cart is still being restored. Please try again in a moment.', 'error');
      return;
    }
    if (!requestedVariant?.id) {
      notify('Choose an available product variant before adding it to your cart.', 'error');
      return;
    }
    if (requestedVariant.availableForSale === false) {
      notify('This product variant is currently unavailable.', 'error');
      return;
    }
    return runOperation(async () => {
      const line = { merchandiseId: requestedVariant.id, quantity };
      let current = cartRef.current;
      if (!current) {
        const savedCartId = localStorage.getItem(STORAGE_KEY);
        if (savedCartId) current = await getCart(savedCartId);
      }
      const nextCart = current
        ? await addCartLines(current.id, [line])
        : await createCart([line]);
      commitCart(nextCart);
      notify('Added to your Shopify cart.');
    });
  }, [commitCart, loading, notify, runOperation]);

  const setQty = useCallback((lineId, quantity) => {
    runOperation(async () => {
      const current = cartRef.current;
      if (!current) return;
      const nextCart = quantity < 1
        ? await removeCartLines(current.id, [lineId])
        : await updateCartLines(current.id, [{ id: lineId, quantity }]);
      commitCart(nextCart);
    });
  }, [commitCart, runOperation]);

  const checkout = useCallback(() => {
    runOperation(async () => {
      const current = cartRef.current;
      if (!current) throw new Error('Your cart is empty.');
      const refreshedCart = await getCart(current.id);
      if (!refreshedCart) throw new Error('Your Shopify cart is no longer available. Please add your items again.');
      commitCart(refreshedCart);
      const checkoutUrl = new URL(refreshedCart.checkoutUrl);
      if (checkoutUrl.protocol !== 'https:') throw new Error('Shopify returned an invalid checkout URL.');
      window.location.assign(refreshedCart.checkoutUrl);
    });
  }, [commitCart, runOperation]);

  const value = useMemo(() => ({
    lines: cart?.lines || [],
    count: cart?.count || 0,
    subtotal: cart?.subtotal || 0,
    total: cart?.total || 0,
    currencyCode: cart?.currencyCode || 'USD',
    loading,
    busy,
    add,
    setQty,
    checkout,
    toast,
    notify,
  }), [add, busy, cart, checkout, loading, notify, setQty, toast]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used within CartProvider');
  return value;
};
