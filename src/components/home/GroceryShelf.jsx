import { Link } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext.jsx';
import ProductCard from '../ui/ProductCard.jsx';
import Reveal from '../ui/Reveal.jsx';

export default function GroceryShelf() {
  const { products, featuredProducts, roots } = useCatalog();
  const shelfProducts = featuredProducts.length ? featuredProducts : products;

  if (!shelfProducts.length) return null;

  return (
    <section className="sec grocery-shelf" id="grocery-shelf">
      <div className="w">
        <Reveal className="grocery-shelf-heading">
          <div>
            <span className="grocery-eyebrow">Good things for your pantry</span>
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

        <Reveal className={`grid grocery-product-grid rev-stagger$        {shelfProducts.length < 4 ? ' grocery-product-grid-limited' : ''}`}>
        {shelfProducts.map((product) => (
            <ProductCard key={product.id} product={product} hoverSecondaryImage />
          ))}
        </Reveal>

        <div className="grocery-shelf-footer">
        <span>
          {featuredProducts.length
            ? `${featuredProducts.length} featured Shopify products`
            : `${shelfProducts.length} Shopify products`}
        </span>
          <Link className="btn o" to="/collections/all">Explore the full pantry</Link>
        </div>
      </div>
    </section>
  );
}
