// Mock for runtime-init.js to avoid ESM import errors in tests
// This file is excluded from coverage and only used for test setup
module.exports = {
  ensureDatabaseInitialized: async () => {},
};

