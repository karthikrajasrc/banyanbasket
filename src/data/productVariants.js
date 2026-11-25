export function getProductVariants(product) {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants;
  }
  return [{
    id: 'default',
    label: '',
    price: product.price,
    mrp: product.mrp,
    currencyCode: product.currencyCode || 'USD',
    availableForSale: product.availableForSale,
  }];
}

export function getVariantOptionName(variants) {
  const names = new Set(variants.flatMap((variant) => (
    (variant.selectedOptions || [])
      .map((option) => option.name.trim())
      .filter(Boolean)
  )));
  return names.size === 1 ? [...names][0] : null;
}

export const startingVariant = (product) => {
  const variants = getProductVariants(product);
  const available = variants.filter((variant) => variant.availableForSale !== false);
  return (available.length ? available : variants).reduce((lowest, variant) => (
    variant.price < lowest.price ? variant : lowest
  ));
};
