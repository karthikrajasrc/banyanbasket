import {
  CATEGORY_METAOBJECTS_QUERY,
  SUBCATEGORY_METAOBJECTS_QUERY,
} from './queries.js';
import { shopifyRequest } from './shopifyClient.js';

const cache = new Map();
const CACHE_DURATION = 30_000;
const PAGE_SIZE = 50;

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

async function getMetaobjectNodes(query, connectionKey) {
  const nodes = [];
  let after = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await shopifyRequest(query, { first: PAGE_SIZE, after });
    const connection = data[connectionKey];
    nodes.push(...connection.edges.map(({ node }) => node));
    hasNextPage = connection.pageInfo.hasNextPage;

    if (hasNextPage && !connection.pageInfo.endCursor) {
      throw new Error(`Shopify ${connectionKey} returned an invalid pagination cursor.`);
    }
    after = connection.pageInfo.endCursor;
  }

  return nodes;
}

function normalizeCollection(collection) {
  return {
    id: collection.id,
    handle: collection.handle,
    slug: collection.handle,
    title: collection.title,
    name: collection.title,
    description: collection.description || '',
    imageUrl: collection.image?.url || '',
    imageAlt: collection.image?.altText || collection.title,
  };
}

export function getCategoryHierarchy() {
  return cachedRead('category-hierarchy', async () => {
    const [categoryNodes, subcategoryNodes] = await Promise.all([
      getMetaobjectNodes(CATEGORY_METAOBJECTS_QUERY, 'metaobjects'),
      getMetaobjectNodes(SUBCATEGORY_METAOBJECTS_QUERY, 'metaobjects'),
    ]);

    const categoriesById = new Map();
    const categories = categoryNodes.map((node) => {
      const collection = node.collection?.reference;
      if (!collection?.id || !collection.handle || !collection.title) {
        throw new Error(
          `Shopify Category "${node.handle}" must reference a collection in category_collection.`,
        );
      }

      const category = {
        ...normalizeCollection(collection),
        _id: node.id,
        metaobjectHandle: node.handle,
        collectionId: collection.id,
        shopAllImageUrl: node.image?.reference?.image?.url || '',
        subcategories: [],
      };
      categoriesById.set(node.id, category);
      return category;
    });

    subcategoryNodes.forEach((node) => {
      const parent = node.parentCategory?.reference;
      const collection = node.collection?.reference;
      if (!parent?.id || !collection?.id || !collection.handle || !collection.title) {
        throw new Error(
          `Shopify Subcategory "${node.handle}" must reference a parent category and a collection.`,
        );
      }

      const parentCategory = categoriesById.get(parent.id);
      if (!parentCategory) {
        throw new Error(
          `Shopify Subcategory "${node.handle}" references a parent category that is not available to the Storefront API.`,
        );
      }

      const imageUrl = node.image?.reference?.image?.url || '';
      parentCategory.subcategories.push({
        ...normalizeCollection(collection),
        _id: node.id,
        metaobjectHandle: node.handle,
        collectionId: collection.id,
        parentCategoryId: parent.id,
        subcategoryImageUrl: imageUrl,
      });
    });

    return {
      categories,
      subcategories: categories.flatMap((category) => category.subcategories),
    };
  });
}
