"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Auto-login page — this is what you link to from inside Bitrix24.
 *
 * Bitrix24 link:  https://your-app.com/auth/bitrix24
 *
 * When the user (who is already logged into Bitrix24) clicks this link,
 * the page opens in a new tab and immediately triggers the OAuth flow.
 * Bitrix24 recognizes the existing session and issues an authorization code
 * without showing a login form. The user lands on /dashboard automatically.
 */
export default function Bitrix24AutoLoginPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authClient.signIn
      .oauth2({
        providerId: "bitrix24",
        callbackURL: "/dashboard",
        errorCallbackURL: "/login?error=auth_failed",
      })
      .catch((err) => {
        console.error("Bitrix24 OAuth error:", err);
        setError("Failed to start authentication. Please try again.");
      });
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
        <p className="text-gray-600">Signing you in via Bitrix24...</p>
      </div>
    </div>
  );
}
