import "server-only";
import postgres from "postgres";

declare global {
  var __sqlClient: ReturnType<typeof postgres> | undefined;
}

/**
 * One shared connection pool per server instance. Reused across Server
 * Actions/requests (and across hot-reloads in dev) instead of opening a new
 * connection per call.
 */
function crearCliente() {
  // POSTGRES_URL es la variable que Vercel inyecta solo al conectar un
  // Storage (Neon/Supabase) a este proyecto — se usa esa si existe.
  // DATABASE_URL es el respaldo para correr contra cualquier otro Postgres.
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta configurar POSTGRES_URL o DATABASE_URL en las variables de entorno."
    );
  }
  return postgres(url, { ssl: "require" });
}

export const sql = globalThis.__sqlClient ?? crearCliente();

if (process.env.NODE_ENV !== "production") {
  globalThis.__sqlClient = sql;
}
