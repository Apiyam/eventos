# NEXUS 2026

SPA Vite + API Express en memoria (sin base de datos). Asistentes con Clerk. Admin con la colección Postman.

## Arranque

1. Copia `.env.example` a `.env` y pon `VITE_CLERK_PUBLISHABLE_KEY`.
2. `npm install`
3. `npm run dev`
4. App: `http://localhost:5173`
5. API: `http://localhost:8000/api`

## Cuentas

- Asistente: `/sign-up` (Clerk, obligatorio).
- Admin dashboard: `/admin` → `admin@nexus.local` / `admin1234`

La API replica Auth, Users, Students, Store, Images y Talks de la colección. Si más adelante hay staging (`AdmStg`), se apunta el proxy ahí.
