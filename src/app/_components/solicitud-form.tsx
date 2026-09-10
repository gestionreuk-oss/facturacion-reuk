"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { crearSolicitud, type EstadoSolicitud } from "@/app/solicitud/actions";
import { calcularNeto } from "@/lib/calculo";
import { buscarConfiguracion, configuracionesActivas } from "@/lib/configuraciones";
import {
  FORMAS_PAGO,
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
  configuracionCalculoId: string;
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
    perfilFijo?.configuracionCalculoId ?? CONFIGURACIONES_ACTIVAS[0]?.id ?? ""
  );
  const [modoFiscal, setModoFiscal] = useState<"manual" | "constancia">("manual");
  const [conceptos, setConceptos] = useState<ConceptoItem[]>([nuevoConceptoVacio()]);
  const formRef = useRef<HTMLFormElement>(null);

  const tipoEfectivo = perfilFijo?.tipoSolicitud ?? tipoSolicitud;
  const esDirectoReuk = tipoEfectivo === "Cliente directo de REUK";
  const esClienteFinal = tipoEfectivo === "Cliente final de un cliente REUK";

  const configuracion = buscarConfiguracion(configuracionId);
  const subtotal = useMemo(
    () => conceptos.reduce((acc, c) => acc + (Number(c.monto) || 0), 0),
    [conceptos]
  );
  const conceptoCombinado = useMemo(
    () =>
      conceptos
        .filter((c) => c.concepto.trim() || Number(c.monto) > 0)
        .map((c) => `${c.concepto.trim() || "(sin descripción)"} — ${pesos.format(Number(c.monto) || 0)}`)
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
        <h2 className="font-serif text-lg font-medium text-forest">Solicitud recibida</h2>
        <p className="mt-2 text-sm text-sage-dark/80">
          {estado.folio
            ? <>Tu folio de seguimiento es <span className="font-mono tabular-nums text-forest">{estado.folio}</span>.</>
            : "Ya quedó registrada."}
          {" "}Te avisaremos por correo cuando esté facturada.
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
          Enviar otra solicitud
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
            placeholder="Como aparece en tu constancia de situación fiscal"
          />
        </Campo>

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
            Escribir mis datos
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
            Subir mi constancia fiscal
          </button>
        </div>
        <input type="hidden" name="modoFiscal" value={modoFiscal} />

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
                  Selecciona tu régimen
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
            label="Constancia de situación fiscal"
            hint="PDF o foto legible. Tomamos tu RFC, régimen y código postal de ahí."
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

        <Campo label="Uso de CFDI">
          <select name="usoCfdi" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Selecciona el uso
            </option>
            {USOS_CFDI.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        </Campo>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className={legendClass}>Detalle de la factura</legend>

        {perfilFijo ? (
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
              {CONFIGURACIONES_ACTIVAS.map((c) => (
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
            <div key={item.id} className="flex gap-2">
              <input
                type="text"
                value={item.concepto}
                onChange={(e) => actualizarConcepto(item.id, "concepto", e.target.value)}
                placeholder="Qué se está facturando"
                className={inputClass}
              />
              <input
                type="number"
                value={item.monto}
                onChange={(e) => actualizarConcepto(item.id, "monto", e.target.value)}
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                className={`${inputClass} w-36 shrink-0 tabular-nums`}
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

        <Campo label="Forma de pago">
          <select name="formaPago" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Selecciona una opción
            </option>
            {FORMAS_PAGO.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        </Campo>

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

      {esClienteFinal ? (
        <fieldset className="space-y-5">
          <legend className={legendClass}>Comprobante de pago</legend>
          <Campo label="Sube tu comprobante (opcional)" hint="Foto o captura de la transferencia/pago.">
            <input
              type="file"
              name="comprobantePago"
              accept="image/*,application/pdf"
              className={archivoClass}
            />
          </Campo>
        </fieldset>
      ) : null}

      <fieldset className="space-y-5">
        <legend className={legendClass}>Datos de contacto</legend>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Campo
            label={esDirectoReuk ? "Correo del cliente" : "Correo"}
            hint="Aquí te avisamos cuando esté lista tu factura."
          >
            <input
              type="email"
              name="correo"
              required={!esDirectoReuk}
              className={inputClass}
              placeholder="tu@correo.com"
            />
          </Campo>
          {esDirectoReuk ? null : (
            <Campo label="Teléfono (opcional)">
              <input type="tel" name="telefono" className={inputClass} placeholder="10 dígitos" />
            </Campo>
          )}
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
