/**
 * Perfiles de cálculo de neto, por caso de uso. REUK define y ajusta las
 * tasas aquí — la app solo aplica la fórmula, no decide criterio fiscal.
 *
 * Para activar/desactivar un perfil en el formulario público, cambia su
 * `activa` a true/false. Los inactivos quedan en el archivo (no se borran)
 * por si se vuelven a necesitar.
 */
export type ConfiguracionCalculo = {
  id: string;
  nombre: string;
  activa: boolean;
  aplicaIva: boolean;
  /** Fracción, no porcentaje: 0.16 = 16% */
  tasaIva: number;
  aplicaRetencionIsr: boolean;
  tasaRetencionIsr: number;
  aplicaRetencionIva: boolean;
  tasaRetencionIva: number;
  /** Nota visible para quien administra (y opcionalmente en el formulario) */
  nota?: string;
};

export const CONFIGURACIONES: ConfiguracionCalculo[] = [
  {
    id: "sin-calculo",
    nombre: "Monto total, sin desglose",
    activa: true,
    aplicaIva: false,
    tasaIva: 0,
    aplicaRetencionIsr: false,
    tasaRetencionIsr: 0,
    aplicaRetencionIva: false,
    tasaRetencionIva: 0,
  },
  {
    id: "iva-general",
    nombre: "IVA general 16%",
    activa: true,
    aplicaIva: true,
    tasaIva: 0.16,
    aplicaRetencionIsr: false,
    tasaRetencionIsr: 0,
    aplicaRetencionIva: false,
    tasaRetencionIva: 0,
  },
  {
    id: "honorarios-persona-fisica",
    nombre: "Honorarios de persona física a persona moral",
    activa: true,
    aplicaIva: true,
    tasaIva: 0.16,
    aplicaRetencionIsr: true,
    tasaRetencionIsr: 0.1,
    aplicaRetencionIva: true,
    tasaRetencionIva: 0.106667,
    nota:
      "Retención ISR 10% y retención IVA de 2/3 del IVA trasladado (10.6667%) — el caso típico de honorarios profesionales. Confirma que aplique antes de usarla con un cliente nuevo.",
  },
  {
    id: "arrendamiento-persona-fisica",
    nombre: "Arrendamiento de persona física",
    activa: true,
    aplicaIva: true,
    tasaIva: 0.16,
    aplicaRetencionIsr: true,
    tasaRetencionIsr: 0.1,
    aplicaRetencionIva: false,
    tasaRetencionIva: 0,
    nota: "Retención ISR del 10%, sin retención de IVA. Verifica caso por caso.",
  },
  {
    id: "tasa-fronteriza",
    nombre: "IVA tasa fronteriza 8%",
    activa: false,
    aplicaIva: true,
    tasaIva: 0.08,
    aplicaRetencionIsr: false,
    tasaRetencionIsr: 0,
    aplicaRetencionIva: false,
    tasaRetencionIva: 0,
  },
];

export function configuracionesActivas(): ConfiguracionCalculo[] {
  return CONFIGURACIONES.filter((c) => c.activa);
}

export function buscarConfiguracion(id: string): ConfiguracionCalculo | undefined {
  return CONFIGURACIONES.find((c) => c.id === id);
}
