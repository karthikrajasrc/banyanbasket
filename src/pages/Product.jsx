import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductRail from '../components/ui/ProductRail.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import NotFound from './NotFound.jsx';
import { money } from '../data/products.js';
import { getProductVariants, getVariantOptionName, startingVariant } from '../data/productVariants.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { getProductByHandle } from '../services/shopify/index.js';

export default function Product() {
  const { id: handle } = useParams();
  const { products, roots } = useCatalog();
  const { add, busy: cartBusy, loading: cartLoading } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [activeDetail, setActiveDetail] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setProduct(null);
    getProductByHandle(handle)
      .then((result) => {
        if (active) setProduct(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [attempt, handle]);

  const variants = useMemo(() => (product ? getProductVariants(product) : []), [product]);
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId)
    || (product ? startingVariant(product) : null);
  const variantOptionName = getVariantOptionName(variants);

  useEffect(() => {
    setSelectedImageIndex(null);
    setSelectedVariantId('');
    setQty(1);
    setActiveDetail('');
  }, [handle]);

  if (loading) return <main className="w sec"><p role="status">Loading product…</p></main>;
  if (error) return (
    <main className="w sec">
      <p role="alert">{error}</p>
      <button className="btn o" onClick={() => setAttempt((current) => current + 1)} type="button">Try again</button>
    </main>
  );
  if (!product) return <NotFound />;

  const images = product.images.length ? product.images : [product.imageUrl].filter(Boolean);
  const variantImageIndex = images.findIndex((image) => image === selectedVariant?.imageUrl);
  const activeImageIndex = selectedImageIndex ?? (
    selectedVariant?.imageUrl ? variantImageIndex : 0
  );
  const selectedImageUrl = selectedImageIndex === null
    ? selectedVariant?.imageUrl || images[0] || product.imageUrl
    : images[selectedImageIndex] || selectedVariant?.imageUrl || product.imageUrl;
  const selectedDiscount = selectedVariant?.mrp > selectedVariant?.price
    ? Math.round((1 - selectedVariant.price / selectedVariant.mrp) * 100)
    : 0;
  const detailTabs = [
    { id: 'description', label: 'Description', content: product.description },
    { id: 'details', label: 'Product details', content: product.productType },
    { id: 'tags', label: 'More to explore', content: product.tags.join(', ') },
  ].filter((tab) => tab.content);
  const selectedDetail = detailTabs.find((tab) => tab.id === activeDetail) || detailTabs[0];
  const subcategoryMatch = roots
    .flatMap((parent) => parent.subcategories.map((subcategory) => ({ parent, subcategory })))
    .find(({ subcategory }) => product.collectionHandles.includes(subcategory.slug));
  const category = subcategoryMatch?.parent
    || roots.find((item) => product.collectionHandles.includes(item.slug));
  const subcategory = subcategoryMatch?.subcategory;
  const related = products.filter((item) => (
    item.id !== product.id && item.collectionHandles.some((collectionHandle) => (
      product.collectionHandles.includes(collectionHandle)
    ))
  )).slice(0, 6);

  return (
    <>
      <nav className="w product-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link><span aria-hidden="true">/</span>
        <Link to={category ? `/collections/${category.handle}` : '/collections/all'}>
          {category?.title || 'Shop'}
        </Link>
        {subcategory && <>
          <span aria-hidden="true">/</span>
          <Link to={`/collections/${category.slug}/${subcategory.slug}`}>{subcategory.title}</Link>
        </>}
        <span aria-hidden="true">/</span><span aria-current="page">{product.title}</span>
      </nav>
      <section className="sec" style={{ paddingBottom: 20 }}>
        <Reveal className="w pd">
          <div className="product-gallery">
            <div className="big">
              <img src={selectedImageUrl} alt={product.imageAlt || product.title} />
            </div>
            {images.length > 1 && (
              <div className="product-gallery-thumbnails" aria-label="Product images">
                {images.map((image, index) => (
                  <button className={`product-gallery-thumbnail${activeImageIndex === index ? ' selected' : ''}`}
                    key={`${image}-${index}`} type="button" aria-label={`Show product image ${index + 1}`}
                    aria-pressed={activeImageIndex === index} onClick={() => setSelectedImageIndex(index)}>
                    <img src={image} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="product-main-info">
            {category && (
              <p className="product-category-label">
                {category.title}{subcategory ? ` · ${subcategory.title}` : ''}
              </p>
            )}
            <h1>{product.title}</h1>
            {variants.length > 1 && (
              <label className="product-size-select">{variantOptionName || 'Available options'}
                <select value={selectedVariant.id} onChange={(event) => {
                  setSelectedVariantId(event.target.value);
                  setSelectedImageIndex(null);
                }}>
                  {variants.map((variant) => (
                    <option key={variant.id} value={variant.id} disabled={!variant.availableForSale}>
                      {variant.optionLabel || variant.label || 'Default'}
                      {variant.availableForSale ? '' : ' — unavailable'}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {variants.length === 1 && selectedVariant?.optionLabel && (
              <p className="product-size-label">{selectedVariant.optionLabel}</p>
            )}
            {product.description && <p className="product-short-description">{product.description}</p>}
            {!selectedVariant?.availableForSale && <p role="status">Currently unavailable</p>}
          </div>
          <aside className="product-purchase-panel" aria-label="Purchase options">
            <p className="product-purchase-label">Price</p>
            <div className="pr">
              <b>{money(selectedVariant.price, selectedVariant.currencyCode)}</b>
              {selectedDiscount > 0 && <>
                <s>{money(selectedVariant.mrp, selectedVariant.currencyCode)}</s>
                <span className="tg" style={{ position: 'static' }}>Save {selectedDiscount}%</span>
              </>}
            </div>
            <div className="buy">
              <div className="q lg">
                <button onClick={() => setQty((current) => Math.max(1, current - 1))} aria-label="Decrease quantity">−</button>
                <span>{qty}</span>
                <button onClick={() => setQty((current) => current + 1)} aria-label="Increase quantity">+</button>
              </div>
              <button className="btn" disabled={!selectedVariant.availableForSale || cartBusy || cartLoading}
                onClick={() => add(qty, selectedVariant)}>Add to cart</button>
            </div>
            <p className="product-delivery-note">Shipping and delivery charges are shown at checkout.</p>
          </aside>
        </Reveal>
      </section>
      {detailTabs.length > 0 && (
        <section className="sec product-information">
          <Reveal className="w">
            <div className="product-detail-tabs" role="tablist" aria-label="Product information">
              {detailTabs.map((tab) => (
                <button id={`product-tab-${tab.id}`} key={tab.id} type="button" role="tab"
                  aria-selected={selectedDetail.id === tab.id} aria-controls={`product-panel-${tab.id}`}
                  className={selectedDetail.id === tab.id ? 'active' : ''}
                  onClick={() => setActiveDetail(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
            {detailTabs.map((tab, index) => (
              <div className="product-detail-panel" id={`product-panel-${tab.id}`} key={tab.id}
                role="tabpanel" aria-labelledby={`product-tab-${tab.id}`} hidden={selectedDetail.id !== tab.id}>
                <h2>{tab.label}</h2><p>{tab.content}</p>
              </div>
            ))}
          </Reveal>
        </section>
      )}
      {related.length > 0 && <ProductRail title="You may also like" category={product.category} limit={6} excludeId={product.handle} />}
    </>
  );
}
