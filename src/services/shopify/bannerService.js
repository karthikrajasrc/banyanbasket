import { HOME_PAGE_BANNERS_QUERY } from './queries.js';
import { shopifyRequest } from './shopifyClient.js';

let cache;

export async function getHomePageBanners({ first = 50, after = null } = {}) {
  const cacheKey = `${first}:${after || ''}`;
  if (cache?.key === cacheKey && cache.expiresAt > Date.now()) return cache.value;

  const data = await shopifyRequest(HOME_PAGE_BANNERS_QUERY, { first, after });
  const connection = data.metaobjects;
  const banners = connection.edges
    .map(({ node }) => ({
      _id: node.id,
      handle: node.handle,
      title: `Featured banner ${node.handle}`,
      active: node.active?.value === 'true',
      position: Number(node.position?.value) || 0,
      desktopImageUrl: node.desktopImage?.reference?.image?.url || '',
      mobileImageUrl: node.mobileImage?.reference?.image?.url || '',
    }))
    .filter((banner) => banner.active && (banner.desktopImageUrl || banner.mobileImageUrl))
    .sort((a, b) => a.position - b.position);
  const value = { banners, pageInfo: connection.pageInfo };
  cache = { key: cacheKey, value, expiresAt: Date.now() + 30_000 };
  return value;
}
