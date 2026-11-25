import {
  ADD_CART_LINES_MUTATION,
  CART_QUERY,
  CREATE_CART_MUTATION,
  REMOVE_CART_LINES_MUTATION,
  UPDATE_CART_LINES_MUTATION,
} from './queries.js';
import { shopifyRequest } from './shopifyClient.js';

function formatCart(cart) {
  if (!cart) return null;
  const lines = cart.lines.edges.map(({ node }) => {
    const merchandise = node.merchandise;
    const label = merchandise.title === 'Default Title' ? '' : merchandise.title;
    const price = Number(merchandise.price.amount);
    const compareAtPrice = Number(merchandise.compareAtPrice?.amount || 0);
    const imageUrl = merchandise.image?.url || merchandise.product.featuredImage?.url || '';
    const product = {
      id: merchandise.product.id,
      _id: merchandise.product.handle,
      handle: merchandise.product.handle,
      name: merchandise.product.title,
      title: merchandise.product.title,
      imageUrl,
      imageAlt: merchandise.image?.altText || merchandise.product.featuredImage?.altText
        || merchandise.product.title,
    };
    const variant = {
      id: merchandise.id,
      label,
      price,
      mrp: compareAtPrice,
      currencyCode: merchandise.price.currencyCode,
      availableForSale: merchandise.availableForSale,
    };
    return {
      key: node.id,
      id: node.id,
      product,
      variant,
      qty: node.quantity,
    };
  });

  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    lines,
    count: cart.totalQuantity,
    subtotal: Number(cart.cost.subtotalAmount.amount),
    total: Number(cart.cost.totalAmount.amount),
    currencyCode: cart.cost.totalAmount.currencyCode,
  };
}

function assertNoUserErrors(payload) {
  const errors = payload.userErrors || [];
  if (errors.length) {
    throw new Error(errors.map((error) => error.message).join('; '));
  }
}

export async function getCart(cartId) {
  const data = await shopifyRequest(CART_QUERY, { id: cartId });
  return formatCart(data.cart);
}

export async function createCart(lines = []) {
  const data = await shopifyRequest(CREATE_CART_MUTATION, { lines });
  const result = data.cartCreate;
  assertNoUserErrors(result);
  if (!result.cart) throw new Error('Shopify did not return a cart.');
  return getCart(result.cart.id);
}

export async function addCartLines(cartId, lines) {
  const data = await shopifyRequest(ADD_CART_LINES_MUTATION, { cartId, lines });
  assertNoUserErrors(data.cartLinesAdd);
  return getCart(cartId);
}

export async function updateCartLines(cartId, lines) {
  const data = await shopifyRequest(UPDATE_CART_LINES_MUTATION, { cartId, lines });
  assertNoUserErrors(data.cartLinesUpdate);
  return getCart(cartId);
}

export async function removeCartLines(cartId, lineIds) {
  const data = await shopifyRequest(REMOVE_CART_LINES_MUTATION, { cartId, lineIds });
  assertNoUserErrors(data.cartLinesRemove);
  return getCart(cartId);
}
