-- =============================================================================
-- Dádiva — 0006: catálogo completo de tarjetas de promesa
--
-- ARCHIVO GENERADO. No editar a mano.
-- Fuente: src/modules/promises/infrastructure/data/promiseCatalog.ts
-- Regenerar con: npx tsx scripts/generate-promise-seed.ts
--
-- 68 versículos · 12 variantes visuales
--
-- El ON CONFLICT hace UPDATE y no DO NOTHING a propósito: la migración 0004
-- sembró 3 filas de ejemplo con theme_key inválidos ('gift', 'hope',
-- 'friendship') que no existen entre las variantes visuales. Al actualizar en
-- vez de ignorar, esas filas quedan corregidas en lugar de renderizarse todas
-- con el tema por defecto.
-- =============================================================================

insert into public.promise_cards (reference, text, version, theme_key)
values
  ('Santiago 1:17', 'Toda buena dádiva y todo don perfecto desciende de lo alto, del Padre de las luces, en el cual no hay mudanza, ni sombra de variación.', 'RVR1960', 'arcoiris'),
  ('Jeremías 29:11', 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.', 'RVR1960', 'margaritas'),
  ('Isaías 41:10', 'No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.', 'RVR1960', 'olas'),
  ('Salmos 23:1-2', 'Jehová es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará.', 'RVR1960', 'estrellas'),
  ('Filipenses 4:13', 'Todo lo puedo en Cristo que me fortalece.', 'RVR1960', 'lunares'),
  ('Romanos 8:28', 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.', 'RVR1960', 'sol'),
  ('Proverbios 3:5-6', 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.', 'RVR1960', 'jardin'),
  ('Isaías 40:31', 'Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.', 'RVR1960', 'atardecer'),
  ('Sofonías 3:17', 'Jehová está en medio de ti, poderoso, él salvará; se gozará sobre ti con alegría, callará de amor, se regocijará sobre ti con cánticos.', 'RVR1960', 'nube'),
  ('Deuteronomio 31:6', 'Esforzaos y cobrad ánimo; no temáis, ni tengáis miedo de ellos, porque Jehová tu Dios es el que va contigo; no te dejará, ni te desamparará.', 'RVR1960', 'hojas'),
  ('Salmos 46:1', 'Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.', 'RVR1960', 'confeti'),
  ('Mateo 11:28', 'Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.', 'RVR1960', 'luna'),
  ('Juan 14:27', 'La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da. No se turbe vuestro corazón, ni tenga miedo.', 'RVR1960', 'arcoiris'),
  ('2 Corintios 12:9', 'Bástate mi gracia; porque mi poder se perfecciona en la debilidad. Por tanto, de buena gana me gloriaré más bien en mis debilidades, para que repose sobre mí el poder de Cristo.', 'RVR1960', 'margaritas'),
  ('Lamentaciones 3:22-23', 'Por la misericordia de Jehová no hemos sido consumidos, porque nunca decayeron sus misericordias. Nuevas son cada mañana; grande es tu fidelidad.', 'RVR1960', 'olas'),
  ('Números 6:24-26', 'Jehová te bendiga, y te guarde; Jehová haga resplandecer su rostro sobre ti, y tenga de ti misericordia; Jehová alce sobre ti su rostro, y ponga en ti paz.', 'RVR1960', 'estrellas'),
  ('Salmos 27:1', 'Jehová es mi luz y mi salvación; ¿de quién temeré? Jehová es la fortaleza de mi vida; ¿de quién he de atemorizarme?', 'RVR1960', 'lunares'),
  ('Salmos 34:8', 'Gustad, y ved que es bueno Jehová; dichoso el hombre que confía en él.', 'RVR1960', 'sol'),
  ('Salmos 37:4', 'Deléitate asimismo en Jehová, y él te concederá las peticiones de tu corazón.', 'RVR1960', 'jardin'),
  ('Salmos 55:22', 'Echa sobre Jehová tu carga, y él te sustentará; no dejará para siempre caído al justo.', 'RVR1960', 'atardecer'),
  ('Salmos 91:1-2', 'El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente. Diré yo a Jehová: Esperanza mía, y castillo mío; mi Dios, en quien confiaré.', 'RVR1960', 'nube'),
  ('Salmos 121:1-2', 'Alzaré mis ojos a los montes; ¿de dónde vendrá mi socorro? Mi socorro viene de Jehová, que hizo los cielos y la tierra.', 'RVR1960', 'hojas'),
  ('Salmos 126:5', 'Los que sembraron con lágrimas, con regocijo segarán.', 'RVR1960', 'confeti'),
  ('Salmos 143:8', 'Hazme oír por la mañana tu misericordia, porque en ti he confiado; hazme saber el camino por donde ande, porque a ti he elevado mi alma.', 'RVR1960', 'luna'),
  ('Proverbios 16:3', 'Encomienda a Jehová tus obras, y tus pensamientos serán afirmados.', 'RVR1960', 'arcoiris'),
  ('Isaías 26:3', 'Tú guardarás en completa paz a aquel cuyo pensamiento en ti persevera; porque en ti ha confiado.', 'RVR1960', 'margaritas'),
  ('Isaías 43:1', 'Ahora, así dice Jehová, Creador tuyo, oh Jacob, y Formador tuyo, oh Israel: No temas, porque yo te redimí; te puse nombre, mío eres tú.', 'RVR1960', 'olas'),
  ('Isaías 54:10', 'Porque los montes se moverán, y los collados temblarán, pero no se apartará de ti mi misericordia, ni el pacto de mi paz se quebrantará, dijo Jehová, el que tiene misericordia de ti.', 'RVR1960', 'estrellas'),
  ('Jeremías 17:7', 'Bendito el varón que confía en Jehová, y cuya confianza es Jehová.', 'RVR1960', 'lunares'),
  ('Lamentaciones 3:25', 'Bueno es Jehová a los que en él esperan, al alma que le busca.', 'RVR1960', 'sol'),
  ('Nahúm 1:7', 'Jehová es bueno, fortaleza en el día de la angustia; y conoce a los que en él confían.', 'RVR1960', 'jardin'),
  ('Mateo 6:33', 'Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.', 'RVR1960', 'atardecer'),
  ('Mateo 6:26', 'Mirad las aves del cielo, que no siembran, ni siegan, ni recogen en graneros; y vuestro Padre celestial las alimenta. ¿No valéis vosotros mucho más que ellas?', 'RVR1960', 'nube'),
  ('Filipenses 4:7', 'Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús.', 'RVR1960', 'hojas'),
  ('Filipenses 4:19', 'Mi Dios, pues, suplirá todo lo que os falta conforme a sus riquezas en gloria en Cristo Jesús.', 'RVR1960', 'confeti'),
  ('Romanos 15:13', 'Y el Dios de esperanza os llene de todo gozo y paz en el creer, para que abundéis en esperanza por el poder del Espíritu Santo.', 'RVR1960', 'luna'),
  ('Romanos 8:31', '¿Qué, pues, diremos a esto? Si Dios es por nosotros, ¿quién contra nosotros?', 'RVR1960', 'arcoiris'),
  ('2 Corintios 5:17', 'De modo que si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas.', 'RVR1960', 'margaritas'),
  ('Efesios 3:20', 'Y a Aquel que es poderoso para hacer todas las cosas mucho más abundantemente de lo que pedimos o entendemos, según el poder que actúa en nosotros.', 'RVR1960', 'olas'),
  ('Efesios 2:10', 'Porque somos hechura suya, creados en Cristo Jesús para buenas obras, las cuales Dios preparó de antemano para que anduviésemos en ellas.', 'RVR1960', 'estrellas'),
  ('Jeremías 29:13', 'Y me buscaréis y me hallaréis, porque me buscaréis de todo vuestro corazón.', 'RVR1960', 'lunares'),
  ('Salmos 30:5', 'Porque un momento será su ira, pero su favor dura toda la vida. Por la noche durará el lloro, y a la mañana vendrá la alegría.', 'RVR1960', 'sol'),
  ('Salmos 16:11', 'Me mostrarás la senda de la vida; en tu presencia hay plenitud de gozo; delicias a tu diestra para siempre.', 'RVR1960', 'jardin'),
  ('Salmos 84:11', 'Porque sol y escudo es Jehová Dios; gracia y gloria dará Jehová. No quitará el bien a los que andan en integridad.', 'RVR1960', 'atardecer'),
  ('Salmos 34:18', 'Cercano está Jehová a los quebrantados de corazón; y salva a los contritos de espíritu.', 'RVR1960', 'nube'),
  ('Salmos 73:26', 'Mi carne y mi corazón desfallecen; mas la roca de mi corazón y mi porción es Dios para siempre.', 'RVR1960', 'hojas'),
  ('Salmos 62:1-2', 'En Dios solamente está acallada mi alma; de él viene mi salvación. Él solamente es mi roca y mi salvación; es mi refugio, no resbalaré mucho.', 'RVR1960', 'confeti'),
  ('Salmos 121:7-8', 'Jehová te guardará de todo mal; él guardará tu alma. Jehová guardará tu salida y tu entrada desde ahora y para siempre.', 'RVR1960', 'luna'),
  ('Josué 1:9', 'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.', 'RVR1960', 'arcoiris'),
  ('1 Pedro 5:7', 'Echando toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros.', 'RVR1960', 'margaritas'),
  ('1 Juan 4:18', 'En el amor no hay temor, sino que el perfecto amor echa fuera el temor; porque el temor lleva en sí castigo.', 'RVR1960', 'olas'),
  ('1 Juan 4:16', 'Dios es amor; y el que permanece en amor, permanece en Dios, y Dios en él.', 'RVR1960', 'estrellas'),
  ('Juan 3:16', 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.', 'RVR1960', 'lunares'),
  ('Romanos 5:8', 'Mas Dios muestra su amor para con nosotros, en que siendo aún pecadores, Cristo murió por nosotros.', 'RVR1960', 'sol'),
  ('Salmos 103:11-12', 'Porque como la altura de los cielos sobre la tierra, engrandeció su misericordia sobre los que le temen. Cuanto está lejos el oriente del occidente, hizo alejar de nosotros nuestras rebeliones.', 'RVR1960', 'jardin'),
  ('Salmos 100:5', 'Porque Jehová es bueno; para siempre es su misericordia, y su verdad por todas las generaciones.', 'RVR1960', 'atardecer'),
  ('Gálatas 6:9', 'No nos cansemos, pues, de hacer bien; porque a su tiempo segaremos, si no desmayamos.', 'RVR1960', 'nube'),
  ('Hebreos 13:5', 'Sean vuestras costumbres sin avaricia, contentos con lo que tenéis ahora; porque él dijo: No te desampararé, ni te dejaré.', 'RVR1960', 'hojas'),
  ('Hebreos 13:8', 'Jesucristo es el mismo ayer, y hoy, y por los siglos.', 'RVR1960', 'confeti'),
  ('Proverbios 3:24', 'Cuando te acuestes, no tendrás temor, sino que te acostarás, y tu sueño será grato.', 'RVR1960', 'luna'),
  ('Salmos 5:11', 'Pero alégrense todos los que en ti confían; den voces de júbilo para siempre, porque tú los defiendes; en ti se regocijen los que aman tu nombre.', 'RVR1960', 'arcoiris'),
  ('Salmos 118:24', 'Este es el día que hizo Jehová; nos gozaremos y alegraremos en él.', 'RVR1960', 'margaritas'),
  ('Isaías 55:12', 'Porque con alegría saldréis, y con paz seréis vueltos; los montes y los collados levantarán canción delante de vosotros, y todos los árboles del campo darán palmadas de aplauso.', 'RVR1960', 'olas'),
  ('Salmos 18:2', 'Jehová, roca mía y castillo mío, y mi libertador; Dios mío, fortaleza mía, en él confiaré; mi escudo, y la fuerza de mi salvación, mi alto refugio.', 'RVR1960', 'estrellas'),
  ('Isaías 41:13', 'Porque yo Jehová soy tu Dios, quien te sostiene de tu mano derecha, y te dice: No temas, yo te ayudo.', 'RVR1960', 'lunares'),
  ('Salmos 34:9-10', 'Temed a Jehová, vosotros sus santos, pues nada falta a los que le temen. Los leoncillos necesitan, y tienen hambre; pero los que buscan a Jehová no tendrán falta de ningún bien.', 'RVR1960', 'sol'),
  ('1 Juan 3:1', 'Mirad cuál amor nos ha dado el Padre, para que seamos llamados hijos de Dios; por esto el mundo no nos conoce, porque no le conoció a él.', 'RVR1960', 'jardin'),
  ('Proverbios 17:17', 'En todo tiempo ama el amigo, y es como un hermano en tiempo de angustia.', 'RVR1960', 'lunares')
on conflict (reference, version) do update
  set text      = excluded.text,
      theme_key = excluded.theme_key;
