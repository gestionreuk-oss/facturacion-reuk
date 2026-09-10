import "server-only";
import postgres from "postgres";

type SqlClient = ReturnType<typeof postgres>;

declare global {
  var __sqlClient: SqlClient | undefined;
}

/**
 * One shared connection pool per server instance. Reused across Server
 * Actions/requests (and across hot-reloads in dev) instead of opening a new
 * connection per call.
 */
function obtenerCliente(): SqlClient {
  if (globalThis.__sqlClient) return globalThis.__sqlClient;

  // POSTGRES_URL es la variable que Vercel inyecta solo al conectar un
  // Storage (Neon/Supabase) a este proyecto — se usa esa si existe.
  // DATABASE_URL es el respaldo para correr contra cualquier otro Postgres.
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta configurar POSTGRES_URL o DATABASE_URL en las variables de entorno."
    );
  }

  const cliente = postgres(url, { ssl: "require" });
  globalThis.__sqlClient = cliente;
  return cliente;
}

/**
 * Un proxy perezoso: importar este módulo (o las páginas que dependen de él)
 * nunca abre una conexión ni revienta si faltan las variables de entorno —
 * Next.js importa los módulos de una ruta al compilarla ("collect page
 * data"), sin variables de entorno de producción disponibles todavía, así
 * que crear el cliente ahí mismo tumbaba el build. El error de configuración
 * ahora solo aparece cuando de verdad se ejecuta una consulta.
 */
export const sql: SqlClient = new Proxy(function sql() {} as unknown as SqlClient, {
  apply(_target, thisArg, args) {
    const cliente = obtenerCliente() as unknown as (...a: unknown[]) => unknown;
    return Reflect.apply(cliente, thisArg, args);
  },
  get(_target, prop, receiver) {
    return Reflect.get(obtenerCliente(), prop, receiver);
  },
});
