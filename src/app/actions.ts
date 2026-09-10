"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CONFIGURACIONES } from "@/lib/configuraciones";
import { TIPOS_SOLICITUD, USOS_CFDI } from "@/lib/opciones";
import {
  actualizarPerfil,
  cambiarActivoPerfil,
  crearPerfil,
  eliminarPerfil,
  esErrorSlugDuplicado,
  type DatosPerfil,
} from "@/lib/perfiles";
import { cerrarSesionAdmin, haySesionAdmin } from "@/lib/session";

export type EstadoPerfil =
  | { status: "idle" }
  | { status: "error"; message: string };

async function exigirSesion() {
  if (!(await haySesionAdmin())) {
    redirect("/login");
  }
}

function normalizarSlug(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos (diacríticos tras NFD)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function leerDatosPerfil(formData: FormData): DatosPerfil | { error: string } {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const slugCrudo = String(formData.get("slug") ?? "");
  const tipoSolicitud = String(formData.get("tipoSolicitud") ?? "");
  const negocioCliente = String(formData.get("negocioCliente") ?? "").trim();
  const configuracionCalculoId = String(formData.get("configuracionCalculoId") ?? "");
  const activo = formData.get("activo") === "on";

  if (!nombre) return { error: "El nombre del perfil es obligatorio." };

  const slug = normalizarSlug(slugCrudo || nombre);
  if (!slug) return { error: "El link (slug) no puede quedar vacío." };

  if (!TIPOS_SOLICITUD.includes(tipoSolicitud as (typeof TIPOS_SOLICITUD)[number])) {
    return { error: "Selecciona un tipo de solicitud válido." };
  }
  if (tipoSolicitud === "Cliente final de un cliente REUK" && !negocioCliente) {
    return {
      error:
        'Escribe el nombre del negocio — obligatorio cuando el tipo es "cliente final".',
    };
  }
  if (!CONFIGURACIONES.some((c) => c.id === configuracionCalculoId)) {
    return { error: "Selecciona una configuración de cálculo válida." };
  }

  const usosCfdiSeleccionados = formData
    .getAll("usosCfdiHabilitados")
    .map(String)
    .filter((valor) => (USOS_CFDI as readonly string[]).includes(valor));
  // Si están todos marcados equivale a no restringir nada — se guarda como null.
  const usosCfdiCatalogo = USOS_CFDI.filter((uso) => uso !== "Otro");
  const usosCfdiHabilitados =
    usosCfdiSeleccionados.length === usosCfdiCatalogo.length ? null : usosCfdiSeleccionados;

  const comprobantePagoObligatorio = formData.get("comprobantePagoObligatorio") === "on";

  return {
    slug,
    nombre,
    activo,
    tipoSolicitud,
    negocioCliente: negocioCliente || null,
    configuracionCalculoId,
    usosCfdiHabilitados,
    comprobantePagoObligatorio,
  };
}

export async function crearPerfilAction(
  _prevState: EstadoPerfil,
  formData: FormData
): Promise<EstadoPerfil> {
  await exigirSesion();

  const datos = leerDatosPerfil(formData);
  if ("error" in datos) return { status: "error", message: datos.error };

  try {
    await crearPerfil(datos);
  } catch (error) {
    if (esErrorSlugDuplicado(error)) {
      return { status: "error", message: `Ya existe un perfil con el link "${datos.slug}".` };
    }
    console.error("Error creando perfil:", error);
    return { status: "error", message: "No se pudo crear el perfil. Intenta de nuevo." };
  }

  revalidatePath("/");
  redirect("/");
}

export async function actualizarPerfilAction(
  id: string,
  _prevState: EstadoPerfil,
  formData: FormData
): Promise<EstadoPerfil> {
  await exigirSesion();

  const datos = leerDatosPerfil(formData);
  if ("error" in datos) return { status: "error", message: datos.error };

  try {
    await actualizarPerfil(id, datos);
  } catch (error) {
    if (esErrorSlugDuplicado(error)) {
      return { status: "error", message: `Ya existe un perfil con el link "${datos.slug}".` };
    }
    console.error("Error actualizando perfil:", error);
    return { status: "error", message: "No se pudo guardar el perfil. Intenta de nuevo." };
  }

  revalidatePath("/");
  redirect("/");
}

export async function cambiarActivoAction(id: string, activo: boolean): Promise<void> {
  await exigirSesion();
  await cambiarActivoPerfil(id, activo);
  revalidatePath("/");
}

export async function eliminarPerfilAction(id: string): Promise<void> {
  await exigirSesion();
  await eliminarPerfil(id);
  revalidatePath("/");
}

export async function cerrarSesionAction(): Promise<void> {
  await cerrarSesionAdmin();
  redirect("/admin/login");
}
