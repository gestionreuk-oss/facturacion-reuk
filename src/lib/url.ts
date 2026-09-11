import "server-only";
import { headers } from "next/headers";

/** Origen (protocolo + host) de la petición actual, para armar links absolutos. */
export async function obtenerUrlBase(): Promise<string> {
  const encabezados = await headers();
  const host = encabezados.get("host") ?? "facturacion-reuk.vercel.app";
  const proto = encabezados.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}
