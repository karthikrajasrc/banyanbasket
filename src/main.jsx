import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { CatalogProvider } from './context/CatalogContext.jsx';
import AppErrorBoundary from './components/ui/AppErrorBoundary.jsx';
import ShopifyConfigurationError from './components/ui/ShopifyConfigurationError.jsx';
import { getShopifyConfigurationError } from './services/shopify/index.js';
import Toast from './components/ui/Toast.jsx';
import './styles/global.css';
import './styles/storefrontDesign.css';

document.documentElement.classList.add('js');

const app = (
  <AppErrorBoundary>
    {getShopifyConfigurationError()
      ? <ShopifyConfigurationError message={getShopifyConfigurationError()} />
      : (
        <BrowserRouter>
        <CatalogProvider>
          <CartProvider>
            <>
              <App />
              <Toast />
            </>
          </CartProvider>
        </CatalogProvider>
        </BrowserRouter>
      )}
  </AppErrorBoundary>
);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {app}
  </React.StrictMode>
);
