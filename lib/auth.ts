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
          // Для on-premise Bitrix24 токены выдаёт oauth.bitrix24.tech, а не локальный сервер
          tokenUrl: process.env.BITRIX24_TOKEN_URL ?? "https://oauth.bitrix24.tech/oauth/token/",

          scopes: ["user"],

          authentication: "post",

          getUserInfo: async (tokens) => {
            console.log("[auth] getUserInfo tokens:", {
              accessToken: tokens.accessToken ? tokens.accessToken.slice(0, 20) + "..." : null,
              refreshToken: tokens.refreshToken ? tokens.refreshToken.slice(0, 10) + "..." : null,
              tokenType: tokens.tokenType,
              idToken: tokens.idToken ? tokens.idToken.slice(0, 10) + "..." : null,
              raw: tokens.raw ? JSON.stringify(tokens.raw) : "(no raw field)",
            });

            // Bitrix24 возвращает client_endpoint в raw-ответе токена — нужно использовать его,
            // а не статический BITRIX24_DOMAIN, иначе получим "invalid_token"
            const clientEndpoint: string =
              (tokens.raw as Record<string, string> | undefined)?.client_endpoint?.replace(/\/$/, "") ??
              BITRIX24_DOMAIN;

            console.log("[auth] using endpoint:", clientEndpoint);

            const response = await fetch(
              `${clientEndpoint}/rest/user.current.json?auth=${tokens.accessToken}`
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
