"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1500);
        } catch {
          // Si el navegador bloquea el portapapeles, no pasa nada — el
          // texto ya está visible y se puede seleccionar/copiar a mano.
        }
      }}
      className="shrink-0 rounded-md border border-sage-light/50 px-2 py-1 text-xs font-medium text-sage-dark transition hover:border-forest/40 hover:text-forest"
    >
      {copiado ? "¡Copiado!" : "Copiar"}
    </button>
  );
}
