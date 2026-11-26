import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../../services/shopify/index.js';
import ProductCard from '../ui/ProductCard.jsx';

const PAGE_SIZE = 24;
const ROTATION_INTERVAL = 1800;

export default function AllProductsCarousel() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError('');
      try {
        const firstPage = await getProducts({ first: PAGE_SIZE });
        const allProducts = [...firstPage.products];
        let pageInfo = firstPage.pageInfo;

        while (pageInfo.hasNextPage) {
          if (!pageInfo.endCursor) {
            throw new Error('Shopify did not return a cursor for the next product page.');
          }

          const nextPage = await getProducts({
            first: PAGE_SIZE,
            after: pageInfo.endCursor,
          });
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

    loadProducts();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setReducedMotion(motionPreference.matches);
    updateMotionPreference();
    motionPreference.addEventListener('change', updateMotionPreference);
    return () => motionPreference.removeEventListener('change', updateMotionPreference);
  }, []);

  useEffect(() => {
    if (reducedMotion || hovered || focused || products.length < 2) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % products.length);
    }, ROTATION_INTERVAL);

    return () => window.clearInterval(intervalId);
  }, [focused, hovered, reducedMotion, products.length]);

  const visibleOffsets = products.length > 7
    ? [-3, -2, -1, 0, 1, 2, 3]
    : Array.from({ length: products.length }, (_, index) => index - Math.floor(products.length / 2));

  return (
    <section className="sec all-products-section" aria-labelledby="all-products-heading" aria-busy={loading}>
      <div className="w">
        <div className="all-products-heading">
          <span className="all-products-eyebrow">The full collection</span>
          <h2 id="all-products-heading">Explore all our products</h2>
          <p>Explore the collection as it rolls by.</p>
        </div>
      </div>

      {error ? (
        <p className="w" role="alert">Products could not be loaded: {error}</p>
      ) : loading ? (
        <p className="w" role="status">Loading products…</p>
      ) : products.length ? (
        <div
          className="all-products-scene"
          role="region"
          aria-label="Product carousel"
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
          }}
        >
          <div className="all-products-track">
            {visibleOffsets.map((offset) => {
              const index = (activeIndex + offset + products.length) % products.length;
              return (
                <div
                  className="all-products-card"
                  data-offset={offset}
                  key={products[index].id}
                  onClick={(event) => {
                    if (event.target.closest('a, button')) return;
                    navigate(`/products/${products[index].handle}`);
                  }}
                >
                  <ProductCard product={products[index]} hoverSecondaryImage />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="w" role="status">No products are available right now.</p>
      )}
    </section>
  );
}
