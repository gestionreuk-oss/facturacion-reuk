"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { esArchivoValido, subirArchivo } from "@/lib/blob";
import { CONFIGURACIONES } from "@/lib/configuraciones";
import { TIPOS_SOLICITUD, USOS_CFDI } from "@/lib/opciones";
import {
  actualizarPerfil,
  cambiarActivoPerfil,
  crearPerfil,
  eliminarPerfil,
  esErrorSlugDuplicado,
  obtenerPerfilPorId,
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

type DatosPerfilSinLogo = Omit<DatosPerfil, "logoUrl">;

function leerDatosPerfil(formData: FormData): DatosPerfilSinLogo | { error: string } {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const slugCrudo = String(formData.get("slug") ?? "");
  const tipoSolicitud = String(formData.get("tipoSolicitud") ?? "");
  const negocioCliente = String(formData.get("negocioCliente") ?? "").trim();
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
  const configuracionesCalculoIds = formData
    .getAll("configuracionesCalculoIds")
    .map(String)
    .filter((id) => CONFIGURACIONES.some((c) => c.id === id));
  if (configuracionesCalculoIds.length === 0) {
    return { error: "Selecciona al menos una configuración de cálculo." };
  }

  const usosCfdiSeleccionados = formData
    .getAll("usosCfdiHabilitados")
    .map(String)
    .filter((valor) => (USOS_CFDI as readonly string[]).includes(valor));
  // Si están todos marcados equivale a no restringir nada — se guarda como null.
  const usosCfdiCatalogo = USOS_CFDI.filter((uso) => uso !== "Otro");
  const usosCfdiHabilitados =
    usosCfdiSeleccionados.length === usosCfdiCatalogo.length ? null : usosCfdiSeleccionados;

  // Para "Cliente final" siempre está habilitado (comportamiento de siempre);
  // para "Cliente directo de REUK" es opcional, lo decide el checkbox.
  const comprobanteHabilitado =
    tipoSolicitud === "Cliente final de un cliente REUK"
      ? true
      : formData.get("comprobanteHabilitado") === "on";
  const comprobantePagoObligatorio = formData.get("comprobantePagoObligatorio") === "on";
  const correoObligatorio = formData.get("correoObligatorio") === "on";
  const telefonoObligatorio = formData.get("telefonoObligatorio") === "on";

  const qrColorCrudo = String(formData.get("qrColor") ?? "");
  const qrColor = /^#[0-9a-fA-F]{6}$/.test(qrColorCrudo) ? qrColorCrudo : "#000000";

  return {
    slug,
    nombre,
    activo,
    tipoSolicitud,
    negocioCliente: negocioCliente || null,
    configuracionesCalculoIds,
    usosCfdiHabilitados,
    comprobanteHabilitado,
    comprobantePagoObligatorio,
    correoObligatorio,
    telefonoObligatorio,
    qrColor,
  };
}

/**
 * Sube el logo nuevo si lo hay; si marcaron "quitar logo" y no hay uno
 * nuevo, lo borra; si no pasó nada de eso, conserva el que ya tenía.
 */
async function resolverLogoUrl(
  formData: FormData,
  logoActual: string | null
): Promise<string | null> {
  const logo = formData.get("logo");
  if (esArchivoValido(logo)) {
    return await subirArchivo(logo, "logos-clientes");
  }
  if (formData.get("quitarLogo") === "on") {
    return null;
  }
  return logoActual;
}

export async function crearPerfilAction(
  _prevState: EstadoPerfil,
  formData: FormData
): Promise<EstadoPerfil> {
  await exigirSesion();

  const datosSinLogo = leerDatosPerfil(formData);
  if ("error" in datosSinLogo) return { status: "error", message: datosSinLogo.error };

  let logoUrl: string | null = null;
  try {
    logoUrl = await resolverLogoUrl(formData, null);
  } catch (error) {
    console.error("Error subiendo el logo:", error);
    return { status: "error", message: "No se pudo subir el logo. Intenta de nuevo." };
  }

  const datos: DatosPerfil = { ...datosSinLogo, logoUrl };

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

  const datosSinLogo = leerDatosPerfil(formData);
  if ("error" in datosSinLogo) return { status: "error", message: datosSinLogo.error };

  const perfilActual = await obtenerPerfilPorId(id);
  let logoUrl: string | null = null;
  try {
    logoUrl = await resolverLogoUrl(formData, perfilActual?.logoUrl ?? null);
  } catch (error) {
    console.error("Error subiendo el logo:", error);
    return { status: "error", message: "No se pudo subir el logo. Intenta de nuevo." };
  }

  const datos: DatosPerfil = { ...datosSinLogo, logoUrl };

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
