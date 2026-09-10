import Link from "next/link";
import { redirect } from "next/navigation";
import { haySesionAdmin } from "@/lib/session";
import { crearPerfilAction } from "../actions";
import { PerfilForm } from "../_components/perfil-form";

export default async function NuevoPerfilPage() {
  if (!(await haySesionAdmin())) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="text-sm text-sage-dark/70 underline underline-offset-2">
          ← Volver a perfiles
        </Link>
        <h1 className="mb-6 mt-2 font-serif text-2xl font-medium text-forest">
          Nuevo perfil de cliente
        </h1>
        <div className="rounded-2xl border border-sage-light/40 bg-white p-6 shadow-[0_20px_45px_-25px_rgba(26,65,33,0.35)]">
          <PerfilForm accion={crearPerfilAction} textoBoton="Crear perfil" />
        </div>
      </div>
    </main>
  );
}
