import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const NOMBRE_COOKIE = "reuk_admin_session";

async function sesionValida(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secreto = process.env.SESSION_SECRET;
  if (!secreto) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secreto));
    return payload.admin === true;
  } catch {
    return false;
  }
}

/**
 * Chequeo optimista (solo la cookie, sin tocar la base de datos) para
 * mantener /admin fuera del alcance de quien no inició sesión. Cada Server
 * Action del panel vuelve a verificar la sesión por su cuenta — este proxy
 * es la primera barrera, no la única.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(NOMBRE_COOKIE)?.value;
  if (!(await sesionValida(token))) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
