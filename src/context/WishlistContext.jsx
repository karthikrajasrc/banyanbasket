import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from './CartContext.jsx';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'bb-wishlist';

function readWishlist() {
  if (typeof window === 'undefined') return { ids: [], error: null };
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ids: [], error: null };
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.some((id) => typeof id !== 'string')) {
      throw new Error('Saved wishlist data is invalid.');
    }
    return { ids: [...new Set(parsed)], error: null };
  } catch (error) {
    return { ids: [], error };
  }
}

export function WishlistProvider({ children }) {
  const { notify } = useCart();
  const [wishlist, setWishlist] = useState(readWishlist);
  const errorReported = useRef(false);

  useEffect(() => {
    if (wishlist.error && !errorReported.current) {
      errorReported.current = true;
      notify(`Wishlist could not be loaded: ${wishlist.error.message}`, 'error');
    }
  }, [notify, wishlist.error]);

  const isWishlisted = useCallback((id) => wishlist.ids.includes(id), [wishlist.ids]);
  const toggleWishlist = useCallback((id) => {
    if (typeof id !== 'string' || !id) {
      notify('This product cannot be added to your wishlist.', 'error');
      return;
    }
    const ids = wishlist.ids.includes(id)
      ? wishlist.ids.filter((savedId) => savedId !== id)
      : [...wishlist.ids, id];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
      setWishlist({ ids, error: null });
    } catch (error) {
      notify(`Wishlist changes could not be saved in this browser: ${error.message}`, 'error');
    }
  }, [notify, wishlist.ids]);

  const value = useMemo(() => ({ isWishlisted, toggleWishlist }), [isWishlisted, toggleWishlist]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error('useWishlist must be used within WishlistProvider');
  return value;
}
