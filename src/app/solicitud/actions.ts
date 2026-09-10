"use server";

import { calcularNeto } from "@/lib/calculo";
import { buscarConfiguracion } from "@/lib/configuraciones";
import { esArchivoValido, subirArchivo } from "@/lib/blob";
import { crearSolicitudEnNotion } from "@/lib/notion";
import {
  FORMAS_PAGO,
  REGIMENES_FISCALES,
  TIPOS_SOLICITUD,
  USOS_CFDI,
} from "@/lib/opciones";

export type EstadoSolicitud =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; folio: string | null };

const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;

function requerido(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

export async function crearSolicitud(
  _prevState: EstadoSolicitud,
  formData: FormData
): Promise<EstadoSolicitud> {
  const razonSocial = requerido(formData, "razonSocial");
  const modoFiscal = requerido(formData, "modoFiscal") || "manual";
  const rfc = requerido(formData, "rfc").toUpperCase();
  const regimenFiscal = requerido(formData, "regimenFiscal");
  const usoCfdi = requerido(formData, "usoCfdi");
  const usoCfdiOtro = requerido(formData, "usoCfdiOtro");
  const codigoPostal = requerido(formData, "codigoPostal");
  const correo = requerido(formData, "correo");
  const telefono = requerido(formData, "telefono");
  const concepto = requerido(formData, "concepto");
  const montoRaw = requerido(formData, "monto");
  const formaPago = requerido(formData, "formaPago");
  const tipoSolicitud = requerido(formData, "tipoSolicitud");
  const negocioCliente = requerido(formData, "negocioCliente");
  const configuracionId = requerido(formData, "configuracionId");
  const constanciaFiscal = formData.get("constanciaFiscal");
  const comprobantePago = formData.get("comprobantePago");

  const esClienteFinal = tipoSolicitud === "Cliente final de un cliente REUK";

  if (!razonSocial || !usoCfdi) {
    return { status: "error", message: "Faltan datos fiscales obligatorios." };
  }
  if (!concepto) {
    return { status: "error", message: "Describe el concepto de la factura." };
  }
  const monto = Number(montoRaw);
  if (!montoRaw || Number.isNaN(monto) || monto <= 0) {
    return { status: "error", message: "El monto debe ser un número mayor a 0." };
  }
  if (!USOS_CFDI.includes(usoCfdi as (typeof USOS_CFDI)[number])) {
    return { status: "error", message: "Selecciona un uso de CFDI válido." };
  }
  if (usoCfdi === "Otro" && !usoCfdiOtro) {
    return { status: "error", message: "Especifica el uso de CFDI." };
  }
  if (!FORMAS_PAGO.includes(formaPago as (typeof FORMAS_PAGO)[number])) {
    return { status: "error", message: "Selecciona una forma de pago válida." };
  }
  if (!TIPOS_SOLICITUD.includes(tipoSolicitud as (typeof TIPOS_SOLICITUD)[number])) {
    return { status: "error", message: "Selecciona a quién va dirigida la solicitud." };
  }
  if (esClienteFinal && !negocioCliente) {
    return {
      status: "error",
      message: "Escribe el nombre del negocio al que le compraste.",
    };
  }
  // El correo es obligatorio salvo cuando REUK factura directo a su propio
  // cliente — ahí es un dato opcional. Si lo escriben, de todas formas debe
  // tener forma de correo.
  if (tipoSolicitud === "Cliente directo de REUK") {
    if (correo && !correo.includes("@")) {
      return { status: "error", message: "Escribe un correo válido." };
    }
  } else if (!correo || !correo.includes("@")) {
    return { status: "error", message: "Escribe un correo válido." };
  }

  if (modoFiscal === "constancia") {
    if (!esArchivoValido(constanciaFiscal)) {
      return {
        status: "error",
        message: "Sube tu constancia de situación fiscal (PDF o imagen).",
      };
    }
  } else {
    if (!rfc || !regimenFiscal || !codigoPostal) {
      return { status: "error", message: "Faltan datos fiscales obligatorios." };
    }
    if (!RFC_REGEX.test(rfc)) {
      return {
        status: "error",
        message: "El RFC no tiene un formato válido. Revísalo e intenta de nuevo.",
      };
    }
    if (!/^\d{5}$/.test(codigoPostal)) {
      return { status: "error", message: "El código postal debe tener 5 dígitos." };
    }
    if (!REGIMENES_FISCALES.includes(regimenFiscal as (typeof REGIMENES_FISCALES)[number])) {
      return { status: "error", message: "Selecciona un régimen fiscal válido." };
    }
  }

  const configuracion = buscarConfiguracion(configuracionId);
  if (!configuracion || !configuracion.activa) {
    return { status: "error", message: "Selecciona una configuración de cálculo válida." };
  }

  // El desglose SIEMPRE se recalcula aquí, en el servidor, a partir del
  // subtotal y del perfil — nunca se confía en un desglose que venga del
  // formulario, para que nadie pueda alterarlo desde el navegador.
  const desglose = calcularNeto(monto, configuracion);

  try {
    let constanciaFiscalUrl = "";
    if (modoFiscal === "constancia" && esArchivoValido(constanciaFiscal)) {
      constanciaFiscalUrl = await subirArchivo(constanciaFiscal, "constancias");
    }

    let comprobantePagoUrl = "";
    if (esClienteFinal && esArchivoValido(comprobantePago)) {
      comprobantePagoUrl = await subirArchivo(comprobantePago, "comprobantes");
    }

    const { folio } = await crearSolicitudEnNotion({
      razonSocial,
      rfc: modoFiscal === "constancia" ? "" : rfc,
      regimenFiscal: modoFiscal === "constancia" ? "" : regimenFiscal,
      usoCfdi,
      usoCfdiOtro: usoCfdi === "Otro" ? usoCfdiOtro : "",
      codigoPostal: modoFiscal === "constancia" ? "" : codigoPostal,
      correo,
      telefono,
      concepto,
      formaPago,
      tipoSolicitud,
      negocioCliente,
      configuracionNombre: configuracion.nombre,
      comprobantePagoUrl,
      constanciaFiscalUrl,
      ...desglose,
    });
    return { status: "success", folio };
  } catch (error) {
    console.error("Error creando solicitud en Notion:", error);
    return {
      status: "error",
      message:
        "No pudimos enviar tu solicitud por un problema técnico. Intenta de nuevo en unos minutos.",
    };
  }
}
