import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../ui/ProductCard.jsx';
import Reveal from '../ui/Reveal.jsx';
import { getCollectionProducts } from '../../services/shopify/index.js';
import { useCatalog } from '../../context/CatalogContext.jsx';
import Icon from '../ui/Icon.jsx';

const comboLeafIcon = '<path d="M20 4C11 4 5 8 5 15a5 5 0 0 0 5 5c7 0 10-7 10-16Z"/><path d="M4 21c3-5 7-9 13-13"/>';
const leftArrowIcon = '<path d="m15 18-6-6 6-6"/><path d="M20 12H9"/>';
const rightArrowIcon = '<path d="m9 18 6-6-6-6"/><path d="M4 12h11"/>';

export default function Combos() {
  const { collections, loading: catalogLoading } = useCatalog();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePage, setActivePage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
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

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || products.length < 2) return undefined;

    let frame = 0;
    const updatePagination = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
        const pages = Math.max(1, Math.ceil(maxScroll / rail.clientWidth) + 1);
        const page = maxScroll - rail.scrollLeft < 2
          ? pages - 1
          : Math.min(pages - 1, Math.round(rail.scrollLeft / rail.clientWidth));
        setPageCount((current) => current === pages ? current : pages);
        setActivePage((current) => current === page ? current : page);
      });
    };

    rail.addEventListener('scroll', updatePagination, { passive: true });
    window.addEventListener('resize', updatePagination);
    updatePagination();
    return () => {
      cancelAnimationFrame(frame);
      rail.removeEventListener('scroll', updatePagination);
      window.removeEventListener('resize', updatePagination);
    };
  }, [products.length]);

  const scroll = (direction) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth, behavior: 'smooth' });
  };

  const scrollToPage = (page) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollTo({
      left: Math.min(page * rail.clientWidth, rail.scrollWidth - rail.clientWidth),
      behavior: 'smooth',
    });
  };

  return (
    <section className="sec combo-section" aria-busy={loading}>
      <div className="w">
        <Reveal className="combo-section-header">
          <div className="combo-heading">
            <div className="combo-heading-mark" aria-hidden="true">
              <span />
              <Icon d={comboLeafIcon} size={25} />
              <span />
            </div>
            <h2 id="combo-heading">Our Combos</h2>
            <p>Curated pantry bundles for everyday cooking.</p>
          </div>
          {comboCollectionHandle && (
            <Link className="combo-view-all" to={`/collections/${comboCollectionHandle}`}>
              View All Combos <span aria-hidden="true">→</span>
            </Link>
          )}
        </Reveal>
      </div>
      {error ? (
        <p className="w" role="alert">Our Combos could not be loaded: {error}</p>
      ) : loading ? (
        <p className="w" role="status">Loading combos…</p>
      ) : products.length ? (
        <div className="combo-carousel" aria-labelledby="combo-heading">
          {pageCount > 1 && (
            <button
              className="combo-scroll-button combo-scroll-previous"
              type="button"
              aria-label="Scroll combos left"
              aria-controls="home-combo-products"
              onClick={() => scroll(-1)}
            >
              <Icon d={leftArrowIcon} size={24} />
            </button>
          )}
          <div className="rail combo-product-rail" id="home-combo-products" ref={railRef}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                hoverSecondaryImage
                showWishlist
                comboCard
              />
            ))}
          </div>
          {pageCount > 1 && (
            <>
              <button
                className="combo-scroll-button combo-scroll-next"
                type="button"
                aria-label="Scroll combos right"
                aria-controls="home-combo-products"
                onClick={() => scroll(1)}
              >
                <Icon d={rightArrowIcon} size={24} />
              </button>
              <div className="combo-pagination" role="group" aria-label="Combo pages">
                {Array.from({ length: pageCount }, (_, index) => (
                  <button
                    className={`combo-page-dot${index === activePage ? ' active' : ''}`}
                    key={index}
                    type="button"
                    aria-label={`Show combo page ${index + 1}`}
                    aria-current={index === activePage ? 'true' : undefined}
                    onClick={() => scrollToPage(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="w" role="status">No combos are available right now.</p>
      )}
    </section>
  );
}
