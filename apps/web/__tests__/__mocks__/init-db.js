// Mock for init-db.js to avoid ESM import errors in tests
module.exports = {
  initializeDatabase: async () => {},
  checkDatabaseHealth: async () => ({ healthy: true }),
};

