// Mock for better-auth/react (ESM module) to avoid import errors in tests
export const createAuthClient = () => ({
  useSession: () => ({ data: null, isPending: false }),
  signOut: async () => {},
  signIn: async () => {},
});

