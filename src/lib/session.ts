import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";

const NOMBRE_COOKIE = "reuk_admin_session";
const DURACION = "7d";

function claveSecreta(): Uint8Array {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto) {
    throw new Error("Falta configurar SESSION_SECRET en las variables de entorno.");
  }
  return new TextEncoder().encode(secreto);
}

/** Comparación en tiempo constante — evita filtrar la contraseña por timing. */
export function contraseñaValida(intentada: string): boolean {
  const esperada = process.env.ADMIN_PASSWORD;
  if (!esperada || !intentada) return false;
  const a = Buffer.from(intentada);
  const b = Buffer.from(esperada);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function crearSesionAdmin(): Promise<void> {
  const token = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(DURACION)
    .sign(claveSecreta());

  (await cookies()).set(NOMBRE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function haySesionAdmin(): Promise<boolean> {
  const token = (await cookies()).get(NOMBRE_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, claveSecreta());
    return payload.admin === true;
  } catch {
    return false;
  }
}

export async function cerrarSesionAdmin(): Promise<void> {
  (await cookies()).delete(NOMBRE_COOKIE);
}
