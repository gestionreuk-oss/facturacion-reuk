"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { crearSolicitud, type EstadoSolicitud } from "@/app/solicitud/actions";
import { calcularNeto } from "@/lib/calculo";
import {
  buscarConfiguracion,
  configuracionesActivas,
  type ConfiguracionCalculo,
} from "@/lib/configuraciones";
import {
  FORMA_PAGO_PPD,
  FORMAS_PAGO_PUE,
  METODOS_PAGO,
  REGIMENES_FISCALES,
  TIPOS_SOLICITUD,
  USOS_CFDI,
} from "@/lib/opciones";

const ESTADO_INICIAL: EstadoSolicitud = { status: "idle" };
const CONFIGURACIONES_ACTIVAS = configuracionesActivas();

const pesos = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function porcentaje(tasa: number): string {
  return `${(tasa * 100).toLocaleString("es-MX", { maximumFractionDigits: 4 })}%`;
}

function Campo({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-sage-dark">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-sage-light">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-sage-light/50 bg-cream/40 px-3.5 py-2.5 text-sage-dark placeholder:text-sage-light shadow-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20";

const archivoClass =
  "mt-1.5 block w-full rounded-lg border border-sage-light/50 bg-cream/40 px-3.5 py-2.5 text-sm text-sage-dark shadow-sm outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-forest file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-cream";

const legendClass = "text-xs font-semibold uppercase tracking-wider text-forest";

export type PerfilFijo = {
  nombre: string;
  tipoSolicitud: string;
  negocioCliente: string | null;
  configuracionesCalculoIds: string[];
  usosCfdiHabilitados: string[] | null;
  comprobanteHabilitado: boolean;
  comprobantePagoObligatorio: boolean;
  correoObligatorio: boolean;
  telefonoObligatorio: boolean;
};

type ConceptoItem = { id: string; concepto: string; monto: string };

function nuevoConceptoVacio(): ConceptoItem {
  return { id: Math.random().toString(36).slice(2), concepto: "", monto: "" };
}

export function SolicitudForm({ perfilFijo }: { perfilFijo?: PerfilFijo }) {
  const [estado, formAction, pending] = useActionState(crearSolicitud, ESTADO_INICIAL);
  const [tipoSolicitud, setTipoSolicitud] = useState<string>(
    perfilFijo?.tipoSolicitud ?? ""
  );
  const [configuracionId, setConfiguracionId] = useState<string>(
    perfilFijo?.configuracionesCalculoIds[0] ?? CONFIGURACIONES_ACTIVAS[0]?.id ?? ""
  );
  const [modoFiscal, setModoFiscal] = useState<"manual" | "constancia">("manual");
  const [clienteRecurrente, setClienteRecurrente] = useState(false);
  const [conceptos, setConceptos] = useState<ConceptoItem[]>([nuevoConceptoVacio()]);
  const [usoCfdi, setUsoCfdi] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const tipoEfectivo = perfilFijo?.tipoSolicitud ?? tipoSolicitud;
  const esDirectoReuk = tipoEfectivo === "Cliente directo de REUK";
  const esClienteFinal = tipoEfectivo === "Cliente final de un cliente REUK";
  const esRecurrente = esDirectoReuk && clienteRecurrente;
  const modoFiscalEfectivo = esRecurrente ? "recurrente" : modoFiscal;
  const esPPD = metodoPago === "PPD - Pago en parcialidades o diferido";
  const comprobanteHabilitado = perfilFijo ? perfilFijo.comprobanteHabilitado : esClienteFinal;
  const comprobanteRequerido = perfilFijo?.comprobantePagoObligatorio ?? false;
  const correoObligatorio = perfilFijo?.correoObligatorio ?? !esDirectoReuk;
  const mostrarTelefono = perfilFijo ? true : !esDirectoReuk;
  const telefonoObligatorio = perfilFijo?.telefonoObligatorio ?? false;

  const usosCfdiVisibles = useMemo(() => {
    const habilitados = perfilFijo?.usosCfdiHabilitados;
    if (!habilitados) return USOS_CFDI;
    return USOS_CFDI.filter((opcion) => opcion === "Otro" || habilitados.includes(opcion));
  }, [perfilFijo]);

  const configuracionesDisponibles: ConfiguracionCalculo[] = useMemo(() => {
    if (!perfilFijo) return CONFIGURACIONES_ACTIVAS;
    return perfilFijo.configuracionesCalculoIds
      .map((id) => buscarConfiguracion(id))
      .filter((c): c is ConfiguracionCalculo => Boolean(c));
  }, [perfilFijo]);

  const configuracion = buscarConfiguracion(configuracionId);
  const subtotal = useMemo(
    () => conceptos.reduce((acc, c) => acc + (Number(c.monto) || 0), 0),
    [conceptos]
  );
  const conceptoCombinado = useMemo(
    () =>
      conceptos
        .filter((c) => c.concepto.trim() || Number(c.monto) > 0)
        .map((c) => c.concepto.trim() || "(sin descripción)")
        .join("\n"),
    [conceptos]
  );
  const desglose = useMemo(
    () => (configuracion ? calcularNeto(subtotal, configuracion) : null),
    [configuracion, subtotal]
  );
  const tieneDesglose =
    configuracion &&
    (configuracion.aplicaIva ||
      configuracion.aplicaRetencionIsr ||
      configuracion.aplicaRetencionIva);

  function actualizarConcepto(id: string, campo: "concepto" | "monto", valor: string) {
    setConceptos((prev) => prev.map((c) => (c.id === id ? { ...c, [campo]: valor } : c)));
  }

  function agregarConcepto() {
    setConceptos((prev) => [...prev, nuevoConceptoVacio()]);
  }

  function quitarConcepto(id: string) {
    setConceptos((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));
  }

  if (estado.status === "success") {
    return (
      <div className="rounded-2xl border border-forest/20 bg-forest/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-forest/10 text-forest">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="font-serif text-lg font-medium text-forest">Solicitud enviada</h2>
        <p className="mt-2 text-sm text-sage-dark/80">
          {estado.folio ? (
            <>Tu folio de seguimiento es <span className="font-mono tabular-nums text-forest">{estado.folio}</span>. </>
          ) : null}
          Tu factura será emitida en un máximo de 24 horas hábiles.
        </p>
        <button
          type="button"
          onClick={() => {
            formRef.current?.reset();
            setTipoSolicitud("");
            window.location.reload();
          }}
          className="mt-6 rounded-lg border border-sage-light/60 px-4 py-2 text-sm font-medium text-sage-dark transition hover:border-forest/40 hover:text-forest"
        >
          Regresar
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-8">
      {estado.status === "error" ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {estado.message}
        </div>
      ) : null}

      {perfilFijo ? (
        <>
          <input type="hidden" name="tipoSolicitud" value={perfilFijo.tipoSolicitud} />
          <input type="hidden" name="clienteReuk" value={perfilFijo.nombre} />
          {perfilFijo.negocioCliente ? (
            <input type="hidden" name="negocioCliente" value={perfilFijo.negocioCliente} />
          ) : null}
        </>
      ) : (
        <fieldset className="space-y-5">
          <legend className={legendClass}>¿A quién va dirigida la solicitud?</legend>
          <Campo label="Tipo de solicitud">
            <select
              name="tipoSolicitud"
              required
              className={inputClass}
              value={tipoSolicitud}
              onChange={(e) => setTipoSolicitud(e.target.value)}
            >
              <option value="" disabled>
                Selecciona una opción
              </option>
              {TIPOS_SOLICITUD.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion === "Cliente final de un cliente REUK"
                    ? "Le compré a un negocio asesorado por REUK"
                    : "Le solicito la factura directo a REUK"}
                </option>
              ))}
            </select>
          </Campo>
          {esClienteFinal ? (
            <Campo
              label="¿A qué negocio le compraste?"
              hint="Escribe el nombre tal como lo conoces (ej. razón social o nombre comercial)."
            >
              <input
                type="text"
                name="negocioCliente"
                required
                className={inputClass}
                placeholder="Nombre del negocio"
              />
            </Campo>
          ) : null}
        </fieldset>
      )}

      <fieldset className="space-y-5">
        <legend className={legendClass}>Datos fiscales</legend>
        <Campo label="Razón social / Nombre completo">
          <input
            type="text"
            name="razonSocial"
            required
            className={inputClass}
            placeholder={
              esDirectoReuk
                ? "Como aparece en su constancia de situación fiscal"
                : "Como aparece en tu constancia de situación fiscal"
            }
          />
        </Campo>

        {esDirectoReuk ? (
          <label className="flex items-center gap-2 text-sm text-sage-dark">
            <input
              type="checkbox"
              checked={clienteRecurrente}
              onChange={(e) => setClienteRecurrente(e.target.checked)}
              className="h-4 w-4 rounded border-sage-light/60 text-forest focus:ring-forest/30"
            />
            Cliente recurrente al que ya se le ha facturado
          </label>
        ) : null}

        {esRecurrente ? (
          <input type="hidden" name="modoFiscal" value="recurrente" />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setModoFiscal("manual")}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  modoFiscal === "manual"
                    ? "bg-forest text-cream"
                    : "border border-sage-light/50 text-sage-dark hover:border-forest/40"
                }`}
              >
                Escribir datos
              </button>
              <button
                type="button"
                onClick={() => setModoFiscal("constancia")}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  modoFiscal === "constancia"
                    ? "bg-forest text-cream"
                    : "border border-sage-light/50 text-sage-dark hover:border-forest/40"
                }`}
              >
                Subir constancia fiscal
              </button>
            </div>
            <input type="hidden" name="modoFiscal" value={modoFiscalEfectivo} />

            {modoFiscal === "manual" ? (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Campo label="RFC">
                    <input
                      type="text"
                      name="rfc"
                      required
                      maxLength={13}
                      className={`${inputClass} uppercase`}
                      placeholder="XAXX010101000"
                    />
                  </Campo>
                  <Campo label="Código postal fiscal">
                    <input
                      type="text"
                      name="codigoPostal"
                      required
                      inputMode="numeric"
                      maxLength={5}
                      className={inputClass}
                      placeholder="00000"
                    />
                  </Campo>
                </div>
                <Campo label="Régimen fiscal">
                  <select name="regimenFiscal" required defaultValue="" className={inputClass}>
                    <option value="" disabled>
                      Selecciona régimen fiscal
                    </option>
                    {REGIMENES_FISCALES.map((opcion) => (
                      <option key={opcion} value={opcion}>
                        {opcion}
                      </option>
                    ))}
                  </select>
                </Campo>
              </>
            ) : (
              <Campo
                label={esDirectoReuk ? "Constancia de situación fiscal del cliente" : "Constancia de situación fiscal"}
                hint={
                  esDirectoReuk
                    ? "PDF o foto legible. Tomamos su RFC, régimen y código postal de ahí."
                    : "PDF o foto legible. Tomamos tu RFC, régimen y código postal de ahí."
                }
              >
                <input
                  type="file"
                  name="constanciaFiscal"
                  required
                  accept="application/pdf,image/*"
                  className={archivoClass}
                />
              </Campo>
            )}
          </>
        )}

        <Campo label="Uso de CFDI">
          <select
            name="usoCfdi"
            required
            value={usoCfdi}
            onChange={(e) => setUsoCfdi(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Selecciona el uso
            </option>
            {usosCfdiVisibles.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        </Campo>
        {usoCfdi === "Otro" ? (
          <Campo label="Especifica el uso de CFDI">
            <input
              type="text"
              name="usoCfdiOtro"
              required
              className={inputClass}
              placeholder="Escribe el uso de CFDI"
            />
          </Campo>
        ) : null}
      </fieldset>

      <fieldset className="space-y-5">
        <legend className={legendClass}>Detalle de la factura</legend>

        {configuracionesDisponibles.length <= 1 ? (
          <input type="hidden" name="configuracionId" value={configuracionId} />
        ) : (
          <Campo label="Configuración de cálculo" hint={configuracion?.nota}>
            <select
              name="configuracionId"
              required
              className={inputClass}
              value={configuracionId}
              onChange={(e) => setConfiguracionId(e.target.value)}
            >
              {configuracionesDisponibles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Campo>
        )}

        <div className="space-y-3">
          <span className="text-sm font-medium text-sage-dark">
            {tieneDesglose ? "Conceptos (montos antes de IVA)" : "Conceptos"}
          </span>
          {conceptos.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={item.concepto}
                onChange={(e) => actualizarConcepto(item.id, "concepto", e.target.value)}
                placeholder="Qué se está facturando"
                className="w-full rounded-lg border border-sage-light/50 bg-cream/40 px-3.5 py-2.5 text-sage-dark placeholder:text-sage-light shadow-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20 sm:min-w-0 sm:flex-1"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={item.monto}
                  onChange={(e) => actualizarConcepto(item.id, "monto", e.target.value)}
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="min-w-0 flex-1 rounded-lg border border-sage-light/50 bg-cream/40 px-3.5 py-2.5 text-sage-dark placeholder:text-sage-light shadow-sm outline-none transition tabular-nums focus:border-forest focus:ring-2 focus:ring-forest/20 sm:w-36 sm:flex-none"
                />
                <button
                  type="button"
                  onClick={() => quitarConcepto(item.id)}
                  disabled={conceptos.length === 1}
                  aria-label="Quitar este concepto"
                  className="shrink-0 rounded-lg border border-sage-light/50 px-3 text-sage-dark transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={agregarConcepto}
            className="rounded-lg border border-dashed border-sage-light/60 px-3.5 py-2 text-sm font-medium text-forest transition hover:border-forest/50"
          >
            + Agregar concepto
          </button>
        </div>
        <input type="hidden" name="concepto" value={conceptoCombinado} />
        <input type="hidden" name="monto" value={subtotal || ""} />

        <Campo label="Método de pago">
          <select
            name="metodoPago"
            required
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            {METODOS_PAGO.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        </Campo>

        {metodoPago ? (
          <Campo label="Forma de pago">
            {esPPD ? (
              <>
                <div className={`${inputClass} bg-sage-light/10 text-sage-dark/80`}>
                  {FORMA_PAGO_PPD}
                </div>
                <input type="hidden" name="formaPago" value={FORMA_PAGO_PPD} />
              </>
            ) : (
              <select name="formaPago" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  Selecciona una opción
                </option>
                {FORMAS_PAGO_PUE.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
              </select>
            )}
          </Campo>
        ) : null}

        {tieneDesglose && desglose && subtotal > 0 ? (
          <div className="rounded-lg border border-sage-light/40 bg-cream/60 px-4 py-3.5 text-sm">
            <dl className="space-y-1.5 tabular-nums">
              <div className="flex justify-between text-sage-dark/80">
                <dt>Subtotal</dt>
                <dd>{pesos.format(desglose.subtotal)}</dd>
              </div>
              {configuracion?.aplicaIva ? (
                <div className="flex justify-between text-sage-dark/80">
                  <dt>+ IVA ({porcentaje(configuracion.tasaIva)})</dt>
                  <dd>{pesos.format(desglose.iva)}</dd>
                </div>
              ) : null}
              {configuracion?.aplicaRetencionIsr ? (
                <div className="flex justify-between text-sage-dark/80">
                  <dt>− Retención ISR ({porcentaje(configuracion.tasaRetencionIsr)})</dt>
                  <dd>−{pesos.format(desglose.retencionIsr)}</dd>
                </div>
              ) : null}
              {configuracion?.aplicaRetencionIva ? (
                <div className="flex justify-between text-sage-dark/80">
                  <dt>− Retención IVA ({porcentaje(configuracion.tasaRetencionIva)})</dt>
                  <dd>−{pesos.format(desglose.retencionIva)}</dd>
                </div>
              ) : null}
              <div className="!mt-2.5 flex justify-between border-t border-sage-light/40 pt-2 font-semibold text-forest">
                <dt>Neto a pagar</dt>
                <dd>{pesos.format(desglose.netoAPagar)}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </fieldset>

      {comprobanteHabilitado ? (
        <fieldset className="space-y-5">
          <legend className={legendClass}>
            {esClienteFinal ? "Comprobante de pago" : "Adjuntar archivo"}
          </legend>
          <input type="hidden" name="comprobanteHabilitado" value="true" />
          <input type="hidden" name="comprobanteRequerido" value={comprobanteRequerido ? "true" : "false"} />
          <Campo
            label={
              esClienteFinal
                ? comprobanteRequerido
                  ? "Sube tu comprobante de pago"
                  : "Sube tu comprobante (opcional)"
                : comprobanteRequerido
                  ? "Adjuntar archivo"
                  : "Adjuntar archivo (opcional)"
            }
            hint={esClienteFinal ? "Foto o captura de la transferencia/pago." : "PDF o imagen de respaldo."}
          >
            <input
              type="file"
              name="comprobantePago"
              required={comprobanteRequerido}
              accept="image/*,application/pdf"
              className={archivoClass}
            />
          </Campo>
        </fieldset>
      ) : null}

      <fieldset className="space-y-5">
        <legend className={legendClass}>Datos de contacto</legend>
        <input
          type="hidden"
          name="correoObligatorio"
          value={correoObligatorio ? "true" : "false"}
        />
        <input
          type="hidden"
          name="telefonoObligatorio"
          value={telefonoObligatorio ? "true" : "false"}
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Campo
            label={
              (esDirectoReuk ? "Correo del cliente" : "Correo") +
              (correoObligatorio ? "" : " (opcional)")
            }
            hint="Aquí te avisamos cuando esté lista tu factura."
          >
            <input
              type="email"
              name="correo"
              required={correoObligatorio}
              className={inputClass}
              placeholder="tu@correo.com"
            />
          </Campo>
          {mostrarTelefono ? (
            <Campo label={telefonoObligatorio ? "Teléfono" : "Teléfono (opcional)"}>
              <input
                type="tel"
                name="telefono"
                required={telefonoObligatorio}
                className={inputClass}
                placeholder="10 dígitos"
              />
            </Campo>
          ) : null}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-forest px-4 py-3 text-sm font-semibold text-cream transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar solicitud"}
      </button>
    </form>
  );
}
