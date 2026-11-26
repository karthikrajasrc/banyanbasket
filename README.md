# Banyan Basket storefront

The storefront is a Vite + React frontend. Shopify Storefront API is its source for products, collections, search, cart, and hosted checkout. No custom API server is required.

## Local setup

```bash
cd ui
npm install
npm run dev
```

Create `ui/.env.local` from `.env.example` if it does not already exist, then set:

```env
VITE_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-public-storefront-token
VITE_SHOPIFY_API_VERSION=2026-10
```

Create a **Storefront API public access token** in Shopify and make sure the storefront API has access to products, collections, customer account URLs, metaobjects, and cart writes (`unauthenticated_read_product_listings`, `unauthenticated_read_metaobjects`, `unauthenticated_write_checkouts`, and any customer-account scope Shopify requires). The token is sent by the browser to Shopify and is not an Admin API credential. Never put a Shopify Admin API token or client secret in a `VITE_` variable. The domain can be your `myshopify.com` domain or a storefront domain, without `https://`.

The app validates its configuration on startup and displays the missing variable names. After configuring the store, run `npm run build` for a production build and `npm run preview` to serve it locally. Deploy the `ui` directory as the Vercel project root; its `vercel.json` rewrites client-side routes such as `/products/:handle` and `/collections/:handle` to `index.html`, so refreshing those pages works.

## Shopify catalogue setup

- Publish products to the sales channel used by the Storefront API.
- Create Shopify collections for category navigation. Collection handles become the storefront collection URLs.
- Create Storefront-enabled `category` metaobjects with `category_collection` (collection reference) and `category_image` (image file) fields. These images are used in the Shop All mega-menu; each collection's own image remains the category icon elsewhere.
- Create Storefront-enabled `subcategory` metaobjects with `parent_category` (Category metaobject reference), `subcategory_collection` (Shopify collection reference), and `subcategory_image` (image file) fields. Add each subcategory's products to its referenced collection; category and subcategory pages use those collection references to load products.
- Add the product tag `featured` to products that should appear in the homepage featured section. Featured products in a collection whose handle or title contains “combo” appear in the Combos section.
- Add collection images to show them in the homepage carousel and category shortcuts.
- Create Storefront-enabled `home_page_banner` metaobjects with `active` (boolean), `position` (integer), `desktop_image` (file reference), and `mobile_image` (file reference) fields. Active entries render in position order in the existing responsive hero carousel.
- Product titles, descriptions, images, prices, compare-at prices, options, availability, and handles come from Shopify. Product routes use handles.
- Create pack-size variants in Shopify using an option such as `Weight`. The storefront reads each variant's selected options, price, availability, image, and merchandise ID directly from Storefront API.
- Configure the United States market and USD pricing in Shopify; the storefront formats amounts using each price's Shopify currency code.

The storefront loads product and collection pages in cursor-based batches. Cart identity is persisted as a Shopify cart ID in browser `localStorage`; cart contents and prices are reloaded from Shopify. Checkout redirects to Shopify's returned `checkoutUrl`.

## Customer accounts and administration

Customer registration, sign-in, and order history use Shopify's hosted customer account experience. `/account` links to the account URL returned by Shopify; customer accounts and their vanity domain must be configured in Shopify Admin for that URL to be available. The storefront does not implement Shopify authentication itself.

Product, collection, promotion, shipping, and payment administration must be managed in Shopify Admin. The previous custom admin dashboard and backend authentication were removed; no Admin API credentials are used by this frontend.
