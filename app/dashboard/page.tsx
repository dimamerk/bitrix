import { auth } from "@/lib/auth";
import { getBitrix24User, getBitrix24Groups } from "@/lib/bitrix24";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  console.log("[dashboard] loading session");
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    console.log("[dashboard] no session, redirecting to /login");
    redirect("/login");
  }

  console.log("[dashboard] session OK, userId:", session.user.id, "email:", session.user.email);

  const [bitrixUser, bitrixGroups] = await Promise.all([
    getBitrix24User(session.user.id),
    getBitrix24Groups(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>

      <div className="mb-6 rounded-lg border p-6">
        <div className="flex items-center gap-4">
          {session.user.image && (
            <img
              src={session.user.image}
              alt="Avatar"
              width={64}
              height={64}
              className="rounded-full"
            />
          )}
          <div>
            <p className="text-lg font-medium">{session.user.name}</p>
            <p className="text-gray-500">{session.user.email}</p>
            {bitrixUser?.XML_ID && (
              <p className="text-sm text-gray-400 font-mono">XML_ID: {String(bitrixUser.XML_ID)}</p>
            )}
          </div>
        </div>
      </div>

      {bitrixGroups && Array.isArray(bitrixGroups) && bitrixGroups.length > 0 && (
        <div className="mt-6 rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Группы Bitrix24</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left font-medium text-gray-500">ID</th>
                  <th className="py-2 pr-4 text-left font-medium text-gray-500">Название</th>
                  <th className="py-2 text-left font-medium text-gray-500">Описание</th>
                </tr>
              </thead>
              <tbody>
                {bitrixGroups.map((group: Record<string, unknown>) => (
                  <tr key={String(group.GROUP_ID)} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono text-gray-500">{String(group.GROUP_ID)}</td>
                    <td className="py-2 pr-4">{String(group.GROUP_NAME || "")}</td>
                    <td className="py-2 text-gray-500">{String(group.ROLE || "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
