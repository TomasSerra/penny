# Penny

Finanzas personales simples: presupuesto mensual, gastos, cuotas, suscripciones y una API para cargar gastos desde un Atajo de iOS. Web app + PWA.

- **Front:** Vite, React, TypeScript, Tailwind v4, shadcn/ui (Radix), Hugeicons, Motion, Recharts.
- **Datos y auth:** Firebase (plan Spark): Authentication (Google + email) y Firestore con caché offline.
- **Hosting y API:** Vercel (plan Hobby). Las funciones de `api/` usan `firebase-admin`.

```
api/        Funciones de Vercel (POST /api/expenses, GET /api/meta, POST /api/keys/rotate)
shared/     Lógica pura compartida por la app y la API (presupuesto, cuotas, ritmo, parseo) + tests
src/        App React (features/, components/, data/ para Firestore)
```

## Desarrollo local

Todo corre contra los emuladores de Firebase, sin tocar un proyecto real (necesita Java 11+).

```bash
pnpm install
pnpm emulators   # Auth :9099, Firestore :8080, UI :4000
pnpm dev         # http://localhost:5173 (también sirve /api/*)
```

`.env.local` ya viene con `VITE_USE_EMULATORS=true` y los hosts de los emuladores para la API.

```bash
pnpm test        # tests de shared/
pnpm typecheck   # app + API
pnpm build
```

## Puesta en producción

### 1. Firebase

1. Crear un proyecto en [console.firebase.google.com](https://console.firebase.google.com) (plan Spark).
2. **Authentication → Sign-in method:** habilitar Google y Email/contraseña.
3. **Firestore Database:** crearla en modo producción.
4. **Project settings → General → Your apps:** agregar una app web y copiar la config a las variables `VITE_FIREBASE_*` (ver `.env.example`).
5. **Project settings → Service accounts:** generar una clave privada (JSON) y codificarla en base64:
   ```bash
   base64 -i service-account.json | tr -d '\n' | pbcopy
   ```
6. Publicar reglas e índices:
   ```bash
   pnpm exec firebase login
   pnpm exec firebase deploy --only firestore --project <tu-project-id>
   ```

### 2. Vercel

1. Importar el repo en Vercel (detecta Vite; `vercel.json` ya define build y rewrites).
2. Variables de entorno: todas las `VITE_FIREBASE_*` y `FIREBASE_SERVICE_ACCOUNT` (el base64). **No** definir `VITE_USE_EMULATORS` ni los `*_EMULATOR_HOST`.
3. En Firebase → Authentication → Settings → **Authorized domains**, agregar el dominio de Vercel.

**Login con Google en iPhone (PWA/Safari):** Safari bloquea las cookies de terceros que usa el popup de Google cuando la app y `authDomain` están en dominios distintos. Para evitarlo, usá el dominio de Vercel como `VITE_FIREBASE_AUTH_DOMAIN` y agregá este rewrite en `vercel.json`, antes del de `index.html`:

```json
{ "source": "/__/auth/:path*", "destination": "https://<tu-project-id>.firebaseapp.com/__/auth/:path*" }
```

Después agregá `https://<tu-dominio>/__/auth/handler` como redirect URI autorizado del cliente OAuth de Google en Google Cloud Console.

### 3. Atajo de iOS

En **Ajustes → API para tu Atajo** generás tu API key y copiás la URL. En el Atajo usá “Obtener contenido de URL”:

- Método `POST`, header `Content-Type: application/json`.
- URL `https://<tu-dominio>/api/expenses?key=<tu-api-key>`.
- Body JSON con `date`, `amount`, `description`, `category`, `paymentMethod` y `necessary` (el mismo formato que usabas con Sheets). Opcionales: `currency` (`ARS`/`USD`) e `installments`.

La API acepta categorías con o sin emoji, `Si`/`No` o `true`/`false`, montos como `"$13.600"` y fechas `dd/mm/aaaa`, ISO o el formato largo de Atajos. `GET /api/meta` devuelve las listas para armar menús.

## Cálculo del presupuesto

Igual que la planilla original:

- **Neto** = ingresos (los de USD al dólar configurado) − deducciones.
- **Ahorro corto y largo plazo** = % del neto.
- **Gastos variables** = neto − gastos fijos − ahorros.

El mes actual usa la cotización en vivo de [dolarapi.com](https://dolarapi.com). Los meses pasados quedan con la cotización guardada. Las compras con tarjeta en cuotas caen en el mes del resumen según el día de cierre configurado.
