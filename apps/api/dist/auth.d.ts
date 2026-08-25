export declare const auth: import("better-auth").Auth<{
    database: (options: import("better-auth").BetterAuthOptions) => import("better-auth").DBAdapter<import("better-auth").BetterAuthOptions>;
    baseURL: string;
    secret: string;
    socialProviders: {
        google: {
            clientId: string;
            clientSecret: string;
        };
    };
    session: {
        expiresIn: number;
        updateAge: number;
        cookieCache: {
            enabled: true;
            maxAge: number;
        };
    };
    advanced: {
        useSecureCookies: boolean;
        crossSubDomainCookies: {
            enabled: false;
        };
        cookies: {
            session_token: {
                attributes: {
                    domain?: string | undefined;
                    sameSite: "lax";
                    secure: boolean;
                };
            };
        };
    };
    trustedOrigins: string[];
}>;
export type Auth = typeof auth;
//# sourceMappingURL=auth.d.ts.map