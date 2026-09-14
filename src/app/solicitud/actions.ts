"use server";

import { after } from "next/server";
import { avisarNuevaSolicitud } from "@/lib/avisos";
import { calcularNeto } from "@/lib/calculo";
import { buscarConfiguracion } from "@/lib/configuraciones";
import { esArchivoValido, subirArchivo } from "@/lib/blob";
import { crearSolicitudEnNotion } from "@/lib/notion";
import {
  FORMA_PAGO_PPD,
  FORMAS_PAGO,
  METODOS_PAGO,
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
  const metodoPago = requerido(formData, "metodoPago");
  const tipoSolicitud = requerido(formData, "tipoSolicitud");
  const negocioCliente = requerido(formData, "negocioCliente");
  const clienteReuk = requerido(formData, "clienteReuk");
  const configuracionId = requerido(formData, "configuracionId");
  const constanciaFiscal = formData.get("constanciaFiscal");
  const comprobantePago = formData.get("comprobantePago");
  const comprobanteRequerido = requerido(formData, "comprobanteRequerido") === "true";
  const correoObligatorio = requerido(formData, "correoObligatorio") === "true";
  const telefonoObligatorio = requerido(formData, "telefonoObligatorio") === "true";

  const esClienteFinal = tipoSolicitud === "Cliente final de un cliente REUK";
  const esRecurrente = modoFiscal === "recurrente";

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
  if (!METODOS_PAGO.includes(metodoPago as (typeof METODOS_PAGO)[number])) {
    return { status: "error", message: "Selecciona el método de pago." };
  }
  const esPPD = metodoPago === "PPD - Pago en parcialidades o diferido";
  if (!FORMAS_PAGO.includes(formaPago as (typeof FORMAS_PAGO)[number])) {
    return { status: "error", message: "Selecciona una forma de pago válida." };
  }
  if (esPPD && formaPago !== FORMA_PAGO_PPD) {
    return {
      status: "error",
      message: `Cuando el método de pago es PPD, la forma de pago debe ser "${FORMA_PAGO_PPD}".`,
    };
  }
  if (!esPPD && formaPago === FORMA_PAGO_PPD) {
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
  // Obligatoriedad de correo/teléfono viene del perfil de cliente (o de los
  // valores por defecto del formulario genérico) — ver src/lib/perfiles.ts.
  if (correoObligatorio) {
    if (!correo || !correo.includes("@")) {
      return { status: "error", message: "Escribe un correo válido." };
    }
  } else if (correo && !correo.includes("@")) {
    return { status: "error", message: "Escribe un correo válido." };
  }
  if (telefonoObligatorio && !telefono) {
    return { status: "error", message: "Escribe tu teléfono." };
  }

  if (esRecurrente) {
    // Cliente directo de REUK que ya tiene sus datos fiscales en archivo —
    // no se le vuelve a pedir RFC, régimen, código postal ni constancia.
  } else if (modoFiscal === "constancia") {
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

  if (esClienteFinal && comprobanteRequerido && !esArchivoValido(comprobantePago)) {
    return { status: "error", message: "Sube tu comprobante de pago." };
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
      metodoPago,
      clienteRecurrente: esRecurrente,
      tipoSolicitud,
      negocioCliente,
      clienteReuk,
      configuracionNombre: configuracion.nombre,
      comprobantePagoUrl,
      constanciaFiscalUrl,
      ...desglose,
    });
    // Push a tu celular/PC vía ntfy. Va DESPUÉS de responder al cliente, para
    // no retrasar su confirmación; si falla, la solicitud ya está en Notion.
    after(() => avisarNuevaSolicitud({ folio, tipoSolicitud, clienteReuk }));
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
