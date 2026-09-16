import { usePageMeta } from '../../seo/usePageMeta'
import { LegalLayout } from './LegalLayout'

const CONTACT = 'victorolave1131@gmail.com'

export const TermsPage = () => {
  usePageMeta({
    title: 'Términos de uso · Dádiva',
    description: 'Cómo funciona Dádiva, qué se espera de quien la usa y los límites del servicio.',
    canonicalPath: '/terminos',
  })

  return (
    <LegalLayout title="Términos de uso" updatedAt="16 de septiembre de 2026">
      <section className="flex flex-col gap-3">
        <h2>Qué es Dádiva</h2>
        <p>
          Dádiva es una herramienta gratuita para organizar intercambios de regalos entre
          personas que ya se conocen: una familia, un grupo de amigos, una célula, una oficina.
          Al sorteo se le suma una tarjeta con un versículo bíblico para cada participante.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Cómo se usa</h2>
        <ul className="flex flex-col gap-1.5">
          <li>Necesitas una cuenta de Google para entrar.</li>
          <li>Solo entras a un grupo si alguien te comparte su código de invitación.</li>
          <li>El sorteo lo hace quien creó el grupo, y no se puede deshacer.</li>
          <li>Una vez sorteado, el grupo no admite personas nuevas.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Lo que esperamos de ti</h2>
        <p>
          Usa tu nombre real o uno que tu grupo reconozca. No publiques contenido ofensivo,
          ilegal ni que acose a otra persona, ni en las descripciones de grupo ni en las listas
          de deseos. Si usas la aplicación para hostigar a alguien, podemos eliminar el
          contenido y la cuenta responsable.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Los regalos son cosa tuya</h2>
        <p>
          Dádiva organiza el sorteo y guarda la información. No intermediamos compras, no
          procesamos pagos y no garantizamos que alguien cumpla con su regalo. El presupuesto
          que se define en un grupo es un acuerdo entre sus miembros, no una obligación que
          nosotros hagamos cumplir.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Los versículos</h2>
        <p>
          Las tarjetas de promesa citan la versión Reina-Valera 1960. Son contenido de aliento y
          no constituyen consejería espiritual, psicológica, médica ni profesional de ningún
          tipo.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Disponibilidad</h2>
        <p>
          Dádiva es un proyecto sin ánimo de lucro y se ofrece tal como está. Hacemos lo posible
          por mantenerla disponible, pero no garantizamos que funcione sin interrupciones. No
          nos hacemos responsables de un intercambio que no salga como esperabas por una caída
          del servicio.
        </p>
        <p>
          Puedes dejar de usarla cuando quieras y pedir que borremos tu cuenta escribiendo a{' '}
          <a href={`mailto:${CONTACT}`} className="link">
            {CONTACT}
          </a>
          .
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Cambios</h2>
        <p>
          Si estos términos cambian, actualizaremos la fecha del encabezado. Seguir usando la
          aplicación después de un cambio significa que lo aceptas.
        </p>
      </section>
    </LegalLayout>
  )
}
