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

            // client_endpoint из токена уже содержит /rest/ (напр. https://domain/rest/)
            // используем его напрямую, не добавляя /rest/ повторно
            const raw = tokens.raw as Record<string, string> | undefined;
            const restEndpoint: string =
              raw?.client_endpoint?.replace(/\/$/, "") ??
              `${BITRIX24_DOMAIN}/rest`;

            const userId = raw?.user_id;
            console.log("[auth] using restEndpoint:", restEndpoint, "userId from token:", userId);

            // Диагностика: проверяем доступность REST API через app.info
            const appInfoRes = await fetch(`${restEndpoint}/app.info.json?auth=${tokens.accessToken}`);
            const appInfoBody = await appInfoRes.text();
            console.log("[auth] app.info status:", appInfoRes.status, "body:", appInfoBody);

            // Пробуем profile — специальный эндпоинт для OAuth-токенов в Bitrix24
            const profileRes = await fetch(`${restEndpoint}/profile.json?auth=${tokens.accessToken}`);
            const profileBody = await profileRes.text();
            console.log("[auth] profile status:", profileRes.status, "body:", profileBody);

            // Пробуем user.get с filter
            const userGetRes = await fetch(
              `${restEndpoint}/user.get.json?auth=${tokens.accessToken}&filter[ID]=${userId}`
            );
            const userGetBody = await userGetRes.text();
            console.log("[auth] user.get (filter) status:", userGetRes.status, "body:", userGetBody);

            // Пробуем Authorization header вместо query param
            const userGetHeaderRes = await fetch(
              `${restEndpoint}/user.get.json?filter[ID]=${userId}`,
              { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
            );
            const userGetHeaderBody = await userGetHeaderRes.text();
            console.log("[auth] user.get (header) status:", userGetHeaderRes.status, "body:", userGetHeaderBody);

            throw new Error("Diagnostic run — check logs above to see which endpoints work");
          },
        },
      ],
    }),
  ],
});
