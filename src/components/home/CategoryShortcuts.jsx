import { Link } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext.jsx';
import Reveal from '../ui/Reveal.jsx';

export default function CategoryShortcuts() {
  const { roots } = useCatalog();
  const sortedCollections = [...roots].sort((a, b) => a.title.localeCompare(b.title));
  const shortcuts = [
    { id: 'shop-all', label: 'Shop All', to: '/collections/all', shopAll: true },
    ...sortedCollections.map((collection) => ({
      id: collection._id,
      label: collection.name,
      imageUrl: collection.imageUrl,
      to: `/collections/${collection.slug}`,
    })),
  ];

  return (
    <Reveal as="nav" className="category-shortcuts rev-stagger" aria-label="Shop categories">
      {shortcuts.map((shortcut) => (
        <Link className="category-shortcut" key={shortcut.id} to={shortcut.to}>
          <span className="category-icon">
            {shortcut.shopAll ? (
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <rect x="7" y="7" width="14" height="14" rx="3" />
                <rect x="27" y="7" width="14" height="14" rx="3" />
                <rect x="7" y="27" width="14" height="14" rx="3" />
                <rect x="27" y="27" width="14" height="14" rx="3" />
              </svg>
            ) : shortcut.imageUrl ? (
              <img src={shortcut.imageUrl} alt="" width="64" height="64" loading="lazy" />
            ) : null}
          </span>
          <span>{shortcut.label}</span>
        </Link>
      ))}
    </Reveal>
  );
}
