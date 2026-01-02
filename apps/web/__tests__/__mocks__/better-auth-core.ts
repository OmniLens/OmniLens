// Mock for better-auth (core) to avoid import errors in tests
export const betterAuth = (config: any) => ({
  api: {
    getSession: async () => null,
  },
  // Add other betterAuth API methods as needed
});

