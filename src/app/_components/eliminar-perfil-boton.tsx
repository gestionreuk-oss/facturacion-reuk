"use client";

export function EliminarPerfilBoton({
  perfilId,
  nombre,
  accion,
}: {
  perfilId: string;
  nombre: string;
  accion: (id: string) => Promise<void>;
}) {
  return (
    <form
      action={async () => {
        if (window.confirm(`¿Eliminar el perfil "${nombre}"? Esto no se puede deshacer.`)) {
          await accion(perfilId);
        }
      }}
    >
      <button type="submit" className="text-red-700 underline underline-offset-2">
        Eliminar
      </button>
    </form>
  );
}
