import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import Database from "better-sqlite3";

const BITRIX24_DOMAIN = process.env.BITRIX24_DOMAIN!;

export const auth = betterAuth({
  database: new Database("./sqlite.db"),

  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "bitrix24",
          clientId: process.env.BITRIX24_CLIENT_ID!,
          clientSecret: process.env.BITRIX24_CLIENT_SECRET!,

          authorizationUrl: `${BITRIX24_DOMAIN}/oauth/authorize/`,
          tokenUrl: `${BITRIX24_DOMAIN}/oauth/token/`,

          scopes: ["user"],

          authentication: "post",

          getUserInfo: async (tokens) => {
            console.log("[auth] getUserInfo called, accessToken present:", !!tokens.accessToken);
            const response = await fetch(
              `${BITRIX24_DOMAIN}/rest/user.current.json?auth=${tokens.accessToken}`
            );

            console.log("[auth] user.current response status:", response.status, response.statusText);

            if (!response.ok) {
              const body = await response.text().catch(() => "(unreadable)");
              console.error("[auth] getUserInfo failed, body:", body);
              throw new Error(
                `Failed to fetch Bitrix24 user info: ${response.statusText}`
              );
            }

            const data = await response.json();
            const user = data.result;
            console.log("[auth] getUserInfo success, user ID:", user?.ID, "email:", user?.EMAIL);

            return {
              id: String(user.ID),
              email: user.EMAIL,
              name: [user.NAME, user.LAST_NAME].filter(Boolean).join(" "),
              image: user.PERSONAL_PHOTO || null,
              emailVerified: true,
            };
          },
        },
      ],
    }),
  ],
});
