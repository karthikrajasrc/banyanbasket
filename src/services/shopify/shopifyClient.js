const storeDomain = (import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || '')
  .trim()
  .replace(/^https?:\/\//i, '')
  .replace(/\/+$/, '');
const storefrontAccessToken = (import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '').trim();
const apiVersion = (import.meta.env.VITE_SHOPIFY_API_VERSION || '2026-10').trim();

export function getShopifyConfigurationError() {
  const missing = [];
  if (!storeDomain) missing.push('VITE_SHOPIFY_STORE_DOMAIN');
  if (!storefrontAccessToken) missing.push('VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN');
  if (!apiVersion) missing.push('VITE_SHOPIFY_API_VERSION');
  return missing.length
    ? `Shopify is not configured. Set ${missing.join(', ')} in ui/.env.local, then restart the frontend.`
    : '';
}

export async function shopifyRequest(query, variables = {}) {
  const configurationError = getShopifyConfigurationError();
  if (configurationError) throw new Error(configurationError);

  let response;
  try {
    response = await fetch(`https://${storeDomain}/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (error) {
    throw new Error(`Could not connect to Shopify: ${error.message}`);
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`Shopify returned an invalid response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(result.errors?.map((error) => error.message).join('; ')
      || `Shopify request failed with HTTP ${response.status}.`);
  }
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join('; '));
  }
  if (!result.data) throw new Error('Shopify returned no data for this request.');
  return result.data;
}

