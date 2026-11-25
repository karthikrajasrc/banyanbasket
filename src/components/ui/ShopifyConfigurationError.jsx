export default function ShopifyConfigurationError({ message }) {
  return (
    <main className="auth-page">
      <section className="auth-card" role="alert">
        <p className="auth-eyebrow">Banyan Basket</p>
        <h1>Store setup required</h1>
        <p className="auth-intro">{message}</p>
      </section>
    </main>
  );
}
