// Mock for nuqs (ESM module) to avoid import errors in tests
export const useQueryState = () => [null, () => {}];
export const parseAsString = () => ({});
export const parseAsInteger = () => ({});
export const parseAsBoolean = () => ({});

