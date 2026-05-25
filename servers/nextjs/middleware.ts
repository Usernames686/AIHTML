import { NextRequest, NextResponse } from "next/server";

/**
 * API-only: session required for all /api/* except auth and telemetry.
 * Page routes are protected in server layouts (unknown URLs still 404; login uses relative redirects).
 */
function getFastApiBaseUrl(request: NextRequest): string {
  const internal = process.env.FAST_API_INTERNAL_URL?.trim();
  if (internal) {
    return internal.replace(/\/+$/, "");
  }
  const configured = process.env.NEXT_PUBLIC_FAST_API?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://127.0.0.1:8000";
  }
  return "http://127.0.0.1:8000";
}

type AuthStatus = {
  configured: boolean;
  authenticated: boolean;
};

function isAuthDisabled(): boolean {
  const raw = process.env.DISABLE_AUTH?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

const SESSION_COOKIE_NAME = "presenton_session";

async function getAuthStatus(request: NextRequest): Promise<AuthStatus> {
  const cookieHeader = request.headers.get("cookie");
  const authStatusUrl = `${getFastApiBaseUrl(request)}/api/v1/auth/status`;
  try {
    const response = await fetch(authStatusUrl, {
      method: "GET",
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!response.ok) {
      return { configured: true, authenticated: false };
    }
    const payload = (await response.json()) as Partial<AuthStatus>;
    return {
      configured: Boolean(payload.configured),
      authenticated: Boolean(payload.authenticated),
    };
  } catch {
    return { configured: true, authenticated: false };
  }
}

function isApiAuthExempt(pathname: string): boolean {
  return (
    pathname.startsWith("/api/v1/auth/") ||
    pathname.startsWith("/api/v1/ppt/slidecraft/") ||
    pathname === "/api/telemetry-status" ||
    pathname === "/api/can-change-keys" ||
    pathname === "/api/user-config"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAuthDisabled()) {
    return NextResponse.next();
  }

  if (request.method === "OPTIONS" || isApiAuthExempt(pathname)) {
    return NextResponse.next();
  }

  const authStatus = await getAuthStatus(request);
  if (authStatus.authenticated) {
    return NextResponse.next();
  }
  if (!authStatus.configured) {
    return NextResponse.json(
      { detail: "Login setup is required", setup_required: true },
      { status: 428, headers: { "Cache-Control": "no-store" } }
    );
  }
  return NextResponse.json(
    { detail: "Unauthorized" },
    { status: 401, headers: { "Cache-Control": "no-store" } }
  );
}

export const config = {
  matcher: ["/api/:path*"],
};
