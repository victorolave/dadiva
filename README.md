# Dádiva

> «Toda buena **dádiva** y todo don perfecto desciende de lo alto» — Santiago 1:17

Amigo secreto con tarjetas de promesa bíblica. Creas un grupo, invitas a los tuyos,
el sorteo ocurre en secreto de verdad, y cada persona saca del mazo una carta con
un versículo que le acompaña hasta el día del intercambio.

La promesa se saca **una sola vez** y queda guardada: vuelves semanas después y ahí está.

---

## Qué hace

- **Grupos por invitación** — código de 8 caracteres y enlace para compartir.
- **Sorteo secreto real** — nadie se saca a sí mismo, y *nadie* puede ver asignaciones
  ajenas. Ni siquiera quien organiza, que también juega.
- **Exclusiones** — parejas o familiares que no deben tocarse entre sí.
- **Lista de deseos** — visible para quien te va a regalar, sin revelar quién es.
- **Mazo de promesas** — 67 versículos RVR1960, 12 diseños distintos, elección con
  animación de baraja.
- **Mensajes anónimos** — le escribes a tu amigo secreto sin delatarte.
- **Cuenta regresiva** al día del intercambio.

## Stack

| Capa | Herramienta |
|---|---|
| UI | React 19 + TypeScript estricto |
| Estilos | Tailwind CSS v4 (tokens en `@theme`) |
| Animación | GSAP 3 + `@gsap/react` |
| Backend | Supabase (Postgres + Auth + RLS) |
| Build | Vite 8 |
| Tests | Vitest + Testing Library |

Autenticación con **Google OAuth**: un toque, sin contraseñas y sin depender de que
un correo se entregue. Todo el intercambio ocurre por redirección dentro del mismo
navegador, así que no hay cuotas de envío, ni dominio que verificar, ni carpeta de spam.

El acceso por enlace mágico sigue implementado y probado en `modules/auth`, pero **no se
expone en la interfaz**: sin un dominio verificado el proveedor de correo solo entrega a
la dirección dueña de la cuenta, y un formulario que no entrega nada es peor que ningún
formulario. Se reactiva en cuanto haya dominio.

---

## Arquitectura

Clean Architecture modularizada por contexto. La regla es una sola y no se negocia:

> **Las dependencias apuntan hacia adentro.** El dominio no conoce a nadie.

```
src/
├── core/                      # núcleo compartido
│   ├── domain/                # Result, DomainError, Entity, ValueObject
│   ├── application/           # contratos UseCase
│   └── infrastructure/        # cliente Supabase, traducción de errores, env
│
├── modules/                   # un módulo por contexto
│   ├── auth/
│   │   ├── domain/            # entidades, value objects, PUERTOS (interfaces)
│   │   ├── application/       # casos de uso
│   │   ├── infrastructure/    # ADAPTADORES (implementan los puertos)
│   │   └── presentation/      # hooks y componentes de React
│   ├── groups/
│   └── promises/
│
├── ui/                        # sistema de diseño (atomic design)
│   ├── atoms/ · molecules/ · organisms/
│
├── animations/                # capa GSAP aislada
│   ├── presets/               # coreografías reutilizables
│   └── hooks/                 # puentes con React
│
└── app/                       # rutas, layout y composition root
    └── composition/           # ÚNICO lugar que cablea puertos con adaptadores
```

### Por qué está así

**Dominio sin dependencias.** `Group`, `Member`, `PromiseCard` y sus reglas no importan
React, ni Supabase, ni nada. Por eso los tests del dominio corren en milisegundos sin
red ni base de datos.

**Puertos y adaptadores.** `AuthRepository` es una interfaz que declara el dominio;
`SupabaseAuthRepository` la implementa. La flecha va del adaptador hacia el dominio,
nunca al revés. Cambiar de backend significa reescribir `infrastructure/` y nada más.

**Errores como valores.** Ninguna capa lanza excepciones hacia arriba. Todo devuelve
`Result<T, DomainError>` y el compilador obliga a manejar el error antes de tocar el
valor. La infraestructura atrapa lo que lance el SDK y lo traduce.

**Composition Root único.** Ningún componente construye sus dependencias: las recibe.
Un test inyecta repositorios en memoria y ejercita la app completa sin tocar la red.

**Interfaces angostas.** `AssignmentRepository` está separado de `GroupRepository` a
propósito: la pantalla que lista grupos no tiene por qué poder tocar asignaciones.
Menos superficie, menos por dónde se filtra el secreto.

### SOLID, en concreto

| Principio | Dónde se ve |
|---|---|
| **S** | Un caso de uso = una intención. `RunDraw` sortea; no valida formularios ni pinta. |
| **O** | Un tema nuevo de tarjeta se agrega a `PROMISE_THEMES` sin tocar el componente. |
| **L** | Cualquier `AuthRepository` es intercambiable: los casos de uso no notan la diferencia. |
| **I** | Puertos pequeños y separados en vez de un `GroupService` con quince métodos. |
| **D** | Los casos de uso dependen de interfaces del dominio, no de clases de Supabase. |

---

## Seguridad del sorteo

Esta es la parte que no puede fallar. Si el secreto se filtra, el producto no sirve.

1. **El sorteo corre en el servidor.** `draw_group()` es una función `SECURITY DEFINER`
   de Postgres que genera un *derangement* (permutación sin puntos fijos) respetando
   las exclusiones. Devuelve un entero, nunca el mapa de asignaciones.
2. **Una sola política sobre `assignments`**, de SELECT:
   `giver_member_id = current_member_id(group_id)`. Cero políticas de escritura y cero
   GRANT de INSERT/UPDATE/DELETE para `authenticated`. Doble capa.
3. **Sin backdoor del organizador.** Verificado: tras sortear 5 personas, quien organiza
   ve **1 fila**, no 5.
4. **`revealed_at` se marca con una función, no con política de UPDATE.** RLS filtra
   *filas*, no *columnas*: una política de UPDATE sobre la fila propia dejaría a alguien
   reescribir `receiver_member_id` y elegir a quién regalarle.
5. **Anonimato de mensajes.** El receptor no tiene SELECT sobre `anonymous_messages`;
   lee con `get_my_anonymous_messages()`, que solo proyecta `(id, body, created_at)`.

La validación en el cliente es **conveniencia** (mensajes precisos, sin viaje al
servidor). La del servidor es **seguridad**. Nunca al revés.

### Un detalle matemático

Un grupo de **3 personas con cualquier exclusión es imposible de sortear**. Solo existen
dos permutaciones sin punto fijo de 3 elementos y toda exclusión aparece en ambas. No es
un fallo del algoritmo, es aritmética — así que la app lo detecta y lo explica *antes*
de que presiones el botón.

---

## Accesibilidad

No es una capa de pintura al final:

- Contraste **WCAG AA verificado por cálculo**, no a ojo. Los 12 temas de tarjeta están
  entre 8.4:1 y 12.1:1, y hay un test que lo comprueba con la fórmula de luminancia.
- `prefers-reduced-motion` respetado en toda la capa de animación. No se elimina el
  feedback: se convierte en cambios de opacidad sin desplazamiento.
- El mazo se opera **con teclado**: flechas para moverse entre cartas, Enter para elegir.
  Una sola parada de tabulación, no nueve.
- Botones ocupados usan `aria-disabled`, no `disabled`, para no perder el foco.
- Enlace de salto al contenido, foco siempre visible, y errores de formulario cableados
  con `aria-describedby` + `role="alert"`.

---

## Arrancar el proyecto

```bash
pnpm install
cp .env.example .env     # completa con tus datos de Supabase
pnpm dev
```

### Google OAuth

1. **Google Cloud Console** → *APIs & Services* → *Credentials* → crea un
   **OAuth 2.0 Client ID** de tipo *Web application*.
2. En **Authorized redirect URIs** pega la URL de callback de tu proyecto. Cópiala tal
   cual desde Supabase → *Authentication* → *Providers* → *Google*; no la escribas a
   mano. En local es `http://127.0.0.1:54321/auth/v1/callback`.
3. Vuelve a esa misma página de Supabase, activa el proveedor y pega el **Client ID** y
   el **Client Secret**.
4. En **Authentication** → *URL Configuration*, asegúrate de que tu origen esté en
   *Redirect URLs* (ej. `http://localhost:5173/**`). Si no está, Supabase ignora el
   `redirectTo` **en silencio** y te manda al Site URL.

### Supabase

```bash
supabase start                 # entorno local
supabase db reset              # aplica las 5 migraciones
```

O en un proyecto remoto: `supabase link --project-ref <ref> && supabase db push`.

Las migraciones están en `supabase/migrations/` y son reaplicables sin duplicar datos.
Ver `supabase/README.md` para el detalle.

> **No actives `force row level security`.** Los helpers `SECURITY DEFINER` que rompen
> la recursión de RLS dependen de que las tablas pertenezcan a `postgres`. Activarlo
> reintroduce el error `42P17`.

### Comandos

```bash
pnpm dev         # servidor de desarrollo
pnpm check       # typecheck + lint + tests
pnpm test        # solo tests
pnpm build       # build de producción
pnpm db:types    # regenerar tipos desde el esquema local
```

---

## Licencia

MIT

---

## Despliegue

La app es una SPA de Vite servida como estáticos en Vercel.

> **La regla de reescritura de `vercel.json` no es opcional.** Sin ella, cualquier URL
> que no sea `/` devuelve 404 al recargar — incluida `/entrar/confirmar`, que es
> exactamente donde aterriza el retorno de Google OAuth. El login quedaría roto en
> producción y funcionando en local, que es la peor combinación posible para depurar.

Se usa `vercel.json` y no `vercel.ts` a propósito: esta configuración no tiene lógica
dinámica ni lee variables de entorno, así que sumar la dependencia `@vercel/config`
para cuatro reglas estáticas no compensa.

Las variables `VITE_*` se resuelven **en tiempo de compilación**, no en ejecución. Deben
existir en Vercel *antes* del build o el bundle saldrá sin ellas.
