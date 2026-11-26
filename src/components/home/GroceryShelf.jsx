import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext.jsx';
import ProductCard from '../ui/ProductCard.jsx';
import Reveal from '../ui/Reveal.jsx';

function getShelfCategoryRows(products, roots) {
  const rows = [...roots]
    .sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name))
    .map((category) => {
      const subcategories = category.subcategories || [];
      const handles = new Set([
        category.handle,
        category.slug,
        ...subcategories.flatMap((subcategory) => [subcategory.handle, subcategory.slug]),
      ].filter(Boolean));
      const collectionIds = new Set([
        category.collectionId,
        category.id,
        ...subcategories.flatMap((subcategory) => [subcategory.collectionId, subcategory.id]),
      ].filter(Boolean));

      return {
        id: category._id || category.id || category.slug,
        title: category.title || category.name,
        imageUrl: category.imageUrl || category.shopAllImageUrl || '',
        to: `/collections/${category.slug || category.handle}`,
        products: products.filter((product) => (
          (product.collectionHandles || []).some((handle) => handles.has(handle))
          || (product.collections || []).some((collection) => collectionIds.has(collection.id))
        )),
      };
    })
    .filter((category) => category.products.length > 0);

  if (rows.length === 0) {
    return [{
      id: 'all-groceries',
      title: 'All groceries',
      imageUrl: '',
      to: '/collections/all',
      products,
    }];
  }

  const categorizedIds = new Set(rows.flatMap((row) => row.products.map((product) => product.id)));
  const uncategorizedProducts = products.filter((product) => !categorizedIds.has(product.id));
  if (uncategorizedProducts.length) {
    rows.push({
      id: 'more-groceries',
      title: 'More groceries',
      imageUrl: '',
      to: '/collections/all',
      products: uncategorizedProducts,
    });
  }

  return rows;
}

export default function GroceryShelf() {
  const { products, featuredProducts, roots } = useCatalog();
  const shelfProducts = featuredProducts.length ? featuredProducts : products;
  const categoryRows = useMemo(
    () => getShelfCategoryRows(shelfProducts, roots),
    [roots, shelfProducts],
  );

  if (!shelfProducts.length) return null;

  return (
    <section className="sec grocery-shelf" id="grocery-shelf">
      <div className="w">
        <Reveal className="grocery-shelf-heading">
          <div>
            <h2>Everyday groceries, thoughtfully chosen</h2>
          </div>
          <Link className="link grocery-all-link" to="/collections/all">Shop all groceries <span aria-hidden="true">→</span></Link>
        </Reveal>

        {roots.length > 0 && shelfProducts.length >= 4 && (
          <Reveal className="grocery-category-links" aria-label="Browse grocery categories">
            <Link to="/collections/all">All groceries</Link>
            {roots.slice(0, 6).map((collection) => (
              <Link key={collection.id} to={`/collections/${collection.handle}`}>{collection.title}</Link>
            ))}
          </Reveal>
        )}

        <Reveal className="product-category-list rev-stagger">
          {categoryRows.map((row) => (
            <section
              className="product-category-row"
              aria-labelledby={`grocery-category-${row.id}`}
              key={row.id}
            >
              <div className="product-category-heading">
                <div className="product-category-title">
                  {row.imageUrl && <img src={row.imageUrl} alt="" loading="lazy" />}
                  <h3 id={`grocery-category-${row.id}`}>{row.title}</h3>
                </div>
                <Link to={row.to} className="product-category-see-all">
                  See all <span aria-hidden="true">›</span>
                </Link>
              </div>
              <div
                className="category-product-rail"
                role="region"
                aria-label={`${row.title} products`}
                tabIndex={0}
              >
                {row.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    hoverSecondaryImage
                    compactRail
                    showWishlist
                  />
                ))}
              </div>
            </section>
          ))}
        </Reveal>

        <div className="grocery-shelf-footer">
          <Link className="btn o" to="/collections/all">View all</Link>
        </div>
      </div>
    </section>
  );
}
