import { SEARCH_PRODUCTS_QUERY } from './queries.js';
import { normalizeProduct } from './productService.js';
import { shopifyRequest } from './shopifyClient.js';

export async function searchProducts(term, { first = 8 } = {}) {
  const query = term.trim();
  if (!query) return [];
  const data = await shopifyRequest(SEARCH_PRODUCTS_QUERY, { query, first });
  return data.search.edges
    .map(({ node }) => normalizeProduct(node))
    .filter((product) => product.id);
}
