import "server-only";
import { sql } from "./db";

export type PerfilCliente = {
  id: string;
  slug: string;
  nombre: string;
  activo: boolean;
  tipoSolicitud: string;
  negocioCliente: string | null;
  /** IDs de `CONFIGURACIONES` que este cliente puede elegir en su formulario. */
  configuracionesCalculoIds: string[];
  /** null = todos los usos de CFDI habilitados (sin restricción). */
  usosCfdiHabilitados: string[] | null;
  /** Solo aplica al flujo "Cliente final de un cliente REUK". */
  comprobantePagoObligatorio: boolean;
  /** URL pública en Vercel Blob del logo del cliente, o null si no tiene. */
  logoUrl: string | null;
  correoObligatorio: boolean;
  telefonoObligatorio: boolean;
  /** Color (hex) de los módulos del código QR de este perfil. */
  qrColor: string;
  creadoEn: string;
};

type FilaPerfil = {
  id: string;
  slug: string;
  nombre: string;
  activo: boolean;
  tipo_solicitud: string;
  negocio_cliente: string | null;
  configuracion_calculo_id: string;
  configuraciones_calculo_ids: string[] | null;
  usos_cfdi_habilitados: string[] | null;
  comprobante_pago_obligatorio: boolean;
  logo_url: string | null;
  correo_obligatorio: boolean | null;
  telefono_obligatorio: boolean | null;
  qr_color: string | null;
  creado_en: string;
};

function aPerfil(fila: FilaPerfil): PerfilCliente {
  return {
    id: fila.id,
    slug: fila.slug,
    nombre: fila.nombre,
    activo: fila.activo,
    tipoSolicitud: fila.tipo_solicitud,
    negocioCliente: fila.negocio_cliente,
    configuracionesCalculoIds:
      fila.configuraciones_calculo_ids && fila.configuraciones_calculo_ids.length > 0
        ? fila.configuraciones_calculo_ids
        : [fila.configuracion_calculo_id],
    usosCfdiHabilitados: fila.usos_cfdi_habilitados,
    comprobantePagoObligatorio: fila.comprobante_pago_obligatorio,
    logoUrl: fila.logo_url,
    // NULL (perfil creado antes de que esto fuera configurable) conserva el
    // comportamiento de siempre: correo obligatorio solo para cliente final,
    // teléfono siempre opcional.
    correoObligatorio:
      fila.correo_obligatorio ?? fila.tipo_solicitud === "Cliente final de un cliente REUK",
    telefonoObligatorio: fila.telefono_obligatorio ?? false,
    qrColor: fila.qr_color ?? "#000000",
    creadoEn: fila.creado_en,
  };
}

export async function listarPerfiles(): Promise<PerfilCliente[]> {
  const filas = await sql<FilaPerfil[]>`
    SELECT * FROM perfiles ORDER BY creado_en DESC
  `;
  return filas.map(aPerfil);
}

export async function obtenerPerfilPorId(id: string): Promise<PerfilCliente | null> {
  const filas = await sql<FilaPerfil[]>`
    SELECT * FROM perfiles WHERE id = ${id} LIMIT 1
  `;
  return filas[0] ? aPerfil(filas[0]) : null;
}

/** Solo perfiles activos son visibles al público (el formulario por link). */
export async function obtenerPerfilActivoPorSlug(
  slug: string
): Promise<PerfilCliente | null> {
  const filas = await sql<FilaPerfil[]>`
    SELECT * FROM perfiles WHERE slug = ${slug} AND activo = true LIMIT 1
  `;
  return filas[0] ? aPerfil(filas[0]) : null;
}

export type DatosPerfil = {
  slug: string;
  nombre: string;
  activo: boolean;
  tipoSolicitud: string;
  negocioCliente: string | null;
  configuracionesCalculoIds: string[];
  usosCfdiHabilitados: string[] | null;
  comprobantePagoObligatorio: boolean;
  logoUrl: string | null;
  correoObligatorio: boolean;
  telefonoObligatorio: boolean;
  qrColor: string;
};

export async function crearPerfil(datos: DatosPerfil): Promise<PerfilCliente> {
  const filas = await sql<FilaPerfil[]>`
    INSERT INTO perfiles
      (slug, nombre, activo, tipo_solicitud, negocio_cliente, configuracion_calculo_id,
       configuraciones_calculo_ids, usos_cfdi_habilitados, comprobante_pago_obligatorio,
       logo_url, correo_obligatorio, telefono_obligatorio, qr_color)
    VALUES
      (${datos.slug}, ${datos.nombre}, ${datos.activo}, ${datos.tipoSolicitud},
       ${datos.negocioCliente}, ${datos.configuracionesCalculoIds[0]},
       ${datos.configuracionesCalculoIds}, ${datos.usosCfdiHabilitados},
       ${datos.comprobantePagoObligatorio}, ${datos.logoUrl},
       ${datos.correoObligatorio}, ${datos.telefonoObligatorio}, ${datos.qrColor})
    RETURNING *
  `;
  return aPerfil(filas[0]);
}

export async function actualizarPerfil(
  id: string,
  datos: DatosPerfil
): Promise<PerfilCliente> {
  const filas = await sql<FilaPerfil[]>`
    UPDATE perfiles SET
      slug = ${datos.slug},
      nombre = ${datos.nombre},
      activo = ${datos.activo},
      tipo_solicitud = ${datos.tipoSolicitud},
      negocio_cliente = ${datos.negocioCliente},
      configuracion_calculo_id = ${datos.configuracionesCalculoIds[0]},
      configuraciones_calculo_ids = ${datos.configuracionesCalculoIds},
      usos_cfdi_habilitados = ${datos.usosCfdiHabilitados},
      comprobante_pago_obligatorio = ${datos.comprobantePagoObligatorio},
      logo_url = ${datos.logoUrl},
      correo_obligatorio = ${datos.correoObligatorio},
      telefono_obligatorio = ${datos.telefonoObligatorio},
      qr_color = ${datos.qrColor}
    WHERE id = ${id}
    RETURNING *
  `;
  return aPerfil(filas[0]);
}

export async function cambiarActivoPerfil(id: string, activo: boolean): Promise<void> {
  await sql`UPDATE perfiles SET activo = ${activo} WHERE id = ${id}`;
}

export async function eliminarPerfil(id: string): Promise<void> {
  await sql`DELETE FROM perfiles WHERE id = ${id}`;
}

/** Uno de "unique_violation" de Postgres — el slug ya existe. */
export function esErrorSlugDuplicado(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && error.code === "23505"
  );
}
