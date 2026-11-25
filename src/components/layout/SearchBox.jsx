import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { money } from '../../data/products.js';
import { startingVariant } from '../../data/productVariants.js';
import { searchProducts } from '../../services/shopify/index.js';

export default function SearchBox() {
  const [term, setTerm] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const box = useRef(null);
  const input = useRef(null);
  const toggle = useRef(null);

  useEffect(() => {
    const away = (e) => {
      if (!box.current?.contains(e.target)) {
        setExpanded(false);
        setOpen(false);
      }
    };
    const esc = (e) => {
      if (e.key === 'Escape') {
        setExpanded(false);
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener('click', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('click', away); document.removeEventListener('keydown', esc); };
  }, []);

  useEffect(() => {
    if (expanded) input.current?.focus();
  }, [expanded]);

  const closeSearch = () => {
    setExpanded(false);
    setOpen(false);
  };

  const query = term.trim();
  useEffect(() => {
    let active = true;
    setMatches([]);
    setError('');
    if (query.length < 2) {
      setMatches([]);
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      searchProducts(query, { first: 7 })
        .then((products) => {
          if (active) setMatches(products);
        })
        .catch((requestError) => {
          if (active) setError(requestError.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className={`sbox${expanded ? ' expanded' : ''}`} ref={box}>
      <button className="ib search-toggle" type="button" ref={toggle}
        aria-label={expanded ? 'Close product search' : 'Open product search'}
        aria-expanded={expanded} aria-controls="header-search-panel"
        onClick={() => expanded ? closeSearch() : setExpanded(true)}>
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="9" cy="9" r="6.5" /><path d="m14 14 4 4" />
        </svg>
      </button>
      {expanded && (
        <div className="search-panel" id="header-search-panel">
          <input ref={input} type="search" placeholder="Search your items..." autoComplete="off" aria-label="Search products"
            value={term} onChange={(e) => { setTerm(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} />
          <div className={`res${open && query ? ' on' : ''}`}>
            {matches.length ? matches.map((p) => (
              <Link key={p.id} to={`/products/${p.handle}`} onClick={() => { closeSearch(); setTerm(''); }}>
                <i><img src={p.imageUrl} alt={p.imageAlt || ''} /></i>
                <span style={{ flex: 1 }}>
                  <b style={{ display: 'block', fontSize: 14 }}>{p.name}</b>
                  <span style={{ color: 'var(--g)', fontWeight: 700 }}>
                    {Array.isArray(p.variants) && p.variants.length > 1 ? 'From ' : ''}
                    {money(startingVariant(p).price, startingVariant(p).currencyCode)}
                  </span>
                </span>
              </Link>
            )) : loading ? <small role="status">Searching Shopify…</small>
              : error ? <small role="alert">{error}</small>
                : query.length < 2 ? <small>Enter at least 2 characters to search.</small>
                  : <small>No products found.</small>}
          </div>
        </div>
      )}
    </div>
  );
}
