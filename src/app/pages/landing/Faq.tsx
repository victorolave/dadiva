import { ChevronDown } from 'lucide-react'
import { Sticker } from '@ui/atoms'

/**
 * Cada respuesta está verificada contra el código antes de escribirse, no
 * copiada de una plantilla genérica de FAQ:
 *
 * - Costo: no hay ninguna integración de pagos en el repo (`package.json`).
 * - Cuenta: `unirse`/`unirse/:code` viven bajo `ProtectedRoute`
 *   (`src/app/routes/ProtectedRoute.tsx`), así que hace falta sesión incluso
 *   para entrar con un código.
 * - Unirse tarde: `Group.canAcceptNewMembers()` solo lo permite mientras el
 *   grupo sigue en `draft`; `draw_group()` cierra el grupo a nuevas personas
 *   en la misma transacción del sorteo.
 * - Repetir el sorteo: `Group.canDraw()` rechaza con `group.already_drawn` y
 *   la máquina de estados (`GroupStatus.ts`) no tiene camino de vuelta de
 *   `drawn` a `draft`.
 * - Tamaño del grupo: `Group.MIN_MEMBERS_TO_DRAW` (3) y `Group.MAX_MEMBERS`
 *   (60).
 * - Lista de deseos: tope de `WishlistItem.MAX_ITEMS` (20). La política RLS
 *   `wishlist_select_group` (`0003_rls_policies.sql`) deja leerla a todo el
 *   grupo, así que no se promete que sea privada: la interfaz solo la
 *   destaca a quien regala (`SupabaseAssignmentRepository.findMine`), pero
 *   la base de datos no se la oculta al resto.
 */
const FAQ_ITEMS = [
  {
    question: '¿Cuánto cuesta usar Dádiva?',
    answer: 'Nada. Crear grupos, invitar gente, sortear y sacar tu promesa no tiene ningún costo.',
  },
  {
    question: '¿Necesito una cuenta?',
    answer:
      'Sí, entras con tu cuenta de Google, tanto para crear un grupo como para unirte con un código. No hace falta ninguna contraseña nueva.',
  },
  {
    question: '¿Puedo unirme si el grupo ya empezó?',
    answer:
      'Puedes unirte en cualquier momento antes de que quien organiza haga el sorteo. Una vez sorteado, el grupo se cierra y ya no admite personas nuevas.',
  },
  {
    question: '¿Se puede repetir el sorteo si alguien se equivoca?',
    answer:
      'No. Un sorteo no se puede rehacer: en el momento en que se hace, cada quien ya puede ver a su amigo secreto, y deshacerlo sería peor que el error que se quería corregir.',
  },
  {
    question: '¿Cuántas personas hacen falta para sortear?',
    answer:
      'Mínimo 3: con menos no hay secreto que guardar, porque cada quien sabría exactamente a quién le regala. El máximo por grupo es 60 personas.',
  },
  {
    question: '¿Qué pasa con mi promesa si cierro la página y vuelvo?',
    answer:
      'Se queda guardada tal cual. La misma carta te espera cada vez que entres a ese grupo, no se vuelve a sortear.',
  },
  {
    question: '¿Cómo sabe mi amigo secreto qué regalarme?',
    answer:
      'Escribes tu lista de deseos dentro del grupo, con hasta 20 ideas, cada una con enlace y notas si quieres. Todo el grupo puede verla, y cuando se hace el sorteo se la mostramos destacada a la persona que te va a regalar.',
  },
] as const

export const Faq = () => (
  <section aria-labelledby="preguntas-frecuentes" className="mx-auto flex w-full max-w-reading flex-col gap-8">
    <div className="text-center">
      <p className="eyebrow">Antes de empezar</p>
      <h2 id="preguntas-frecuentes" className="mt-2 text-h2">
        Preguntas frecuentes.
      </h2>
    </div>

    <div className="flex flex-col gap-3">
      {FAQ_ITEMS.map((item) => (
        <Sticker key={item.question} as="div" elevation="sm" className="overflow-hidden p-0">
          {/* `<details>/<summary>` nativo: divulgación accesible sin JS ni
              estado propio. El foco visible ya lo cubre la regla global de
              `theme.css`, que incluye `summary` explícitamente. */}
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 font-bold [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <p className="px-5 pb-5 text-base leading-relaxed text-ink-soft">{item.answer}</p>
          </details>
        </Sticker>
      ))}
    </div>
  </section>
)
