-- =============================================================================
-- Dádiva — 0004: semilla del catálogo de tarjetas de promesa
--
-- El catálogo completo se genera desde src/modules/promises/infrastructure/data/promiseCatalog.ts
--
-- Este archivo deja SOLO la estructura del INSERT con 3 filas de ejemplo para
-- que el esquema sea usable de inmediato en local. Para cargar el catálogo
-- definitivo, exportá promiseCatalog.ts a SQL respetando exactamente estas
-- columnas y el ON CONFLICT de abajo.
--
-- theme_key identifica la variante visual de la tarjeta en el frontend; debe
-- coincidir con las claves de tema definidas en el módulo de promesas.
-- =============================================================================

insert into public.promise_cards (reference, text, version, theme_key)
values
  (
    'Santiago 1:17',
    'Toda buena dádiva y todo don perfecto desciende de lo alto, del Padre de las luces, en el cual no hay mudanza, ni sombra de variación.',
    'RVR1960',
    'gift'
  ),
  (
    'Jeremías 29:11',
    'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.',
    'RVR1960',
    'hope'
  ),
  (
    'Proverbios 17:17',
    'En todo tiempo ama el amigo, y es como un hermano en tiempo de angustia.',
    'RVR1960',
    'friendship'
  )
on conflict (reference, version) do nothing;
