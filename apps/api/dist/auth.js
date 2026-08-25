import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "@compsphere/db";
const isProduction = process.env.NODE_ENV === "production";
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
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // refresh if older than 1 day
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // 5 minute cookie cache
        },
    },
    advanced: {
        useSecureCookies: isProduction,
        crossSubDomainCookies: {
            enabled: false,
        },
        cookies: {
            session_token: {
                attributes: {
                    sameSite: "lax",
                    secure: isProduction,
                    ...(isProduction && process.env.COOKIE_DOMAIN
                        ? { domain: process.env.COOKIE_DOMAIN }
                        : {}),
                },
            },
        },
    },
    trustedOrigins: [
        "http://localhost:5173",
        "http://localhost:3001",
        "https://compsphere12.id",
        "https://www.compsphere12.id",
        "https://api.compsphere12.id",
    ],
});
//# sourceMappingURL=auth.js.map