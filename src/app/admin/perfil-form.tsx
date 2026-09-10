"use client";

import { useActionState, useState } from "react";
import { CONFIGURACIONES } from "@/lib/configuraciones";
import { TIPOS_SOLICITUD } from "@/lib/opciones";
import type { EstadoPerfil } from "./actions";

const ESTADO_INICIAL: EstadoPerfil = { status: "idle" };

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-sage-light/50 bg-cream/40 px-3.5 py-2.5 text-sage-dark shadow-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20";

export type ValoresPerfil = {
  nombre: string;
  slug: string;
  tipoSolicitud: string;
  negocioCliente: string;
  configuracionCalculoId: string;
  activo: boolean;
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

      <label className="block">
        <span className="text-sm font-medium text-sage-dark">Configuración de cálculo</span>
        <select
          name="configuracionCalculoId"
          required
          defaultValue={valoresIniciales?.configuracionCalculoId ?? CONFIGURACIONES[0]?.id}
          className={inputClass}
        >
          {CONFIGURACIONES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
              {!c.activa ? " (inactiva en el formulario genérico)" : ""}
            </option>
          ))}
        </select>
      </label>

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
