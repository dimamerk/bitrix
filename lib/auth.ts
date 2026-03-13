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

            if (!userId) {
              throw new Error("No user_id in token response");
            }

            // Шаг 1: верифицируем токен через server_endpoint (oauth.bitrix24.tech) — это всегда работает
            const appInfoRes = await fetch(`${serverEndpoint}/app.info.json?auth=${tokens.accessToken}`);
            if (!appInfoRes.ok) {
              throw new Error(`Token validation failed: ${appInfoRes.status}`);
            }
            const appInfo = await appInfoRes.json();
            console.log("[auth] token valid, user_id:", appInfo.result?.user_id);

            // Шаг 2: пробуем получить полные данные пользователя из портала
            // Это может не работать если портал не может проверить токен от oauth.bitrix24.tech
            // (firewall или настройки модуля REST на сервере)
            const portalDomain = BITRIX24_DOMAIN.replace(/^https?:\/\//, "");
            let userName = `Bitrix24 User ${userId}`;
            let userEmail = `bitrix24_${userId}@${portalDomain}`;
            let userImage: string | undefined = undefined;

            const portalRes = await fetch(
              `${restEndpoint}/user.current.json?auth=${tokens.accessToken} `
            );
            console.log("[auth] portal user.current status:", portalRes.status);

            if (portalRes.ok) {
              const portalData = await portalRes.json();
              const user = Array.isArray(portalData.result) ? portalData.result[0] : portalData.result;
              if (user) {
                userName = [user.NAME, user.LAST_NAME].filter(Boolean).join(" ") || userName;
                userEmail = user.EMAIL || userEmail;
                userImage = user.PERSONAL_PHOTO || undefined;
                console.log("[auth] got user from portal:", userName, userEmail);
              }
            } else {
              const errBody = await portalRes.text().catch(() => "");
              console.warn(
                "[auth] portal API unavailable (ACCESS_DENIED), using token-based fallback.",
                "Fix: убедитесь что сервер портала имеет исходящий доступ к oauth.bitrix24.tech",
                "Error:", errBody.slice(0, 200)
              );
            }

            return {
              id: String(userId),
              email: userEmail,
              name: userName,
              image: userImage,
              emailVerified: false,
            };
          },
        },
      ],
    }),
  ],
});
