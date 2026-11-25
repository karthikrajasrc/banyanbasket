export const money = (amount, currencyCode = 'USD') => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: currencyCode,
}).format(Number(amount) || 0);
export const discount = (p) => (p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0);
