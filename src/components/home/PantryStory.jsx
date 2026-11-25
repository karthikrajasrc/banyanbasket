import { Link } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext.jsx';
import Reveal from '../ui/Reveal.jsx';

export default function PantryStory() {
  const { roots, products, featuredProducts } = useCatalog();
  const catalogProducts = [...featuredProducts, ...products];
  const categories = roots.slice(0, 3).map((category) => {
    const categoryProduct = catalogProducts.find((product) => (
      product.collectionHandles.includes(category.handle)
    ));

    return {
      ...category,
      imageUrl: category.imageUrl || categoryProduct?.imageUrl || '',
    };
  });

  return (
    <section className="sec pantry-story-section">
      <div className="w pantry-story-layout">
        <Reveal className="pantry-story-copy">
          <span className="pantry-story-kicker">Rooted in tradition · made for everyday</span>
          <h2>Bring a little more <em>home</em> to your table.</h2>
          <p>
            From everyday staples to the flavours you grew up with, discover trusted
            groceries for family meals, chai-time breaks and everything in between.
          </p>
          <div className="pantry-story-actions">
            <Link className="pantry-story-cta" to="/collections/all">
              Explore the pantry <span aria-hidden="true">→</span>
            </Link>
            <div className="pantry-story-stat">
              <strong>1,500<sup>+</sup></strong>
              <span>groceries and pantry favourites to discover</span>
            </div>
          </div>
        </Reveal>

        <Reveal className="pantry-story-aisles" aria-label="Explore grocery aisles">
          {categories.length ? categories.map((category, index) => (
            <Link
              className={`pantry-story-aisle pantry-story-aisle-${index + 1}`}
              key={category._id || category.handle}
              to={`/collections/${category.slug}`}
            >
              {category.imageUrl ? (
                <img src={category.imageUrl} alt="" loading="lazy" />
              ) : (
                <span className="pantry-story-aisle-art" aria-hidden="true">
                  {category.title.slice(0, 1)}
                </span>
              )}
              <span className="pantry-story-aisle-copy">
                <span>Discover the aisle</span>
                <strong>{category.title}</strong>
                <span className="pantry-story-aisle-link">
                  Shop favourites <span aria-hidden="true">↗</span>
                </span>
              </span>
            </Link>
          )) : (
            <Link className="pantry-story-aisle pantry-story-all-aisle" to="/collections/all">
              <span className="pantry-story-aisle-art" aria-hidden="true">BB</span>
              <span className="pantry-story-aisle-copy">
                <span>Start exploring</span>
                <strong>All groceries</strong>
                <span className="pantry-story-aisle-link">
                  Shop the pantry <span aria-hidden="true">↗</span>
                </span>
              </span>
            </Link>
          )}
        </Reveal>
      </div>
    </section>
  );
}
