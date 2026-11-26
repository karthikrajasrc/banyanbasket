export const PRODUCT_FIELDS = `
  id
  handle
  title
  createdAt
  description
  productType
  tags
  availableForSale
  featuredImage {
    url(transform: { maxWidth: 900, preferredContentType: WEBP })
    altText
  }
  images(first: 6) {
    edges {
      node {
        url(transform: { maxWidth: 1200, preferredContentType: WEBP })
        altText
      }
    }
  }
  priceRange {
    minVariantPrice { amount currencyCode }
  }
  compareAtPriceRange {
    maxVariantPrice { amount currencyCode }
  }
  variants(first: 50) {
    edges {
      node {
        id
        title
        availableForSale
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
        image {
          url(transform: { maxWidth: 900, preferredContentType: WEBP })
          altText
        }
        selectedOptions { name value }
      }
    }
  }
  collections(first: 50) {
    edges {
      node { id handle title }
    }
  }
`;

export const PRODUCTS_QUERY = `
  query Products($first: Int!, $after: String, $query: String) @inContext(country: US) {
    products(first: $first, after: $after, query: $query, sortKey: BEST_SELLING) {
      edges { cursor node { ${PRODUCT_FIELDS} } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) @inContext(country: US) {
    product(handle: $handle) { ${PRODUCT_FIELDS} }
  }
`;

export const COLLECTIONS_QUERY = `
  query Collections($first: Int!, $after: String) @inContext(country: US) {
    collections(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          handle
          title
          description
          image {
            url(transform: { maxWidth: 1200, preferredContentType: WEBP })
            altText
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const CATEGORY_METAOBJECTS_QUERY = `
  query CategoryMetaobjects($first: Int!, $after: String) {
    metaobjects(type: "category", first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          handle
          collection: field(key: "category_collection") {
            reference {
              ... on Collection {
                id
                handle
                title
                description
                image {
                  url(transform: { maxWidth: 1000, preferredContentType: WEBP })
                  altText
                }
              }
            }
          }
          image: field(key: "category_image") {
            reference {
              ... on MediaImage {
                image {
                  url(transform: { maxWidth: 1200, preferredContentType: WEBP })
                }
              }
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const SUBCATEGORY_METAOBJECTS_QUERY = `
  query SubcategoryMetaobjects($first: Int!, $after: String) {
    metaobjects(type: "subcategory", first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          handle
          parentCategory: field(key: "parent_category") {
            reference {
              ... on Metaobject { id handle }
            }
          }
          collection: field(key: "subcategory_collection") {
            reference {
              ... on Collection {
                id
                handle
                title
                description
                image {
                  url(transform: { maxWidth: 1000, preferredContentType: WEBP })
                  altText
                }
              }
            }
          }
          image: field(key: "subcategory_image") {
            reference {
              ... on MediaImage {
                image {
                  url(transform: { maxWidth: 1000, preferredContentType: WEBP })
                }
              }
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const COLLECTION_PRODUCTS_QUERY = `
  query CollectionProducts($handle: String!, $first: Int!, $after: String) @inContext(country: US) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        url(transform: { maxWidth: 1200, preferredContentType: WEBP })
        altText
      }
      products(first: $first, after: $after, sortKey: BEST_SELLING) {
        edges { cursor node { ${PRODUCT_FIELDS} } }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

export const SEARCH_PRODUCTS_QUERY = `
  query SearchProducts($query: String!, $first: Int!) @inContext(country: US) {
    search(query: $query, first: $first, types: [PRODUCT]) {
      edges {
        node {
          ... on Product { ${PRODUCT_FIELDS} }
        }
      }
    }
  }
`;

export const CART_QUERY = `
  query Cart($id: ID!) @inContext(country: US) {
    cart(id: $id) {
      id
      checkoutUrl
      totalQuantity
      cost {
        subtotalAmount { amount currencyCode }
        totalAmount { amount currencyCode }
      }
      lines(first: 100) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                availableForSale
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                image {
                  url(transform: { maxWidth: 500, preferredContentType: WEBP })
                  altText
                }
                product {
                  id
                  handle
                  title
                  featuredImage {
                    url(transform: { maxWidth: 500, preferredContentType: WEBP })
                    altText
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const CREATE_CART_MUTATION = `
  mutation CreateCart($lines: [CartLineInput!]) @inContext(country: US) {
    cartCreate(input: { lines: $lines, buyerIdentity: { countryCode: US } }) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }
`;

export const ADD_CART_LINES_MUTATION = `
  mutation AddCartLines($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { id }
      userErrors { field message }
    }
  }
`;

export const UPDATE_CART_LINES_MUTATION = `
  mutation UpdateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { id }
      userErrors { field message }
    }
  }
`;

export const REMOVE_CART_LINES_MUTATION = `
  mutation RemoveCartLines($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { id }
      userErrors { field message }
    }
  }
`;

export const CUSTOMER_ACCOUNT_URL_QUERY = `
  query CustomerAccountUrl {
    shop { customerAccountUrl }
  }
`;

export const FOOTER_SHOP_INFO_QUERY = `
  query FooterShopInfo @inContext(country: US) {
    shop {
      contactInformation { title url }
      privacyPolicy { title url }
      refundPolicy { title url }
      shippingPolicy { title url }
      termsOfService { title url }
      paymentSettings {
        acceptedCardBrands
        supportedDigitalWallets
      }
    }
  }
`;

export const HOME_PAGE_BANNERS_QUERY = `
  query HomePageBanners($first: Int!, $after: String) @inContext(country: US) {
    metaobjects(type: "home_page_banner", first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          handle
          active: field(key: "active") { value }
          position: field(key: "position") { value }
          desktopImage: field(key: "desktop_image") {
            reference {
              ... on MediaImage {
                image {
                  url(transform: { maxWidth: 1600, preferredContentType: WEBP })
                }
              }
            }
          }
          mobileImage: field(key: "mobile_image") {
            reference {
              ... on MediaImage {
                image {
                  url(transform: { maxWidth: 1000, preferredContentType: WEBP })
                }
              }
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;
