import { PRODUCT_BY_HANDLE_QUERY, PRODUCTS_QUERY } from './queries.js';
import { shopifyRequest } from './shopifyClient.js';

const readCache = new Map();
const CACHE_DURATION = 30_000;

function cachedRead(key, load) {
  const current = readCache.get(key);
  if (current && current.expiresAt > Date.now()) return current.promise;

  const promise = load().catch((error) => {
    readCache.delete(key);
    throw error;
  });
  readCache.set(key, { promise, expiresAt: Date.now() + CACHE_DURATION });
  return promise;
}

function amount(money) {
  return money ? Number(money.amount) : 0;
}

function normalizeVariant(variant) {
  const selectedOptions = variant.selectedOptions || [];
  const options = selectedOptions.filter((option) => (
    option.value && option.value !== 'Default Title'
  ));
  const weightOption = options.find((option) => option.name.trim().toLowerCase() === 'weight');
  const label = weightOption?.value
    || options.map((option) => option.value).join(' / ')
    || (variant.title === 'Default Title' ? '' : variant.title);
  const optionLabel = options.map((option) => `${option.name}: ${option.value}`).join(' / ') || label;

  return {
    id: variant.id,
    title: variant.title,
    label,
    optionLabel,
    price: amount(variant.price),
    currencyCode: variant.price?.currencyCode || 'USD',
    mrp: amount(variant.compareAtPrice),
    availableForSale: variant.availableForSale,
    imageUrl: variant.image?.url || '',
    selectedOptions,
  };
}

export function normalizeProduct(product) {
  const collections = product.collections?.edges?.map(({ node }) => ({
    id: node.id,
    slug: node.handle,
    name: node.title,
  })) || [];
  const variants = product.variants?.edges?.map(({ node }) => normalizeVariant(node)) || [];
  const price = amount(product.priceRange?.minVariantPrice) || variants[0]?.price || 0;
  const compareAtPrice = amount(product.compareAtPriceRange?.maxVariantPrice)
    || Math.max(0, ...variants.map((variant) => variant.mrp));
  const images = product.images?.edges?.map(({ node }) => node.url).filter(Boolean) || [];
  const tags = product.tags || [];

  return {
    id: product.id,
    _id: product.handle,
    handle: product.handle,
    title: product.title,
    name: product.title,
    createdAt: product.createdAt || '',
    description: product.description || '',
    shortDescription: product.description || '',
    productType: product.productType || '',
    tags,
    availableForSale: product.availableForSale,
    imageUrl: product.featuredImage?.url || images[0] || '',
    imageAlt: product.featuredImage?.altText || product.title,
    images,
    price,
    mrp: compareAtPrice,
    currencyCode: variants[0]?.currencyCode || 'USD',
    variants,
    collections,
    collectionHandles: collections.map((collection) => collection.slug),
    category: collections[0]?.slug || '',
    showOnHome: tags.some((tag) => tag.toLowerCase() === 'featured'),
  };
}

function normalizePage(connection) {
  return {
    products: connection.edges.map(({ node }) => normalizeProduct(node)),
    pageInfo: connection.pageInfo,
  };
}

export function getProducts({ first = 24, after = null, query = null } = {}) {
  const key = `products:${first}:${after || ''}:${query || ''}`;
  return cachedRead(key, async () => {
    const data = await shopifyRequest(PRODUCTS_QUERY, { first, after, query });
    return normalizePage(data.products);
  });
}

export function getFeaturedProducts({ first = 8, after = null } = {}) {
  return getProducts({ first, after, query: 'tag:featured' });
}

export function getProductByHandle(handle) {
  return cachedRead(`product:${handle}`, async () => {
    const data = await shopifyRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
    return data.product ? normalizeProduct(data.product) : null;
  });
}
