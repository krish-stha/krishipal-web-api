// frontend/lib/api/endpoints.ts

export const endpoints = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    me: "/auth/me",
    update: (id: string) => `/auth/${id}`,
    uploadProfilePicture: "/auth/upload-profile-picture",
  },

  admin: {
    users: "/admin/users",
    userById: (id: string) => `/admin/users/${id}`,
    softDelete: (id: string) => `/admin/users/${id}`,      // ✅ readability
    hardDelete: (id: string) => `/admin/users/${id}/hard`,
  },
};
