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
  // In Vercel (production/preview), use the Vercel URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // For local development or custom deployments
  return process.env.BETTER_AUTH_URL || "http://localhost:3000";
}

export const auth = betterAuth({
  database: pool,
  baseURL: getBaseURL(),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    // Production
    "https://www.omnilens.xyz",
    // Local development
    "http://localhost:3000",
    // Vercel preview deployments (wildcard pattern)
    "https://omnilens-*-christopher-zeuchs-projects.vercel.app",
    // Dynamic Vercel URL (for current deployment)
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
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