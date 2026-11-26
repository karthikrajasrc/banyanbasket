import Reveal from '../ui/Reveal.jsx';

const promises = [
  {
    id: 'shipping',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="13" width="30" height="22" rx="3" />
        <path d="M33 19h7l5 7v9h-12V19Z" />
        <circle cx="13" cy="38" r="3.5" />
        <circle cx="38" cy="38" r="3.5" />
      </svg>
    ),
    headline: 'Free Shipping on $49+',
    body: 'Enjoy free standard shipping on every order over $49, delivered right to your door across the US.',
  },
  {
    id: 'authentic',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M24 4l4.5 8.5L38 14l-7 7.5 1.5 10.5L24 27l-8.5 5L17 21.5 10 14l9.5-1.5Z" />
        <path d="M19 24l3.5 3.5 6.5-7" />
      </svg>
    ),
    headline: '100% Authentic & Natural',
    body: "Every product is hand-selected for purity. What you see on the label is exactly what's in the pack.",
  },
  {
    id: 'returns',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 20A16 16 0 1 1 10 32" />
        <path d="M4 32h8v-8" />
        <path d="M24 16v8l5 5" />
      </svg>
    ),
    headline: '30-Day Easy Returns',
    body: "Not happy? We'll make it right. Hassle-free returns within 30 days — no questions asked.",
  },
  {
    id: 'secure',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M24 4l14 6v12c0 9-6 16-14 18C16 38 10 31 10 22V10Z" />
        <path d="M18 24l4 4 8-8" />
      </svg>
    ),
    headline: 'Secure & Safe Checkout',
    body: 'Shop with confidence using industry-standard encryption and trusted payment methods every time.',
  },
];

export default function USPromise() {
  return (
    <section className="us-promise-section sec">
      <div className="w">
        <Reveal className="us-promise-header">
          <span className="us-promise-eyebrow">Our commitment to you</span>
          <h2 className="us-promise-heading">Shop with complete confidence</h2>
          <p className="us-promise-subheading">
            We hold every order to the same standard we'd want for our own family.
          </p>
        </Reveal>
        <Reveal className="us-promise-grid rev-stagger">
          {promises.map((item) => (
            <article className="us-promise-card" key={item.id}>
              <span className="us-promise-icon" aria-hidden="true">
                {item.icon}
              </span>
              <h3 className="us-promise-card-heading">{item.headline}</h3>
              <p className="us-promise-card-body">{item.body}</p>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
