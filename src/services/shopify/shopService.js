import { FOOTER_SHOP_INFO_QUERY } from './queries.js';
import { shopifyRequest } from './shopifyClient.js';

export async function getFooterShopInfo() {
  const data = await shopifyRequest(FOOTER_SHOP_INFO_QUERY);
  return data.shop;
}
