"use client";

import { useActionState, useState } from "react";
import { CONFIGURACIONES } from "@/lib/configuraciones";
import { TIPOS_SOLICITUD, USOS_CFDI } from "@/lib/opciones";
import type { EstadoPerfil } from "@/app/actions";

const ESTADO_INICIAL: EstadoPerfil = { status: "idle" };

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-sage-light/50 bg-cream/40 px-3.5 py-2.5 text-sage-dark shadow-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20";

const archivoClass =
  "mt-1.5 block w-full rounded-lg border border-sage-light/50 bg-cream/40 px-3.5 py-2.5 text-sm text-sage-dark shadow-sm outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-forest file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-cream";

const USOS_CFDI_CATALOGO = USOS_CFDI.filter((uso) => uso !== "Otro");

export type ValoresPerfil = {
  nombre: string;
  slug: string;
  tipoSolicitud: string;
  negocioCliente: string;
  configuracionesCalculoIds: string[];
  activo: boolean;
  usosCfdiHabilitados: string[] | null;
  comprobantePagoObligatorio: boolean;
  logoUrl: string | null;
  correoObligatorio: boolean;
  telefonoObligatorio: boolean;
};

function normalizarSlugVista(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function PerfilForm({
  accion,
  valoresIniciales,
  textoBoton,
}: {
  accion: (prevState: EstadoPerfil, formData: FormData) => Promise<EstadoPerfil>;
  valoresIniciales?: ValoresPerfil;
  textoBoton: string;
}) {
  const [estado, formAction, pending] = useActionState(accion, ESTADO_INICIAL);
  const [nombre, setNombre] = useState(valoresIniciales?.nombre ?? "");
  const [slug, setSlug] = useState(valoresIniciales?.slug ?? "");
  const [slugTocado, setSlugTocado] = useState(Boolean(valoresIniciales));
  const [tipoSolicitud, setTipoSolicitud] = useState(
    valoresIniciales?.tipoSolicitud ?? TIPOS_SOLICITUD[1]
  );
  const [usosCfdiHabilitados, setUsosCfdiHabilitados] = useState<Set<string>>(
    () =>
      new Set(
        valoresIniciales?.usosCfdiHabilitados ?? USOS_CFDI_CATALOGO
      )
  );
  const [quitarLogo, setQuitarLogo] = useState(false);
  const [configuracionesHabilitadas, setConfiguracionesHabilitadas] = useState<Set<string>>(
    () =>
      new Set(
        valoresIniciales?.configuracionesCalculoIds ?? [CONFIGURACIONES[0]?.id].filter(Boolean)
      )
  );

  function alternarUsoCfdi(uso: string) {
    setUsosCfdiHabilitados((actual) => {
      const siguiente = new Set(actual);
      if (siguiente.has(uso)) {
        siguiente.delete(uso);
      } else {
        siguiente.add(uso);
      }
      return siguiente;
    });
  }

  function alternarConfiguracion(id: string) {
    setConfiguracionesHabilitadas((actual) => {
      const siguiente = new Set(actual);
      if (siguiente.has(id)) {
        if (siguiente.size === 1) return actual; // al menos una debe quedar marcada
        siguiente.delete(id);
      } else {
        siguiente.add(id);
      }
      return siguiente;
    });
  }

  return (
    <form action={formAction} className="space-y-5">
      {estado.status === "error" ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {estado.message}
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-sage-dark">Nombre del perfil</span>
        <input
          type="text"
          name="nombre"
          required
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            if (!slugTocado) setSlug(normalizarSlugVista(e.target.value));
          }}
          placeholder="Ej. Servisanluis"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-sage-dark">
          Link (parte final de la URL)
        </span>
        <div className="mt-1.5 flex items-center rounded-lg border border-sage-light/50 bg-cream/40 px-3.5 focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/20">
          <span className="text-sm text-sage-light">tudominio.com/f/</span>
          <input
            type="text"
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTocado(true);
              setSlug(normalizarSlugVista(e.target.value));
            }}
            placeholder="servisanluis"
            className="w-full bg-transparent py-2.5 text-sage-dark outline-none"
          />
        </div>
      </label>

      <div className="block">
        <span className="text-sm font-medium text-sage-dark">Logo del cliente (opcional)</span>
        <p className="mt-1 text-xs text-sage-dark/60">
          Aparece al centro de su código QR y junto a su nombre en el panel.
        </p>
        {valoresIniciales?.logoUrl && !quitarLogo ? (
          <div className="mt-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={valoresIniciales.logoUrl}
              alt="Logo actual"
              className="h-12 w-12 rounded-full border border-sage-light/40 object-cover"
            />
            <label className="flex items-center gap-2 text-xs text-sage-dark">
              <input
                type="checkbox"
                name="quitarLogo"
                checked={quitarLogo}
                onChange={(e) => setQuitarLogo(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-sage-light/60 text-forest focus:ring-forest/30"
              />
              Quitar logo actual
            </label>
          </div>
        ) : null}
        <input
          type="file"
          name="logo"
          accept="image/*"
          className={`${archivoClass} mt-2`}
        />
      </div>

      <label className="block">
        <span className="text-sm font-medium text-sage-dark">Tipo de solicitud</span>
        <select
          name="tipoSolicitud"
          required
          className={inputClass}
          value={tipoSolicitud}
          onChange={(e) => setTipoSolicitud(e.target.value)}
        >
          {TIPOS_SOLICITUD.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion === "Cliente final de un cliente REUK"
                ? "Cliente final de este negocio (le compró algo)"
                : "Solicita su factura directo a REUK"}
            </option>
          ))}
        </select>
      </label>

      {tipoSolicitud === "Cliente final de un cliente REUK" ? (
        <label className="block">
          <span className="text-sm font-medium text-sage-dark">Nombre del negocio</span>
          <input
            type="text"
            name="negocioCliente"
            required
            defaultValue={valoresIniciales?.negocioCliente ?? ""}
            placeholder="Como lo reconocerá quien solicita"
            className={inputClass}
          />
        </label>
      ) : null}

      {tipoSolicitud === "Cliente final de un cliente REUK" ? (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="comprobantePagoObligatorio"
            defaultChecked={valoresIniciales?.comprobantePagoObligatorio ?? false}
            className="h-4 w-4 rounded border-sage-light/60 text-forest focus:ring-forest/30"
          />
          <span className="text-sm text-sage-dark">
            Comprobante de pago obligatorio para enviar la solicitud
          </span>
        </label>
      ) : null}

      <div className="block">
        <span className="text-sm font-medium text-sage-dark">Datos de contacto</span>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="correoObligatorio"
              defaultChecked={
                valoresIniciales?.correoObligatorio ??
                tipoSolicitud === "Cliente final de un cliente REUK"
              }
              className="h-4 w-4 rounded border-sage-light/60 text-forest focus:ring-forest/30"
            />
            <span className="text-sm text-sage-dark">Correo obligatorio</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="telefonoObligatorio"
              defaultChecked={valoresIniciales?.telefonoObligatorio ?? false}
              className="h-4 w-4 rounded border-sage-light/60 text-forest focus:ring-forest/30"
            />
            <span className="text-sm text-sage-dark">Teléfono obligatorio</span>
          </label>
        </div>
      </div>

      <div className="block">
        <span className="text-sm font-medium text-sage-dark">
          Configuraciones de cálculo que puede elegir este cliente
        </span>
        <p className="mt-1 text-xs text-sage-dark/60">
          Si marcas más de una, el cliente verá un selector en su formulario para elegir con
          cuál facturar. Debe quedar al menos una marcada.
        </p>
        <div className="mt-2 space-y-1.5 rounded-lg border border-sage-light/50 bg-cream/40 p-3">
          {CONFIGURACIONES.map((c) => (
            <label key={c.id} className="flex items-start gap-2 text-sm text-sage-dark">
              <input
                type="checkbox"
                name="configuracionesCalculoIds"
                value={c.id}
                checked={configuracionesHabilitadas.has(c.id)}
                onChange={() => alternarConfiguracion(c.id)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-sage-light/60 text-forest focus:ring-forest/30"
              />
              <span>
                {c.nombre}
                {!c.activa ? " (inactiva en el formulario genérico)" : ""}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="block">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-sage-dark">
            Usos de CFDI que puede elegir este cliente
          </span>
          <div className="flex gap-3 text-xs font-medium text-forest">
            <button
              type="button"
              onClick={() => setUsosCfdiHabilitados(new Set(USOS_CFDI_CATALOGO))}
              className="underline underline-offset-2"
            >
              Marcar todos
            </button>
            <button
              type="button"
              onClick={() => setUsosCfdiHabilitados(new Set())}
              className="underline underline-offset-2"
            >
              Quitar todos
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-sage-dark/60">
          &quot;Otro&quot; con escritura libre siempre está disponible, sin importar esta lista.
        </p>
        <div className="mt-2 grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border border-sage-light/50 bg-cream/40 p-3 sm:grid-cols-2">
          {USOS_CFDI_CATALOGO.map((uso) => (
            <label key={uso} className="flex items-start gap-2 text-xs text-sage-dark">
              <input
                type="checkbox"
                name="usosCfdiHabilitados"
                value={uso}
                checked={usosCfdiHabilitados.has(uso)}
                onChange={() => alternarUsoCfdi(uso)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-sage-light/60 text-forest focus:ring-forest/30"
              />
              <span>{uso}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="activo"
          defaultChecked={valoresIniciales?.activo ?? true}
          className="h-4 w-4 rounded border-sage-light/60 text-forest focus:ring-forest/30"
        />
        <span className="text-sm text-sage-dark">
          Perfil activo (visible en su link público)
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando…" : textoBoton}
      </button>
    </form>
  );
}
