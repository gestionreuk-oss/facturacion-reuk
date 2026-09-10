"use server";

import { redirect } from "next/navigation";
import { contraseñaValida, crearSesionAdmin } from "@/lib/session";

export type EstadoLogin = { status: "idle" } | { status: "error"; message: string };

export async function iniciarSesion(
  _prevState: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  const contraseña = String(formData.get("contraseña") ?? "");

  if (!contraseñaValida(contraseña)) {
    return { status: "error", message: "Contraseña incorrecta." };
  }

  await crearSesionAdmin();
  redirect("/admin");
}
