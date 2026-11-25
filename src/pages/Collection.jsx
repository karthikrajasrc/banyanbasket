import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import ProductCard from '../components/ui/ProductCard.jsx';
import NotFound from './NotFound.jsx';
import { money } from '../data/products.js';
import {
  getCategoryHierarchy,
  getCollectionProducts,
  getProducts,
} from '../services/shopify/index.js';

const PAGE_SIZE = 24;
const SORTS = {
  'alphabetical-asc': (a, b) => a.title.localeCompare(b.title),
  'alphabetical-desc': (a, b) => b.title.localeCompare(a.title),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  'date-asc': (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  'date-desc': (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
};
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'most-relevant', label: 'Most relevant' },
  { value: 'best-selling', label: 'Best selling' },
  { value: 'alphabetical-asc', label: 'Alphabetically, A-Z' },
  { value: 'alphabetical-desc', label: 'Alphabetically, Z-A' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'date-asc', label: 'Date, old to new' },
  { value: 'date-desc', label: 'Date, new to old' },
];

async function getAllCollectionProducts(handle) {
  const firstPage = await getCollectionProducts(handle, { first: PAGE_SIZE });
  if (!firstPage) throw new Error(`The Shopify collection "${handle}" could not be found.`);

  const products = [...firstPage.products];
  let pageInfo = firstPage.pageInfo;
  while (pageInfo.hasNextPage) {
    if (!pageInfo.endCursor) {
      throw new Error(`Shopify did not return a pagination cursor for "${handle}".`);
    }
    const nextPage = await getCollectionProducts(handle, {
      first: PAGE_SIZE,
      after: pageInfo.endCursor,
    });
    if (!nextPage) throw new Error(`The Shopify collection "${handle}" could not be found.`);
    products.push(...nextPage.products);
    pageInfo = nextPage.pageInfo;
  }

  return { ...firstPage, products };
}

async function getCategoryProducts(category) {
  const collections = [
    { handle: category.slug, subcategory: null },
    ...category.subcategories.map((subcategory) => ({
      handle: subcategory.slug,
      subcategory,
    })),
  ];
  const collectionResults = await Promise.all(collections.map(async ({ handle, subcategory }) => {
    const result = await getAllCollectionProducts(handle);
    return { ...result, subcategory };
  }));
  const productsById = new Map();

  collectionResults.forEach(({ products: collectionProducts, subcategory }) => {
    collectionProducts.forEach((product) => {
      const current = productsById.get(product.id);
      if (current) {
        if (subcategory && !current.subcategories.includes(subcategory.title)) {
          current.subcategories.push(subcategory.title);
        }
        return;
      }
      productsById.set(product.id, {
        ...product,
        subcategories: subcategory ? [subcategory.title] : [],
      });
    });
  });

  return {
    collection: collectionResults[0].collection,
    products: [...productsById.values()].map((product) => ({
      ...product,
      subcategoryBadge: product.subcategories.join(' · '),
    })),
  };
}

function ProductGridSkeleton({ isParentCategory = false }) {
  return (
    <div className={`grid product-grid-skeleton${isParentCategory ? ' category-product-grid' : ''}`}
      aria-label="Loading products" role="status">
      {Array.from({ length: 8 }, (_, index) => <div className="product-card-skeleton" key={index} />)}
    </div>
  );
}

export default function Collection() {
  const { slug, subcategory } = useParams();
  const handle = subcategory || slug;
  const [sort, setSort] = useState('best-selling');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [minimumPrice, setMinimumPrice] = useState('');
  const [maximumPrice, setMaximumPrice] = useState('');
  const [openFilter, setOpenFilter] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const filterControlsRef = useRef(null);
  const mobileFilterDialogRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(null);
  const [subcategoryEntry, setSubcategoryEntry] = useState(null);
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [pageInfo, setPageInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const loadCollection = async () => {
      setLoading(true);
      setLoadingMore(false);
      setError('');
      setNotFound(false);
      setProducts([]);
      setPageInfo(null);
      setCollection(null);
      setCategory(null);
      setSubcategoryEntry(null);

      try {
        const hierarchy = await getCategoryHierarchy();
        if (!active) return;

        const routeCategory = hierarchy.categories.find((item) => item.slug === slug);
        let selectedCategory = routeCategory || null;
        let selectedSubcategory = subcategory
          ? routeCategory?.subcategories.find((item) => item.slug === subcategory) || null
          : null;

        if (subcategory && !selectedSubcategory) {
          setNotFound(true);
          return;
        }

        if (!subcategory && handle !== 'all' && !routeCategory) {
          const parent = hierarchy.categories.find((item) => (
            item.subcategories.some((child) => child.slug === handle)
          ));
          selectedSubcategory = parent?.subcategories.find((child) => child.slug === handle) || null;
          selectedCategory = parent || null;
        }

        const isParentCategory = selectedCategory && !selectedSubcategory;
        const data = handle === 'all'
          ? await getProducts({ first: PAGE_SIZE })
          : isParentCategory
            ? await getCategoryProducts(selectedCategory)
            : await getCollectionProducts(handle, { first: PAGE_SIZE });
        if (!active) return;

        setCategories(hierarchy.categories);
        setCategory(selectedCategory);
        setSubcategoryEntry(selectedSubcategory);
        if (!data) {
          setNotFound(true);
          return;
        }
        setCollection(data.collection || null);
        setProducts(data.products);
        setPageInfo(data.pageInfo);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCollection();
    return () => { active = false; };
  }, [attempt, handle, slug, subcategory]);

  const subcategoryProducts = useMemo(() => products.filter((product) => (
    !subcategoryFilter || product.subcategories?.includes(subcategoryFilter)
  )), [products, subcategoryFilter]);
  const availableCount = subcategoryProducts.filter((product) => product.availableForSale).length;
  const unavailableCount = subcategoryProducts.length - availableCount;
  const highestPrice = subcategoryProducts.reduce((highest, product) => (
    Math.max(highest, product.price)
  ), 0);
  const currencyCode = subcategoryProducts[0]?.currencyCode || 'USD';
  const currencySymbol = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).formatToParts(0).find((part) => part.type === 'currency')?.value || currencyCode;
  const list = useMemo(() => {
    const filtered = subcategoryProducts.filter((product) => {
      if (availabilityFilter === 'in-stock' && !product.availableForSale) return false;
      if (availabilityFilter === 'out-of-stock' && product.availableForSale) return false;
      if (minimumPrice !== '' && product.price < Number(minimumPrice)) return false;
      if (maximumPrice !== '' && product.price > Number(maximumPrice)) return false;
      return true;
    });

    if (sort === 'featured') {
      return filtered.sort((a, b) => Number(b.showOnHome) - Number(a.showOnHome));
    }
    return SORTS[sort] ? filtered.sort(SORTS[sort]) : filtered;
  }, [availabilityFilter, maximumPrice, minimumPrice, sort, subcategoryProducts]);
  const activeMobileFilterCount = Number(Boolean(availabilityFilter))
    + Number(minimumPrice !== '' || maximumPrice !== '')
    + Number(sort !== 'best-selling');
  const title = handle === 'all'
    ? 'All Products'
    : subcategoryEntry?.title || category?.title || collection?.title || 'Shop';
  const breadcrumbs = handle === 'all'
    ? [{ label: title }]
    : subcategoryEntry && category
      ? [
        { label: category.title, to: `/collections/${category.slug}` },
        { label: subcategoryEntry.title },
      ]
      : [{ label: title }];
  const categoryCards = category
    ? category.subcategories
    : handle === 'all' ? categories : [];
  const isParentCategory = Boolean(category && !subcategoryEntry);

  useEffect(() => {
    setSubcategoryFilter('');
    setAvailabilityFilter('');
    setMinimumPrice('');
    setMaximumPrice('');
    setOpenFilter('');
    setMobileFilterOpen(false);
  }, [handle]);

  useEffect(() => {
    const dialog = mobileFilterDialogRef.current;
    if (!dialog) return;
    if (mobileFilterOpen && !dialog.open) dialog.showModal();
    else if (!mobileFilterOpen && dialog.open) dialog.close();
  }, [mobileFilterOpen]);

  useEffect(() => {
    if (!openFilter) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!filterControlsRef.current?.contains(event.target)) setOpenFilter('');
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpenFilter('');
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [openFilter]);

  const loadMore = async () => {
    if (!pageInfo?.hasNextPage || loadingMore) return;
    setLoadingMore(true);
    setError('');
    try {
      const next = handle === 'all'
        ? await getProducts({ first: PAGE_SIZE, after: pageInfo.endCursor })
        : await getCollectionProducts(handle, { first: PAGE_SIZE, after: pageInfo.endCursor });
      if (!next) {
        setNotFound(true);
        return;
      }
      setProducts((current) => [...current, ...next.products]);
      setPageInfo(next.pageInfo);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingMore(false);
    }
  };

  if (!loading && notFound) return <NotFound />;

  return (
    <>
      <PageHeader
        title={title}
        crumbs={breadcrumbs}
        className={`collection-page-header${isParentCategory ? ' collection-category-header' : ''}`}
      />
      {collection?.description && (
        <section className="sec" style={{ paddingBottom: 0 }}>
          <div className="w"><p>{collection.description}</p></div>
        </section>
      )}
      {((isParentCategory && categoryCards.length > 0)
        || (!isParentCategory && !subcategoryEntry && handle === 'all' && categories.length > 0)) && (
        <Reveal
          as="section"
          className={`category-bundle rev-stagger${isParentCategory ? ' mobile-category-subcategories' : ''}`}
          aria-label={isParentCategory ? `${category.title} subcategories` : 'Shop by category'}
        >
          <h2 className="category-bundle-title">
            {isParentCategory ? `Explore ${category.title} subcategories` : 'Shop by category'}
          </h2>
          {categoryCards.length > 0 ? (
            <div className="category-bundle-grid">
              {categoryCards.map((item) => {
                const imageUrl = category
                  ? item.subcategoryImageUrl || item.imageUrl
                  : item.shopAllImageUrl || item.imageUrl;
                return (
                  <Link
                    className="category-bundle-card"
                    key={item._id}
                    to={category
                      ? `/collections/${category.slug}/${item.slug}`
                      : `/collections/${item.slug}`}
                  >
                    <span className="category-bundle-art" aria-hidden="true">
                      {imageUrl && <img src={imageUrl} alt="" loading="lazy" />}
                    </span>
                    <span className="category-bundle-label">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="ctr">No subcategories are available for this category yet.</p>
          )}
        </Reveal>
      )}
      <section className={`sec collection-listing-section${isParentCategory && category.subcategories.length
        ? ' mobile-parent-category-products'
        : ''}`}>
        <div className="w">
          <Reveal className={`tb collection-filter-toolbar${isParentCategory ? ' collection-category-toolbar' : ''}`}>
            <div className="chips">
              {isParentCategory ? (
                <>
                  <button
                    className={!subcategoryFilter ? 'on' : ''}
                    type="button"
                    aria-pressed={!subcategoryFilter}
                    onClick={() => setSubcategoryFilter('')}
                  >
                    All Products
                  </button>
                  {category.subcategories.map((item) => (
                    <button
                      className={subcategoryFilter === item.title ? 'on' : ''}
                      key={item._id}
                      type="button"
                      aria-pressed={subcategoryFilter === item.title}
                      onClick={() => setSubcategoryFilter(item.title)}
                    >
                      {item.title}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <Link to="/collections/all" className={handle === 'all' ? 'on' : ''}>All Products</Link>
                  {category && (
                    <Link to={`/collections/${category.slug}`} className={!subcategoryEntry ? 'on' : ''}>
                      {category.title}
                    </Link>
                  )}
                  {subcategoryEntry && (
                    <Link to={`/collections/${category.slug}/${subcategoryEntry.slug}`} className="on">
                      {subcategoryEntry.title}
                    </Link>
                  )}
                </>
              )}
            </div>
            <div className="collection-filter-controls desktop-collection-filter-controls" ref={filterControlsRef}>
              <div className="collection-filter-menu">
                <button
                  className="collection-filter-trigger"
                  type="button"
                  aria-expanded={openFilter === 'availability'}
                  aria-controls="availability-filter-panel"
                  onClick={() => setOpenFilter((current) => (
                    current === 'availability' ? '' : 'availability'
                  ))}
                >
                  Availability <span className="collection-filter-chevron" aria-hidden="true" />
                </button>
                {openFilter === 'availability' && (
                  <div className="collection-filter-panel" id="availability-filter-panel"
                    role="dialog" aria-label="Availability filters">
                    <div className="collection-filter-panel-header">
                      <span>{availabilityFilter ? '1 selected' : '0 selected'}</span>
                      <button type="button" onClick={() => setAvailabilityFilter('')}>Reset</button>
                    </div>
                    <label className="collection-filter-option">
                      <input
                        type="radio"
                        name="availability"
                        checked={availabilityFilter === 'in-stock'}
                        onChange={() => setAvailabilityFilter('in-stock')}
                      />
                      <span>In stock ({availableCount})</span>
                    </label>
                    <label className="collection-filter-option">
                      <input
                        type="radio"
                        name="availability"
                        checked={availabilityFilter === 'out-of-stock'}
                        onChange={() => setAvailabilityFilter('out-of-stock')}
                      />
                      <span>Out of stock ({unavailableCount})</span>
                    </label>
                  </div>
                )}
              </div>
              <div className="collection-filter-menu">
                <button
                  className="collection-filter-trigger"
                  type="button"
                  aria-expanded={openFilter === 'price'}
                  aria-controls="price-filter-panel"
                  onClick={() => setOpenFilter((current) => (current === 'price' ? '' : 'price'))}
                >
                  Price <span className="collection-filter-chevron" aria-hidden="true" />
                </button>
                {openFilter === 'price' && (
                  <div className="collection-filter-panel collection-price-panel" id="price-filter-panel"
                    role="dialog" aria-label="Price filters">
                    <div className="collection-filter-panel-header">
                      <span>Highest price is {money(highestPrice, currencyCode)}</span>
                      <button type="button" onClick={() => {
                        setMinimumPrice('');
                        setMaximumPrice('');
                      }}>Reset</button>
                    </div>
                    <div className="collection-price-inputs">
                      <label>
                        <span>{currencySymbol}</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          aria-label="Minimum price"
                          placeholder="From"
                          value={minimumPrice}
                          onChange={(event) => setMinimumPrice(event.target.value)}
                        />
                      </label>
                      <label>
                        <span>{currencySymbol}</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          aria-label="Maximum price"
                          placeholder="To"
                          value={maximumPrice}
                          onChange={(event) => setMaximumPrice(event.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
              <span className="collection-result-count">{list.length} items</span>
              <label className="collection-sort-control">
                <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)}>
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="collection-mobile-filter-controls">
              <button
                className="collection-mobile-filter-button"
                type="button"
                aria-haspopup="dialog"
                aria-expanded={mobileFilterOpen}
                aria-controls="mobile-collection-filter-dialog"
                onClick={() => setMobileFilterOpen(true)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 6h16M7 12h10m-7 6h4" />
                  <circle cx="8" cy="6" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="11" cy="18" r="1.5" />
                </svg>
                <span>Filter</span>
                {activeMobileFilterCount > 0 && (
                  <span className="collection-mobile-filter-count">{activeMobileFilterCount}</span>
                )}
              </button>
              <span className="collection-result-count">{list.length} items</span>
            </div>
          </Reveal>
          <dialog
            className="collection-mobile-filter-dialog"
            id="mobile-collection-filter-dialog"
            ref={mobileFilterDialogRef}
            aria-labelledby="mobile-collection-filter-title"
            onCancel={(event) => {
              event.preventDefault();
              setMobileFilterOpen(false);
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) setMobileFilterOpen(false);
            }}
          >
            <div className="collection-mobile-dialog-header">
              <div>
                <h2 id="mobile-collection-filter-title">Filters and sorting</h2>
                <span>{list.length} items</span>
              </div>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setMobileFilterOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="collection-mobile-dialog-content">
              <section className="collection-mobile-dialog-section">
                <div className="collection-mobile-dialog-section-header">
                  <h3>Availability</h3>
                  <button type="button" onClick={() => setAvailabilityFilter('')}>Reset</button>
                </div>
                <label className="collection-filter-option">
                  <input
                    type="radio"
                    name="mobile-availability"
                    checked={availabilityFilter === 'in-stock'}
                    onChange={() => setAvailabilityFilter('in-stock')}
                  />
                  <span>In stock ({availableCount})</span>
                </label>
                <label className="collection-filter-option">
                  <input
                    type="radio"
                    name="mobile-availability"
                    checked={availabilityFilter === 'out-of-stock'}
                    onChange={() => setAvailabilityFilter('out-of-stock')}
                  />
                  <span>Out of stock ({unavailableCount})</span>
                </label>
              </section>
              <section className="collection-mobile-dialog-section">
                <div className="collection-mobile-dialog-section-header">
                  <h3>Price</h3>
                  <button type="button" onClick={() => {
                    setMinimumPrice('');
                    setMaximumPrice('');
                  }}>Reset</button>
                </div>
                <p className="collection-mobile-price-hint">
                  Highest price is {money(highestPrice, currencyCode)}
                </p>
                <div className="collection-price-inputs">
                  <label>
                    <span>{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label="Minimum price"
                      placeholder="From"
                      value={minimumPrice}
                      onChange={(event) => setMinimumPrice(event.target.value)}
                    />
                  </label>
                  <label>
                    <span>{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label="Maximum price"
                      placeholder="To"
                      value={maximumPrice}
                      onChange={(event) => setMaximumPrice(event.target.value)}
                    />
                  </label>
                </div>
              </section>
              <section className="collection-mobile-dialog-section">
                <h3>Sort by</h3>
                <label className="collection-mobile-sort-control">
                  <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)}>
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </section>
            </div>
            <div className="collection-mobile-dialog-footer">
              <button type="button" onClick={() => {
                setAvailabilityFilter('');
                setMinimumPrice('');
                setMaximumPrice('');
                setSort('best-selling');
              }}>Clear all</button>
              <button type="button" onClick={() => setMobileFilterOpen(false)}>
                Show {list.length} items
              </button>
            </div>
          </dialog>
          {error && (
            <p role="alert">
              {error}{' '}
              <button className="link" onClick={() => setAttempt((current) => current + 1)} type="button">
                Try again
              </button>
            </p>
          )}
          {loading ? <ProductGridSkeleton isParentCategory={isParentCategory} /> : (
            <Reveal className={`grid rev-stagger${isParentCategory ? ' category-product-grid' : ''}`}>
              {list.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  subcategoryBadge={product.subcategoryBadge}
                />
              ))}
              {list.length === 0 && !error && (
                <p>
                  {subcategoryFilter || availabilityFilter || minimumPrice !== '' || maximumPrice !== ''
                    ? 'No products match the selected filters.'
                    : subcategoryEntry
                      ? 'No products in this subcategory yet.'
                      : category ? 'No products in this category yet.' : 'No products in this collection yet.'}
                </p>
              )}
            </Reveal>
          )}
          {pageInfo?.hasNextPage && (
            <div className="ctr">
              <button className="btn o" disabled={loadingMore} onClick={loadMore} type="button">
                {loadingMore ? 'Loading…' : 'Load more products'}
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
