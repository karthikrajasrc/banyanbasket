import { useEffect, useRef, useState } from 'react';
import ProductCard from '../ui/ProductCard.jsx';
import Reveal from '../ui/Reveal.jsx';
import { getCollectionProducts } from '../../services/shopify/index.js';
import { useCatalog } from '../../context/CatalogContext.jsx';

export default function Combos() {
  const { collections, loading: catalogLoading } = useCatalog();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const railRef = useRef(null);
  const comboCollectionHandle = (
    collections.find((collection) => collection.handle === 'combos')
    || collections.find((collection) => collection.title.trim().toLowerCase() === 'combos')
    || collections.find((collection) => (
      /\bcombos?\b/i.test(`${collection.title} ${collection.handle}`)
    ))
  )?.handle;

  useEffect(() => {
    let active = true;

    async function loadComboProducts() {
      if (catalogLoading) return;
      if (!comboCollectionHandle) {
        setError('The Shopify Combos collection is not available to the Storefront API. Check its handle and publication status.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const firstPage = await getCollectionProducts(comboCollectionHandle, { first: 24 });
        if (!firstPage) {
          throw new Error(`The Shopify collection "${comboCollectionHandle}" could not be found.`);
        }

        const allProducts = [...firstPage.products];
        let pageInfo = firstPage.pageInfo;
        while (pageInfo.hasNextPage) {
          if (!pageInfo.endCursor) {
            throw new Error(`Shopify did not return a pagination cursor for "${comboCollectionHandle}".`);
          }

          const nextPage = await getCollectionProducts(comboCollectionHandle, {
            first: 24,
            after: pageInfo.endCursor,
          });
          if (!nextPage) {
            throw new Error(`The Shopify collection "${comboCollectionHandle}" could not be found.`);
          }
          allProducts.push(...nextPage.products);
          pageInfo = nextPage.pageInfo;
        }

        if (active) setProducts(allProducts);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadComboProducts();
    return () => {
      active = false;
    };
  }, [catalogLoading, comboCollectionHandle]);

  const scroll = (direction) => {
    railRef.current?.scrollBy({
      left: direction * railRef.current.clientWidth * 0.8,
      behavior: 'smooth',
    });
  };

  return (
    <section className="sec alt combo-section" aria-busy={loading}>
      <div className="w">
        <Reveal className="combo-heading"><h2>Our Combos</h2></Reveal>
      </div>
      {error ? (
        <p className="w" role="alert">Our Combos could not be loaded: {error}</p>
      ) : loading ? (
        <p className="w" role="status">Loading combos…</p>
      ) : products.length ? (
        <div className="combo-carousel">
          <div className="rail combo-product-rail rev-stagger" id="home-combo-products" ref={railRef}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} hoverSecondaryImage />
            ))}
          </div>
          {products.length > 1 && (
            <div className="combo-carousel-controls">
              <button className="combo-scroll-button" type="button" aria-label="Scroll combos left"
                aria-controls="home-combo-products" onClick={() => scroll(-1)}>‹</button>
              <button className="combo-scroll-button" type="button" aria-label="Scroll combos right"
                aria-controls="home-combo-products" onClick={() => scroll(1)}>›</button>
            </div>
          )}
        </div>
      ) : (
        <p className="w" role="status">No combos are available right now.</p>
      )}
    </section>
  );
}
