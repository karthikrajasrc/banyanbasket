import { Link } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext.jsx';

export default function MobileDrawer({ open, onClose }) {
  const { roots } = useCatalog();
  return (
    <aside className={`dr l${open ? ' on' : ''}`} aria-label="Menu" aria-hidden={!open}>
      <div className="dh"><h3>Menu</h3><button className="ib" onClick={onClose} aria-label="Close menu">✕</button></div>
      <div className="db">
        <div className="row"><Link to="/" onClick={onClose}>Home</Link></div>
        <div className="row">Shop all products</div>
        {roots.map((category) => (
          <div className="row mobile-drawer-category" key={category._id}>
            <Link to={`/collections/${category.slug}`} onClick={onClose}>{category.name}</Link>
          </div>
        ))}
        <div className="row"><Link to="/about" onClick={onClose}>About Us</Link></div>
      </div>
    </aside>
  );
}
