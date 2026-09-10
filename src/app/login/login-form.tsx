"use client";

import { useActionState } from "react";
import { iniciarSesion, type EstadoLogin } from "./actions";

const ESTADO_INICIAL: EstadoLogin = { status: "idle" };

export function LoginForm() {
  const [estado, formAction, pending] = useActionState(iniciarSesion, ESTADO_INICIAL);

  return (
    <form action={formAction} className="space-y-4">
      {estado.status === "error" ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {estado.message}
        </div>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium text-sage-dark">Contraseña</span>
        <input
          type="password"
          name="contraseña"
          required
          autoFocus
          className="mt-1.5 block w-full rounded-lg border border-sage-light/50 bg-cream/40 px-3.5 py-2.5 text-sage-dark shadow-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
