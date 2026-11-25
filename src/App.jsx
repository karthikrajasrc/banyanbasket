import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import Home from './pages/Home.jsx';
import Collection from './pages/Collection.jsx';
import Product from './pages/Product.jsx';
import About from './pages/About.jsx';
import NotFound from './pages/NotFound.jsx';
import Account from './pages/Account.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="collections/:slug" element={<Collection />} />
        <Route path="collections/:slug/:subcategory" element={<Collection />} />
        <Route path="products/:id" element={<Product />} />
        <Route path="about" element={<About />} />
        <Route path="account" element={<Account />} />
        <Route path="login" element={<Navigate to="/account" replace />} />
        <Route path="signup" element={<Navigate to="/account" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
