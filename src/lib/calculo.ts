import type { ConfiguracionCalculo } from "./configuraciones";

export type DesgloseNeto = {
  subtotal: number;
  iva: number;
  retencionIsr: number;
  retencionIva: number;
  totalFactura: number;
  netoAPagar: number;
};

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Calcula IVA, retenciones y neto a partir de un subtotal y un perfil de
 * configuración. Pura y determinista: se usa igual en el navegador (para
 * mostrar el desglose mientras se llena el formulario) y en el servidor
 * (para el valor que realmente se guarda) — nunca se confía en un desglose
 * calculado del lado del cliente.
 */
export function calcularNeto(
  subtotal: number,
  config: ConfiguracionCalculo
): DesgloseNeto {
  const iva = config.aplicaIva ? redondear(subtotal * config.tasaIva) : 0;
  const retencionIsr = config.aplicaRetencionIsr
    ? redondear(subtotal * config.tasaRetencionIsr)
    : 0;
  const retencionIva = config.aplicaRetencionIva
    ? redondear(subtotal * config.tasaRetencionIva)
    : 0;
  const totalFactura = redondear(subtotal + iva);
  const netoAPagar = redondear(totalFactura - retencionIsr - retencionIva);

  return { subtotal, iva, retencionIsr, retencionIva, totalFactura, netoAPagar };
}
