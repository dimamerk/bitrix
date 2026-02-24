"use client";

import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleBitrix24Login = async () => {
    await authClient.signIn.oauth2({
      providerId: "bitrix24",
      callbackURL: "/dashboard",
      errorCallbackURL: "/login?error=auth_failed",
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-2xl font-bold">Sign In</h1>

        {error && (
          <p className="text-sm text-red-600">
            Authentication failed. Please try again.
          </p>
        )}

        <button
          onClick={handleBitrix24Login}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 transition"
        >
          Sign in with Bitrix24
        </button>
      </div>
    </div>
  );
}
