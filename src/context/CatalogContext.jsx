import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getCategoryHierarchy,
  getCollections,
  getFeaturedProducts,
  getProducts,
} from '../services/shopify/index.js';
import { CatalogContext } from './catalogContext.js';

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [productResult, collectionResult, featuredResult, categoryHierarchy] = await Promise.all([
        getProducts({ first: 12 }),
        getCollections({ first: 50 }),
        getFeaturedProducts({ first: 12 }),
        getCategoryHierarchy(),
      ]);
      setProducts(productResult.products);
      setCollections(collectionResult.collections);
      setFeaturedProducts(featuredResult.products);
      setCategories(categoryHierarchy.categories);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => {
    const categoryBySlug = Object.fromEntries(categories.map((category) => [category.slug, category]));
    const getProduct = (handle) => products.find((product) => product.handle === String(handle));
    const byCategory = (handle) => products.filter((product) => (
      handle === 'all' || product.collectionHandles.includes(handle)
    ));
    return {
      products,
      featuredProducts,
      collections,
      categories,
      roots: categories,
      loading,
      error,
      refresh,
      categoryBySlug,
      childrenOf: (category) => category?.subcategories || [],
      getProduct,
      byCategory,
    };
  }, [categories, collections, error, featuredProducts, loading, products, refresh]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error('useCatalog must be used within CatalogProvider');
  return value;
}
