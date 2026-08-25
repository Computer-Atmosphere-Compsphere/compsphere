import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "@compsphere/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.betterAuthUsers,
      session: schema.betterAuthSessions,
      account: schema.betterAuthAccounts,
      verification: schema.betterAuthVerifications,
    },
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret-change-in-production",
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // refresh if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minute cookie cache
    },
  },
  advanced: {
    useSecureCookies: false,           // Allow HTTP cookies on localhost dev
    crossSubDomainCookies: {
      enabled: false,
    },
    cookies: {
      session_token: {
        attributes: {
          sameSite: "lax",
          secure: false,               // Must be false for HTTP localhost
        },
      },
    },
  },
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:3001",
  ],
});

export type Auth = typeof auth;
