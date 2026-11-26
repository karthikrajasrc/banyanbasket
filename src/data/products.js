export const money = (amount, currencyCode = 'USD') => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: currencyCode,
}).format(Number(amount) || 0);
export const discount = (product = {}) => {
  const rawPrice = product?.price;
  const rawMrp = product?.mrp;
  if (rawPrice === null || rawPrice === undefined || rawPrice === ''
    || rawMrp === null || rawMrp === undefined || rawMrp === '') return 0;
  const price = Number(rawPrice);
  const mrp = Number(rawMrp);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(mrp) || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};
