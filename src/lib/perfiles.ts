import "server-only";
import { sql } from "./db";

export type PerfilCliente = {
  id: string;
  slug: string;
  nombre: string;
  activo: boolean;
  tipoSolicitud: string;
  negocioCliente: string | null;
  configuracionCalculoId: string;
  /** null = todos los usos de CFDI habilitados (sin restricción). */
  usosCfdiHabilitados: string[] | null;
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
  usos_cfdi_habilitados: string[] | null;
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
    configuracionCalculoId: fila.configuracion_calculo_id,
    usosCfdiHabilitados: fila.usos_cfdi_habilitados,
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
  configuracionCalculoId: string;
  usosCfdiHabilitados: string[] | null;
};

export async function crearPerfil(datos: DatosPerfil): Promise<PerfilCliente> {
  const filas = await sql<FilaPerfil[]>`
    INSERT INTO perfiles
      (slug, nombre, activo, tipo_solicitud, negocio_cliente, configuracion_calculo_id,
       usos_cfdi_habilitados)
    VALUES
      (${datos.slug}, ${datos.nombre}, ${datos.activo}, ${datos.tipoSolicitud},
       ${datos.negocioCliente}, ${datos.configuracionCalculoId},
       ${datos.usosCfdiHabilitados})
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
      configuracion_calculo_id = ${datos.configuracionCalculoId},
      usos_cfdi_habilitados = ${datos.usosCfdiHabilitados}
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
