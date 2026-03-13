import Database from "better-sqlite3";

const BITRIX24_DOMAIN = process.env.BITRIX24_DOMAIN!;

function getAccessToken(userId: string): string | null {
  const db = new Database("./sqlite.db");
  const account = db.prepare(
    `SELECT accessToken FROM account WHERE userId = ? AND providerId = 'bitrix24'`
  ).get(userId) as { accessToken: string } | undefined;
  db.close();
  return account?.accessToken ?? null;
}

export async function getBitrix24User(userId: string) {
  console.log("[bitrix24] getBitrix24User called, userId:", userId);
  const token = getAccessToken(userId);
  if (!token) {
    console.warn("[bitrix24] no access token found for userId:", userId);
    return null;
  }

  const response = await fetch(
    `${BITRIX24_DOMAIN}/rest/user.current.json?auth=${token}`
  );
  console.log("[bitrix24] user.current status:", response.status);

  if (!response.ok) {
    console.error("[bitrix24] getBitrix24User failed:", response.status, response.statusText);
    return null;
  }

  const data = await response.json();
  console.log("[bitrix24] getBitrix24User success, ID:", data.result?.ID);
  return data.result;
}

export async function getBitrix24Groups(userId: string) {
  console.log("[bitrix24] getBitrix24Groups called, userId:", userId);
  const token = getAccessToken(userId);
  if (!token) {
    console.warn("[bitrix24] no access token found for userId:", userId);
    return null;
  }

  const response = await fetch(
    `${BITRIX24_DOMAIN}/rest/sonet_group.user.groups.json?auth=${token}`
  );
  console.log("[bitrix24] sonet_group.user.groups status:", response.status);

  if (!response.ok) {
    console.error("[bitrix24] getBitrix24Groups failed:", response.status, response.statusText);
    return null;
  }

  const data = await response.json();
  console.log("[bitrix24] getBitrix24Groups success, count:", Array.isArray(data.result) ? data.result.length : "non-array");
  return data.result;
}
