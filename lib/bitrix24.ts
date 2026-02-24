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
  const token = getAccessToken(userId);
  if (!token) return null;

  const response = await fetch(
    `${BITRIX24_DOMAIN}/rest/user.current.json?auth=${token}`
  );

  if (!response.ok) return null;

  const data = await response.json();
  return data.result;
}

export async function getBitrix24Groups(userId: string) {
  const token = getAccessToken(userId);
  if (!token) return null;

  const response = await fetch(
    `${BITRIX24_DOMAIN}/rest/sonet_group.get.json?auth=${token}`
  );

  if (!response.ok) return null;

  const data = await response.json();
  return data.result;
}
