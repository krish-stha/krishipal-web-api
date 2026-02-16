export const endpoints = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    me: "/auth/me",
    update: (id: string) => `/auth/${id}`,
    uploadProfilePicture: "/auth/upload-profile-picture",

    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },

  admin: {
    users: "/admin/users",
    userById: (id: string) => `/admin/users/${id}`,
    softDelete: (id: string) => `/admin/users/${id}`,
    hardDelete: (id: string) => `/admin/users/${id}/hard`,

    // ✅ you said you already have these routes in admin files
    categories: "/admin/categories",
    categoryById: (id: string) => `/admin/categories/${id}`,

    products: "/admin/products",
    productById: (id: string) => `/admin/products/${id}`,
    productHardDelete: (id: string) => `/admin/products/${id}/hard`,

    carts: "/admin/carts",
    cartById: (id: string) => `/admin/carts/${id}`,
    cartSetItemQty: (id: string, productId: string) => `/admin/carts/${id}/items/${productId}`,
    cartRemoveItem: (id: string, productId: string) => `/admin/carts/${id}/items/${productId}`,
    cartClear: (id: string) => `/admin/carts/${id}/clear`,
    cartDelete: (id: string) => `/admin/carts/${id}`,

    orders: "/admin/orders",
    orderById: (id: string) => `/admin/orders/${id}`,
    orderUpdateStatus: (id: string) => `/admin/orders/${id}/status`,
    

  },

  // ✅ PUBLIC
  public: {
    products: "/products",
    productBySlug: (slug: string) => `/products/${slug}`,
    categories: "/categories", // (we'll add public categories below if you have route; if not, we’ll fetch admin categories later)
  },

  // ✅ CART
  cart: {
    base: "/cart",
    addItem: "/cart/items",
    updateItem: (productId: string) => `/cart/items/${productId}`,
    removeItem: (productId: string) => `/cart/items/${productId}`,
    clear: "/cart",
  },

    orders: {
    create: "/orders",
    myOrders: "/orders/me",
    byId: (id: string) => `/orders/${id}`,
  },

};
