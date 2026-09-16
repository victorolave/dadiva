import { LegalLayout } from './LegalLayout'

const CONTACT = 'victorolave1131@gmail.com'

/**
 * Política de privacidad.
 *
 * Está escrita contra el esquema real de la base de datos, no copiada de una
 * plantilla. Cada dato que se menciona aquí existe de verdad en una tabla, y
 * no se menciona ninguno que no recojamos. Una política que promete de más o
 * de menos es peor que no tenerla.
 */
export const PrivacyPage = () => (
  <LegalLayout title="Política de privacidad" updatedAt="16 de septiembre de 2026">
    <section className="flex flex-col gap-3">
      <p>
        Dádiva es una aplicación para organizar intercambios de regalos entre grupos de
        personas conocidas. Esta política explica exactamente qué datos guardamos, por qué,
        y qué puedes hacer con ellos.
      </p>
    </section>

    <section className="flex flex-col gap-3">
      <h2>Qué datos recogemos</h2>

      <p>
        <strong className="text-ink">Cuando entras con Google</strong>, recibimos únicamente
        tu nombre y tu dirección de correo. No pedimos ni recibimos acceso a tus contactos,
        a tu calendario, a tus archivos ni al contenido de tu correo.
      </p>

      <p>
        <strong className="text-ink">Cuando usas la aplicación</strong>, guardamos lo que tú
        escribes:
      </p>

      <ul className="flex flex-col gap-1.5">
        <li>El nombre y el emoji que eliges mostrar en cada grupo.</li>
        <li>Los grupos que creas: nombre, descripción, fecha del intercambio y presupuesto.</li>
        <li>Tu lista de deseos, si decides escribir una.</li>
        <li>La tarjeta de promesa que sacas en cada grupo.</li>
        <li>Los mensajes anónimos que envías dentro de un grupo.</li>
        <li>A quién te tocó regalar, resultado del sorteo.</li>
      </ul>

      <p>
        No usamos cookies de publicidad ni de seguimiento. No hay analítica de terceros que
        rastree tu navegación.
      </p>
    </section>

    <section className="flex flex-col gap-3">
      <h2>Quién puede ver tus datos</h2>

      <p>
        Los demás miembros de un grupo ven tu nombre, tu emoji y tu lista de deseos. Eso es
        justamente lo que hace funcionar el intercambio.
      </p>

      <p>
        <strong className="text-ink">Tu asignación del sorteo es secreta de verdad.</strong>{' '}
        Solo tú puedes ver a quién te tocó regalar. Nadie más puede consultarla: ni los otros
        participantes, ni quien organiza el grupo. Esa restricción está aplicada en la base de
        datos mediante políticas de seguridad a nivel de fila, no solo escondida en la
        interfaz.
      </p>

      <p>
        Los mensajes anónimos llegan a su destinatario sin revelar quién los escribió. La
        base de datos no le entrega el remitente a quien los recibe.
      </p>
    </section>

    <section className="flex flex-col gap-3">
      <h2>Dónde viven tus datos</h2>

      <p>
        La base de datos y la autenticación están alojadas en Supabase, sobre infraestructura
        de Amazon Web Services en Estados Unidos. La aplicación se sirve desde Vercel. No
        vendemos, alquilamos ni compartimos tus datos con terceros para fines comerciales.
      </p>
    </section>

    <section className="flex flex-col gap-3">
      <h2>Tus derechos</h2>

      <p>Puedes, en cualquier momento:</p>

      <ul className="flex flex-col gap-1.5">
        <li>Cambiar tu nombre visible y tu emoji desde tu perfil.</li>
        <li>Editar o borrar tu lista de deseos.</li>
        <li>Salir de un grupo antes de que se haga el sorteo.</li>
        <li>
          Pedir que borremos tu cuenta y todo lo asociado a ella, escribiendo a{' '}
          <a href={`mailto:${CONTACT}`} className="text-lilac-900 underline">
            {CONTACT}
          </a>
          .
        </li>
      </ul>

      <p>
        Al borrar tu cuenta se elimina tu perfil, tus listas de deseos, tus promesas y tus
        mensajes. Si eras parte de un grupo ya sorteado, tu nombre deja de mostrarse.
      </p>
    </section>

    <section className="flex flex-col gap-3">
      <h2>Menores de edad</h2>
      <p>
        Dádiva no está dirigida a menores de 13 años y no recogemos datos de forma consciente
        de personas de esa edad.
      </p>
    </section>

    <section className="flex flex-col gap-3">
      <h2>Cambios</h2>
      <p>
        Si esta política cambia, actualizaremos la fecha del encabezado. Los cambios de fondo
        se avisarán dentro de la aplicación.
      </p>
    </section>

    <section className="flex flex-col gap-3">
      <h2>Contacto</h2>
      <p>
        Cualquier duda o solicitud sobre tus datos:{' '}
        <a href={`mailto:${CONTACT}`} className="text-lilac-900 underline">
          {CONTACT}
        </a>
      </p>
    </section>
  </LegalLayout>
)
