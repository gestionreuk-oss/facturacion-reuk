# Portal de Solicitud de Factura — REUK

Formulario público (Next.js) que recibe solicitudes de factura y las escribe
directo en la base de Notion **"Solicitudes de Factura"**, dentro de
**Gestión General**. Cubre los dos flujos:

- Alguien le compró a un negocio asesorado por REUK y pide su factura.
- Un cliente de REUK solicita su factura directo a REUK.

Tiene cuatro partes:

1. **`/`** — el panel de administración. Vive en la URL base de la app y
   pide contraseña — es lo único protegido.
2. **`/login`** — el login del panel.
3. **`/solicitud`** — el formulario genérico y público: quien lo llena elige
   a mano el tipo de solicitud y la configuración de cálculo.
4. **`/f/[slug]`** — un link propio por cliente (ej. `/f/servisanluis`), que
   ya llega preconfigurado (tipo de solicitud, negocio, cálculo fijos) —
   quien lo llena solo ve sus datos fiscales, no las opciones de REUK.

`/login`, `/solicitud` y `/f/*` son públicos. Todo lo demás (`/`, `/nuevo`,
`/[id]/editar`) requiere haber iniciado sesión.

## Cómo funciona

- `src/app/page.tsx` — el panel: lista de perfiles, con su link completo y
  botón de copiar.
- `src/app/nuevo/page.tsx`, `src/app/[id]/editar/page.tsx` — alta y edición
  de perfiles.
- `src/app/login/**` — el login del panel.
- `src/app/actions.ts` — Server Actions del panel (crear/editar/activar/
  borrar perfiles), cada una vuelve a verificar la sesión por su cuenta.
- `src/app/solicitud/page.tsx` — el formulario genérico y público.
- `src/app/f/[slug]/page.tsx` — la página por cliente: busca el perfil por su
  link y se lo pasa ya fijo al formulario.
- `src/app/solicitud/actions.ts` — Server Action del formulario: valida los
  datos en el servidor, recalcula el desglose de cálculo (nunca confía en el
  que mandó el navegador), sube archivos a Blob si los hay, y llama a Notion.
- `src/app/_components/solicitud-form.tsx` — el formulario (Client
  Component), usado tanto por `/solicitud` como por `/f/[slug]`. Si recibe un
  `perfilFijo`, oculta el tipo de solicitud y la configuración de cálculo.
- `src/lib/notion.ts` — el único lugar que habla con la API de Notion.
- `src/lib/blob.ts` — sube comprobantes de pago y constancias fiscales a
  Vercel Blob y regresa su URL pública.
- `src/lib/opciones.ts` — catálogos (régimen fiscal, uso de CFDI, forma de
  pago). **Deben coincidir exactamente** con las opciones ya creadas en el
  campo `select` correspondiente en Notion — si agregas una opción nueva en
  Notion, agrégala aquí también (y viceversa).
- `src/lib/configuraciones.ts` — los perfiles de cálculo de neto (IVA,
  retención ISR, retención IVA). Cada perfil de cliente (en el panel) elige
  uno de estos.
- `src/lib/calculo.ts` — la fórmula (subtotal → IVA → retenciones → neto).
  Se usa dos veces: en el navegador, para mostrarle el desglose a quien llena
  el formulario mientras escribe; y otra vez en el servidor, que vuelve a
  calcularlo desde cero antes de guardarlo.
- `src/lib/perfiles.ts` — lee/escribe los perfiles de cliente en Postgres.
- `src/lib/session.ts` + `src/proxy.ts` — el login del panel: una sola
  contraseña (no hay usuarios), guardada en una cookie firmada. El proxy
  bloquea todo excepto `/login`, `/solicitud` y `/f/*` si no hay sesión
  válida.

El token de Notion y la contraseña del panel nunca llegan al navegador: solo
viven en el servidor, como variables de entorno.

## Activar/desactivar o editar configuraciones de cálculo

Abre `src/lib/configuraciones.ts`. Cada perfil es un objeto en el arreglo
`CONFIGURACIONES`:

```ts
{
  id: "honorarios-persona-fisica",
  nombre: "Honorarios de persona física a persona moral",
  activa: true,              // false = desaparece del formulario (no se borra)
  aplicaIva: true,
  tasaIva: 0.16,              // 16%
  aplicaRetencionIsr: true,
  tasaRetencionIsr: 0.1,      // 10%
  aplicaRetencionIva: true,
  tasaRetencionIva: 0.106667, // 2/3 del IVA
  nota: "texto que ve quien llena el formulario, como ayuda",
}
```

- Para **desactivar** un perfil sin borrarlo: cambia `activa` a `false`.
- Para **agregar uno nuevo**: copia un bloque, ponle un `id` único y ajusta
  las tasas.
- Las tasas son fracciones, no porcentajes (`0.16`, no `16`).
- Los porcentajes y qué retiene cada perfil son responsabilidad de REUK — la
  app solo aplica la fórmula que le indiques; revisa cada perfil antes de
  usarlo con un cliente nuevo.

Cualquier cambio aquí requiere volver a desplegar (push a GitHub → Vercel
redespliega solo) para que se refleje en el formulario público.

## Configurar el panel de administración (una sola vez)

El panel (`/admin`) necesita una base de datos Postgres para guardar los
perfiles de cliente, y dos secretos propios (nada de esto se comparte con
Notion).

**La base de datos ya está creada** — un Supabase Postgres gratis
(`supabase-teal-zebra`, plan Free $0/mes) conectado a este equipo de Vercel
vía Storage → Marketplace. Le falta un solo paso, que solo se puede hacer
**después** de que el proyecto exista en Vercel (ver "Desplegar en Vercel"
abajo):

1. En Vercel: **Storage** → `supabase-teal-zebra` → **Connect to Project** →
   selecciona el proyecto de este portal. Esto mete automáticamente la
   variable `POSTGRES_URL` a producción y preview — no hay que copiar ninguna
   contraseña a mano.
2. Para tu máquina local, con el [CLI de Vercel](https://vercel.com/docs/cli)
   instalado (`npm i -g vercel`), dentro de `portal-facturas`:
   ```bash
   vercel link      # conecta esta carpeta con el proyecto de Vercel
   vercel env pull .env.local
   ```
   Esto descarga `POSTGRES_URL` (y los demás valores de Supabase) directo a
   tu `.env.local`, sin que nadie tenga que verla ni pegarla.
3. **Crea la tabla, una sola vez** (ya con `POSTGRES_URL` en tu `.env.local`):
   ```bash
   node scripts/init-db.mjs
   ```
4. Define `ADMIN_PASSWORD` (la contraseña con la que tú entras a `/admin` —
   no hay usuarios ni registro, es una sola contraseña compartida) y
   `SESSION_SECRET` (una cadena aleatoria larga, distinta a la contraseña).
   Ambas ya están puestas en tu `.env.local` para pruebas locales; en Vercel
   agrégalas en **Settings → Environment Variables**.

Si en algún momento prefieres otra base de datos (Neon, o cualquier Postgres
propio), el código también acepta `DATABASE_URL` como respaldo — ver
`src/lib/db.ts`.

Sin `POSTGRES_URL`/`DATABASE_URL`, el panel (`/`) y `/f/[slug]` no funcionan
— el formulario genérico en `/solicitud` no las necesita para nada.

## Archivos que suben los solicitantes (comprobante de pago, constancia fiscal)

Se guardan en **Vercel Blob** (no en Notion ni en Postgres) — Notion solo
guarda el link.

1. En Vercel: **Storage** → **Create Database** → **Blob** → dale un nombre
   → **Connect to Project** → selecciona este proyecto. Esto agrega
   `BLOB_READ_WRITE_TOKEN` solo, igual que pasó con Postgres.
2. Para local: `vercel env pull .env.local` la trae junto con las demás.

Sin esta variable, subir un archivo falla — el resto del formulario (llenar
los datos a mano) sigue funcionando normal.

## Configurar Notion (una sola vez)

1. Entra a [notion.so/my-integrations](https://www.notion.so/my-integrations)
   → **New integration** → dale un nombre (ej. "Portal de Facturas") →
   selecciona el workspace de REUK → **Submit**.
2. Copia el **Internal Integration Secret** (empieza con `secret_...`).
3. Abre la base **"Solicitudes de Factura"** en Notion → botón **···** (arriba
   a la derecha) → **Connections** → conecta la integración que acabas de
   crear. Sin este paso, la integración no puede escribir en la base aunque
   tenga el token correcto.

## Correr en local

```bash
npm install
cp .env.example .env.local   # o cópialo a mano en Windows
```

Edita `.env.local` y pega tu `NOTION_TOKEN` (el `NOTION_DATABASE_ID` ya viene
puesto). Luego:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Desplegar en Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. En [vercel.com/new](https://vercel.com/new), importa ese repositorio.
3. Antes de darle deploy (o después, en **Settings → Environment
   Variables**), agrega:
   - `NOTION_TOKEN` = tu Internal Integration Secret.
   - `NOTION_DATABASE_ID` = `53ee6e27d63a4e22a8fc3cab4eef889e`.
   - `ADMIN_PASSWORD`, `SESSION_SECRET` — ver la sección de arriba.
4. Deploy.
5. Ya con el proyecto creado: **Storage** → `supabase-teal-zebra` → **Connect
   to Project** → selecciónalo, para que `POSTGRES_URL` quede conectado
   (paso 1 de la sección de arriba), y conecta también el Blob store para
   `BLOB_READ_WRITE_TOKEN` (sección de archivos, arriba).
6. Cada push a la rama principal vuelve a desplegar automáticamente.

El link público que compartas con tus clientes (o los clientes de tus
clientes) es el dominio que te da Vercel, ej.
`https://facturacion-reuk.vercel.app`. Puedes conectarle un dominio propio
(ej. `facturas.reuk.mx`) desde **Settings → Domains** en Vercel. El link de
cada perfil de cliente queda como `tudominio.com/f/su-slug`, y lo ves/copias
desde el panel (`/`).

## Próximo paso natural: marca propia por cliente

Hoy `/f/[slug]` ya preconfigura el comportamiento (tipo de solicitud, cálculo)
pero usa el mismo logo y colores de REUK para todos. Si más adelante quieres
que cada cliente vea su propio logo/nombre en su link, se agrega como un
campo más al perfil (ej. una URL de logo) y se usa en
`src/app/f/[slug]/page.tsx` — la estructura ya está lista para eso.
