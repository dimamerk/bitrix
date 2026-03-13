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

            // server_endpoint — для серверных вызовов (Next.js backend → Bitrix24)
            // client_endpoint — для вызовов из браузера (user-context)
            // domain: "oauth.bitrix24.tech" означает токен выдан центральным сервером
            const serverEndpoint = raw?.server_endpoint?.replace(/\/$/, "") ?? restEndpoint;
            console.log("[auth] restEndpoint (client):", restEndpoint);
            console.log("[auth] serverEndpoint:", serverEndpoint);
            console.log("[auth] userId from token:", userId);

            const memberId = raw?.member_id;
            console.log("[auth] memberId:", memberId);

            // app.info через server_endpoint работает — токен валиден
            // user.get через server_endpoint возвращает 404 — метод недоступен там напрямую
            //
            // Для marketplace-приложений Bitrix24 поддерживает прокси:
            //   oauth.bitrix24.tech/rest/{member_id}/{method} → форвард на локальный портал
            const proxyEndpoint = `${serverEndpoint}/${memberId}`;
            console.log("[auth] proxyEndpoint:", proxyEndpoint);

            const proxyUserGet = await fetch(
              `${proxyEndpoint}/user.get.json?auth=${tokens.accessToken}&ID=${userId}`
            );
            const proxyUserGetBody = await proxyUserGet.text();
            console.log("[auth] proxy/user.get status:", proxyUserGet.status, "body:", proxyUserGetBody.slice(0, 500));

            const proxyProfile = await fetch(
              `${proxyEndpoint}/profile.json?auth=${tokens.accessToken}`
            );
            const proxyProfileBody = await proxyProfile.text();
            console.log("[auth] proxy/profile status:", proxyProfile.status, "body:", proxyProfileBody.slice(0, 500));

            throw new Error("Diagnostic: check proxy results above");
          },
        },
      ],
    }),
  ],
});
