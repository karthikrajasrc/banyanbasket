import Hero from '../components/home/Hero.jsx';
import CategoryShortcuts from '../components/home/CategoryShortcuts.jsx';
import GroceryShelf from '../components/home/GroceryShelf.jsx';
import Combos from '../components/home/Combos.jsx';
import PantryStory from '../components/home/PantryStory.jsx';
import TrustStrip from '../components/home/TrustStrip.jsx';
import Testimonials from '../components/home/Testimonials.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';

export default function Home() {
  const { error, refresh } = useCatalog();
  return (
    <>
      {error && (
        <div className="w sec" role="alert">
          <p>Shopify catalogue could not be loaded: {error}</p>
          <button className="btn o" onClick={refresh} type="button">Try again</button>
        </div>
      )}
      <CategoryShortcuts />
      <Hero />
      <GroceryShelf />
      <Combos />
      <PantryStory />
      <TrustStrip />
      <Testimonials />
    </>
  );
}
