import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Import runtime database initialization
import './runtime-init.js';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432"),
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
});

// Get the base URL dynamically for different environments
function getBaseURL(): string {
  // Use VERCEL_URL if available (for preview deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Use BETTER_AUTH_URL if set (for custom deployments)
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }
  
  // Default to localhost for development
  return "http://localhost:3000";
}

const baseURL = getBaseURL();
const trustedOrigins = [
  "https://www.omnilens.xyz", // Production
  "http://localhost:3000", // Local development
  "https://omnilens-*-christopher-zeuchs-projects.vercel.app", // Vercel preview pattern
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []), // Current deployment
];

export const auth = betterAuth({
  database: pool,
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  socialProviders: { 
    github: { 
      clientId: process.env.GITHUB_CLIENT_ID as string, 
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      // scope: ["repo"],
    }, 
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});