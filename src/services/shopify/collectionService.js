import {
  COLLECTIONS_QUERY,
  COLLECTION_PRODUCTS_QUERY,
  CUSTOMER_ACCOUNT_URL_QUERY,
} from './queries.js';
import { normalizeProduct } from './productService.js';
import { shopifyRequest } from './shopifyClient.js';

const cache = new Map();
const CACHE_DURATION = 30_000;

function cachedRead(key, load) {
  const current = cache.get(key);
  if (current && current.expiresAt > Date.now()) return current.promise;
  const promise = load().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, { promise, expiresAt: Date.now() + CACHE_DURATION });
  return promise;
}

function normalizeCollection(collection) {
  return {
    id: collection.id,
    _id: collection.handle,
    handle: collection.handle,
    slug: collection.handle,
    title: collection.title,
    name: collection.title,
    description: collection.description || '',
    imageUrl: collection.image?.url || '',
    imageAlt: collection.image?.altText || collection.title,
  };
}

export function getCollections({ first = 50, after = null } = {}) {
  const key = `collections:${first}:${after || ''}`;
  return cachedRead(key, async () => {
    const data = await shopifyRequest(COLLECTIONS_QUERY, { first, after });
    return {
      collections: data.collections.edges.map(({ node }) => normalizeCollection(node)),
      pageInfo: data.collections.pageInfo,
    };
  });
}

export function getCollectionProducts(handle, { first = 24, after = null } = {}) {
  const key = `collection:${handle}:${first}:${after || ''}`;
  return cachedRead(key, async () => {
    const data = await shopifyRequest(COLLECTION_PRODUCTS_QUERY, { handle, first, after });
    if (!data.collection) return null;
    return {
      collection: normalizeCollection(data.collection),
      products: data.collection.products.edges.map(({ node }) => {
        const product = normalizeProduct(node);
        return {
          ...product,
          category: handle,
          collectionHandles: product.collectionHandles.includes(handle)
            ? product.collectionHandles
            : [...product.collectionHandles, handle],
        };
      }),
      pageInfo: data.collection.products.pageInfo,
    };
  });
}

export function getCustomerAccountUrl() {
  return cachedRead('customer-account-url', async () => {
    const data = await shopifyRequest(CUSTOMER_ACCOUNT_URL_QUERY);
    return data.shop.customerAccountUrl;
  });
}
