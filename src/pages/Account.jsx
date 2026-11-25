import { useEffect, useState } from 'react';
import Reveal from '../components/ui/Reveal.jsx';
import { getCustomerAccountUrl } from '../services/shopify/index.js';

export default function Account() {
  const [accountUrl, setAccountUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getCustomerAccountUrl()
      .then((url) => {
        if (active) setAccountUrl(url);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="auth-page">
      <Reveal className="auth-card account-card">
        <p className="auth-eyebrow">Your account</p>
        <h1>Shopify customer accounts</h1>
        <p className="auth-intro">
          Sign in with your Shopify account to manage your profile and orders.
          Account registration, sign-in, and order history are securely hosted by Shopify.
        </p>
        {loading && <p role="status">Connecting to customer accounts…</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && accountUrl && (
          <a className="btn auth-submit" href={accountUrl}>Continue to your Shopify account</a>
        )}
        {!loading && !error && !accountUrl && (
          <p role="status">
            Shopify did not return a customer account URL. Enable customer accounts and configure their
            domain in Shopify Admin to connect account sign-in and order history.
          </p>
        )}
      </Reveal>
    </section>
  );
}
