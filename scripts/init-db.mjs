// Crea la tabla "perfiles" una sola vez. Corre con:
//   node scripts/init-db.mjs
// usando el mismo DATABASE_URL que tengas en .env.local.
import { readFileSync } from "node:fs";
import postgres from "postgres";

function cargarEnvLocal() {
  try {
    const contenido = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const linea of contenido.split("\n")) {
      const match = linea.match(/^([A-Z_]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim().replace(/^"(.*)"$/, "$1");
      }
    }
  } catch {
    // .env.local no existe — se asume que las variables ya están en el entorno
  }
}

cargarEnvLocal();

const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Falta POSTGRES_URL o DATABASE_URL (en .env.local o en el entorno).");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require" });

try {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  await sql`
    CREATE TABLE IF NOT EXISTS perfiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      slug text UNIQUE NOT NULL,
      nombre text NOT NULL,
      activo boolean NOT NULL DEFAULT true,
      tipo_solicitud text NOT NULL,
      negocio_cliente text,
      configuracion_calculo_id text NOT NULL,
      creado_en timestamptz NOT NULL DEFAULT now()
    )
  `;
  // NULL = todos los usos de CFDI habilitados (sin restricción).
  await sql`ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS usos_cfdi_habilitados text[]`;
  await sql`ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS comprobante_pago_obligatorio boolean NOT NULL DEFAULT false`;
  // Lista de configuraciones de cálculo que el cliente puede elegir en su
  // formulario. NULL/vacío = se usa configuracion_calculo_id como única opción.
  await sql`ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS configuraciones_calculo_ids text[]`;
  // Logo del cliente (Vercel Blob) — se usa al centro de su código QR y junto
  // a su nombre en el panel. NULL = sin logo.
  await sql`ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS logo_url text`;
  // NULL = usa el valor por defecto según tipo_solicitud (ver src/lib/perfiles.ts).
  await sql`ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS correo_obligatorio boolean`;
  await sql`ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS telefono_obligatorio boolean`;
  // Color (hex) de los módulos oscuros del código QR. NULL = negro por defecto.
  await sql`ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS qr_color text`;
  console.log("Listo: la tabla \"perfiles\" existe y está al día.");
} finally {
  await sql.end();
}
