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

    // ✅ NEW
    categories: "/admin/categories",
    categoryById: (id: string) => `/admin/categories/${id}`,

    products: "/admin/products",
    productById: (id: string) => `/admin/products/${id}`,
    productHardDelete: (id: string) => `/admin/products/${id}/hard`,
  },

  public: {
    products: "/products",
    productBySlug: (slug: string) => `/products/${slug}`,
  },
};
