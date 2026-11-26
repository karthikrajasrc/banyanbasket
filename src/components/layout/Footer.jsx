import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { getFooterShopInfo } from '../../services/shopify/index.js';
import Icon from '../ui/Icon.jsx';

const policyDefinitions = [
  ['privacyPolicy', 'Privacy Policy', 'Privacy'],
  ['termsOfService', 'Terms of Service', 'Terms'],
  ['refundPolicy', 'Refund Policy', 'Refunds'],
  ['shippingPolicy', 'Shipping Policy', 'Shipping'],
];

const paymentLabels = {
  AMERICAN_EXPRESS: 'American Express',
  ANDROID_PAY: 'Android Pay',
  DINERS_CLUB: 'Diners Club',
  DISCOVER: 'Discover',
  GOOGLE_PAY: 'Google Pay',
  JCB: 'JCB',
  MASTERCARD: 'Mastercard',
  SHOPIFY_PAY: 'Shop Pay',
  VISA: 'Visa',
  APPLE_PAY: 'Apple Pay',
};

const socialProfiles = [
  {
    label: 'Instagram',
    href: import.meta.env.VITE_INSTAGRAM_URL,
    host: 'instagram.com',
    icon: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none"/>',
  },
  {
    label: 'Facebook',
    href: import.meta.env.VITE_FACEBOOK_URL,
    host: 'facebook.com',
    icon: '<path d="M14 8h3V4h-3a5 5 0 0 0-5 5v3H6v4h3v5h4v-5h3l1-4h-4V9a1 1 0 0 1 1-1Z"/>',
  },
  {
    label: 'YouTube',
    href: import.meta.env.VITE_YOUTUBE_URL,
    host: 'youtube.com',
    icon: '<path d="M22 12s0-4-1-5-3-1-9-1-8 0-9 1-1 5-1 5 0 4 1 5 3 1 9 1 8 0 9-1 1-5 1-5Z"/><path d="m10 9 5 3-5 3V9Z"/>',
  },
].filter(({ href, host }) => {
  if (typeof href !== 'string' || !href.trim()) return false;
  try {
    const url = new URL(href);
    return url.protocol === 'https:'
      && (url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
});

const lockIcon = '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15" r="1"/>';
const leafIcon = '<path d="M20 4C11 4 5 8 5 15a5 5 0 0 0 5 5c7 0 10-7 10-16Z"/><path d="M4 21c3-5 7-9 13-13"/>';
const headsetIcon = '<path d="M3 13v-1a9 9 0 0 1 18 0v1"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/><path d="M17 20a5 5 0 0 1-5 3h-1"/>';

export default function Footer() {
  const { roots } = useCatalog();
  const [shopInfo, setShopInfo] = useState(null);
  const [shopInfoError, setShopInfoError] = useState('');

  useEffect(() => {
    let active = true;
    getFooterShopInfo()
      .then((info) => {
        if (active) setShopInfo(info);
      })
      .catch((error) => {
        if (active) setShopInfoError(error.message);
      });
    return () => { active = false; };
  }, []);

  const policies = shopInfo
    ? policyDefinitions
      .map(([key, label, shortLabel]) => ({ key, label, shortLabel, href: shopInfo[key]?.url }))
      .filter((policy) => policy.href)
    : [];
  const contactUrl = shopInfo?.contactInformation?.url;
  const paymentMethods = [...new Set([
    ...(shopInfo?.paymentSettings?.acceptedCardBrands || []),
    ...(shopInfo?.paymentSettings?.supportedDigitalWallets || []),
  ])].map((method) => ({
    key: method,
    label: paymentLabels[method] || method.replace(/_/g, ' '),
  }));
  const customerLinks = [
    contactUrl && { label: 'Contact Us', href: contactUrl },
    { label: 'Track Your Order', to: '/account' },
    shopInfo?.shippingPolicy?.url && {
      label: 'Shipping & Delivery',
      href: shopInfo.shippingPolicy.url,
    },
    shopInfo?.refundPolicy?.url && {
      label: 'Returns & Refunds',
      href: shopInfo.refundPolicy.url,
    },
    contactUrl && { label: 'Order Support', href: contactUrl },
  ].filter(Boolean);

  const renderLinks = (links) => (
    <ul className="footer-link-list">
      {links.map((item) => (
        <li key={item.label}>
          {item.to
            ? <Link to={item.to}>{item.label}</Link>
            : <a href={item.href}>{item.label}</a>}
        </li>
      ))}
    </ul>
  );

  return (
    <footer className="site-footer">
      <div className="w">
        <div className="site-footer-grid">
          <section className="footer-column footer-brand" aria-label="Banyan Basket">
            <Link className="logo footer-logo" to="/" aria-label="Banyan Basket home">
              <img src="/assets/logo.jpg" width="220" height="147" alt="Banyan Basket" />
            </Link>
            <p>
              Rooted in tradition and crafted with care, Banyan Basket brings
              authentic Indian pantry staples and natural wellness essentials
              to modern homes.
            </p>
            {socialProfiles.length > 0 && (
              <nav className="footer-socials" aria-label="Social media">
                {socialProfiles.map((profile) => (
                  <a
                    className="footer-social-link"
                    href={profile.href}
                    key={profile.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Banyan Basket on ${profile.label}`}
                  >
                    <Icon d={profile.icon} size={18} />
                  </a>
                ))}
              </nav>
            )}
          </section>

          <nav className="footer-column footer-links" aria-label="Shop">
            <h3>Shop</h3>
            {renderLinks([
              ...roots.map((collection) => ({
                label: collection.title,
                to: `/collections/${collection.handle}`,
              })),
              { label: 'Shop All', to: '/collections/all' },
            ])}
          </nav>

          <nav className="footer-column footer-links" aria-label="Customer care">
            <h3>Customer Care</h3>
            {renderLinks(customerLinks)}
          </nav>

          <nav className="footer-column footer-links" aria-label="About and policies">
            <h3>About &amp; Policies</h3>
            {renderLinks([
              { label: 'Our Story', to: '/about' },
              { label: 'Why Switch?', to: '/about' },
              ...policies,
            ])}
          </nav>
        </div>

        <div className="footer-assurances" aria-label="Store information">
          <span className="footer-assurance">
            <Icon d={lockIcon} size={27} />
            Secure Shopify checkout
          </span>
          <span className="footer-assurance">
            <Icon d={leafIcon} size={27} />
            Carefully selected pantry staples
          </span>
          <span className="footer-assurance">
            <Icon d={headsetIcon} size={27} />
            {contactUrl
              ? <a href={contactUrl}>Customer support</a>
              : <Link to="/account">Manage your orders</Link>}
          </span>
        </div>

        <div className="footer-bottom">
          <span className="footer-copyright">
            Copyright © {new Date().getFullYear()} Banyan Basket.
          </span>

          <div className="footer-payments" aria-label="Accepted payment methods">
            {paymentMethods.length > 0
              ? paymentMethods.map((method) => (
                <span
                  className="footer-payment-method"
                  key={method.key}
                  aria-label={method.label}
                  title={method.label}
                >
                  {method.label}
                </span>
              ))
              : <span className="footer-payment-note">Payment options shown at checkout</span>}
          </div>

          <nav className="footer-bottom-nav" aria-label="Policies">
            {policies.map((policy) => (
              <a key={policy.label} href={policy.href}>{policy.shortLabel}</a>
            ))}
          </nav>
        </div>

        {shopInfoError && (
          <p className="footer-data-error" role="status">
            Store policies and payment details could not be loaded: {shopInfoError}
          </p>
        )}
      </div>
    </footer>
  );
}
