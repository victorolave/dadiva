# Backend de Dádiva en Supabase

Todo el dominio vive en PostgreSQL: el sorteo, las promesas y el anonimato se resuelven
con funciones y políticas RLS, no en el cliente. El frontend solo llama funciones y lee
lo que RLS le permite ver.

## Camino rápido (local)

```bash
npm install -g supabase          # o: brew install supabase/tap/supabase
supabase start                   # levanta Postgres, Auth, Studio e Inbucket
supabase db reset                # aplica supabase/migrations/ en orden
```

Verificación: Studio en http://127.0.0.1:54323 debe mostrar 9 tablas con el candado de
RLS activo, y `promise_cards` con 3 filas de ejemplo.

Los magic links de desarrollo NO se envían por correo: se leen en Inbucket,
http://127.0.0.1:54324.

## Camino rápido (proyecto en la nube)

1. Crear el proyecto en https://supabase.com/dashboard → **New project**. Guardá la
   contraseña de la base: no se puede recuperar.
2. En **Authentication → Providers → Email**, activar *Enable Email provider* y
   desactivar *Confirm email*. Dádiva usa magic link, no contraseñas.
3. En **Authentication → URL Configuration**, agregar la URL del sitio y las de
   redirección (en desarrollo, `http://localhost:5173`).
4. Enlazar y publicar el esquema:

```bash
supabase login
supabase link --project-ref <project-ref>   # el ref está en la URL del dashboard
supabase db push                            # aplica las migraciones al proyecto remoto
```

5. Copiar las credenciales desde **Project Settings → API**.

## Variables de entorno

Crear `.env.local` en la raíz del proyecto (ya está ignorado por git):

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

| Variable | De dónde sale | Notas |
|----------|---------------|-------|
| `VITE_SUPABASE_URL` | Project Settings → API → Project URL | En local: `http://127.0.0.1:54321` |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API → `anon` `public` | Viaja al navegador. Es seguro **porque** RLS está activo. |

> **Nunca** pongas la `service_role` key en el frontend. Ese rol ignora RLS por diseño:
> filtrarla equivale a publicar el sorteo completo. Todo lo prefijado con `VITE_` termina
> dentro del bundle.

## Las migraciones

| Archivo | Contiene |
|---------|----------|
| `0001_initial_schema.sql` | Extensiones, enums, 9 tablas, índices, triggers de `updated_at` |
| `0002_functions.sql` | Helpers de identidad, `draw_group`, `draw_promise`, `join_group_by_code`, `generate_invite_code` |
| `0003_rls_policies.sql` | RLS en todas las tablas + privilegios por rol |
| `0004_seed_promise_cards.sql` | 3 tarjetas de ejemplo (el catálogo completo sale de `promiseCatalog.ts`) |

Se aplican en orden alfabético y son reaplicables: correrlas dos veces no rompe ni
duplica nada.

## Reglas que el backend garantiza

| Regla | Cómo se cumple |
|-------|----------------|
| Nadie ve el sorteo ajeno, ni el organizador | Única política de SELECT en `assignments`: `giver_member_id = current_member_id(group_id)` |
| El sorteo no se ejecuta en el cliente | `draw_group()` es `SECURITY DEFINER` y devuelve solo un conteo |
| El receptor no sabe quién le escribió | La tabla base le niega SELECT; lee con `get_my_anonymous_messages()` |
| La promesa no cambia al reingresar | `UNIQUE(group_id, member_id)` en `member_promises` + `draw_promise()` idempotente |
| No se listan grupos ajenos | `groups` no tiene política para no-miembros; se entra con `join_group_by_code()` |

## Regenerar los tipos de TypeScript

Después de cualquier cambio de esquema:

```bash
supabase gen types typescript --local > src/core/infrastructure/supabase/database.types.ts
# contra el proyecto remoto:
supabase gen types typescript --project-id <project-ref> > src/core/infrastructure/supabase/database.types.ts
```

## Checklist antes de dar por listo el backend

- [ ] `supabase db reset` corre sin errores
- [ ] Las 9 tablas muestran RLS activo en Studio
- [ ] Un magic link de prueba crea automáticamente la fila en `profiles`
- [ ] Con 3 usuarios distintos, cada uno ve exactamente 1 fila en `assignments` después de sortear
- [ ] `VITE_SUPABASE_ANON_KEY` está en `.env.local` y la `service_role` key no aparece en ningún lado del repo

## Siguiente paso

Cargar el catálogo completo de versículos desde
`src/modules/promises/infrastructure/data/promiseCatalog.ts` hacia `promise_cards`,
respetando las columnas y el `on conflict` de `0004_seed_promise_cards.sql`.
