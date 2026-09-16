-- =============================================================================
-- Dádiva — 0003: Row Level Security
--
-- MODELO MENTAL
--   1. GRANT define QUÉ VERBOS puede intentar un rol sobre una tabla.
--   2. RLS define QUÉ FILAS ve o toca dentro de esos verbos.
--   Usamos ambas capas: aunque una política tuviera un bug, `assignments` no
--   tiene siquiera el privilegio INSERT/UPDATE/DELETE para `authenticated`.
--
-- INVARIANTE #1 (el que justifica todo el producto)
--   Nadie puede leer una asignación ajena. Ni el organizador. La única política
--   de SELECT sobre assignments compara giver_member_id con current_member_id(),
--   que se resuelve SIEMPRE contra auth.uid(). No existe política de INSERT,
--   UPDATE ni DELETE: solo draw_group() y reveal_assignment() escriben ahí.
--
-- NOTA SOBRE service_role
--   service_role omite RLS por diseño. Su clave es de servidor: NUNCA debe
--   llegar al bundle del cliente. En el frontend solo se usa VITE_SUPABASE_ANON_KEY.
--
-- NOTA SOBRE FORCE ROW LEVEL SECURITY
--   No se activa a propósito. Las tablas pertenecen a postgres, igual que las
--   funciones SECURITY DEFINER; ese es justamente el mecanismo que permite a los
--   helpers (is_group_member, current_member_id...) consultar las tablas sin
--   disparar la recursión infinita de políticas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Habilitar RLS en TODAS las tablas. Sin excepción.
-- -----------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.groups             enable row level security;
alter table public.group_members      enable row level security;
alter table public.exclusions         enable row level security;
alter table public.assignments        enable row level security;
alter table public.wishlist_items     enable row level security;
alter table public.promise_cards      enable row level security;
alter table public.member_promises    enable row level security;
alter table public.anonymous_messages enable row level security;

-- -----------------------------------------------------------------------------
-- 1. Privilegios base (capa 1)
--    anon = visitante sin sesión: no toca ninguna tabla de negocio.
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

revoke all on public.profiles, public.groups, public.group_members,
              public.exclusions, public.assignments, public.wishlist_items,
              public.promise_cards, public.member_promises, public.anonymous_messages
  from anon, authenticated;

grant select, insert, update          on public.profiles           to authenticated;
grant select, insert, update, delete  on public.groups             to authenticated;
grant select, insert, update, delete  on public.group_members      to authenticated;
grant select, insert, update, delete  on public.exclusions         to authenticated;
grant select, insert, update, delete  on public.wishlist_items     to authenticated;
grant select, insert,         delete  on public.anonymous_messages to authenticated;

-- Solo lectura: estas tablas únicamente se escriben desde funciones o service_role.
grant select on public.assignments     to authenticated;
grant select on public.promise_cards   to authenticated;
grant select on public.member_promises to authenticated;

grant all on public.profiles, public.groups, public.group_members,
             public.exclusions, public.assignments, public.wishlist_items,
             public.promise_cards, public.member_promises, public.anonymous_messages
  to service_role;

-- =============================================================================
-- 2. profiles — cada quien ve y edita SOLO su propio perfil.
--    Los nombres visibles del grupo viven en group_members.display_name, así que
--    no hace falta abrir profiles al resto de participantes.
-- =============================================================================
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Sin política de DELETE: el perfil muere por cascada al borrarse auth.users.

-- =============================================================================
-- 3. groups — no existe "listar grupos". Solo los tuyos.
--    Un extraño no puede descubrir grupos ni códigos: para entrar debe conocer
--    el invite_code exacto y pasar por join_group_by_code().
-- =============================================================================
drop policy if exists "groups_select_member_or_owner" on public.groups;
create policy "groups_select_member_or_owner"
  on public.groups for select to authenticated
  using (owner_id = auth.uid() or public.is_group_member(id));

-- owner_id = auth.uid() y arranca siempre en 'draft'.
drop policy if exists "groups_insert_own" on public.groups;
create policy "groups_insert_own"
  on public.groups for insert to authenticated
  with check (owner_id = auth.uid() and status = 'draft');

-- El trigger groups_guard bloquea cambios de owner_id, invite_code y el paso a 'drawn'.
drop policy if exists "groups_update_owner" on public.groups;
create policy "groups_update_owner"
  on public.groups for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "groups_delete_owner" on public.groups;
create policy "groups_delete_owner"
  on public.groups for delete to authenticated
  using (owner_id = auth.uid());

-- =============================================================================
-- 4. group_members — AQUÍ ESTÁ LA TRAMPA DE LA RECURSIÓN
--    "puedo ver a los miembros de los grupos donde estoy" consultando
--    group_members desde una política de group_members se evalúa a sí misma:
--    ERROR 42P17 infinite recursion detected in policy for relation
--    "group_members". Por eso TODA referencia pasa por is_group_member() /
--    is_my_member() / is_group_owner(), que son SECURITY DEFINER.
-- =============================================================================
drop policy if exists "group_members_select_same_group" on public.group_members;
create policy "group_members_select_same_group"
  on public.group_members for select to authenticated
  using (public.is_group_member(group_id) or public.is_group_owner(group_id));

-- Único INSERT directo permitido: el organizador dándose de alta a sí mismo al
-- crear el grupo. El resto entra por join_group_by_code() (SECURITY DEFINER).
drop policy if exists "group_members_insert_owner_self" on public.group_members;
create policy "group_members_insert_owner_self"
  on public.group_members for insert to authenticated
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and public.is_group_owner(group_id)
  );

-- Solo el apodo propio. El trigger group_members_guard congela role/user_id/group_id.
drop policy if exists "group_members_update_own" on public.group_members;
create policy "group_members_update_own"
  on public.group_members for update to authenticated
  using (public.is_my_member(id))
  with check (public.is_my_member(id));

-- Salir del grupo (o que el organizador te saque) solo antes del sorteo, y el
-- organizador nunca puede borrarse a sí mismo: dejaría el grupo huérfano.
drop policy if exists "group_members_delete_draft" on public.group_members;
create policy "group_members_delete_draft"
  on public.group_members for delete to authenticated
  using (
    role <> 'owner'
    and public.group_is_draft(group_id)
    and (public.is_my_member(id) or public.is_group_owner(group_id))
  );

-- =============================================================================
-- 5. exclusions — SOLO el organizador.
--    DECISIÓN DE SEGURIDAD: las exclusiones son información que reduce el
--    espacio de soluciones del sorteo. Combinadas con tu propia asignación, en
--    grupos chicos permiten deducir por eliminación quién le regala a quién.
--    Por eso ni siquiera se muestran a los demás miembros.
-- =============================================================================
drop policy if exists "exclusions_select_owner" on public.exclusions;
create policy "exclusions_select_owner"
  on public.exclusions for select to authenticated
  using (public.is_group_owner(group_id));

drop policy if exists "exclusions_insert_owner" on public.exclusions;
create policy "exclusions_insert_owner"
  on public.exclusions for insert to authenticated
  with check (public.is_group_owner(group_id) and public.group_is_draft(group_id));

drop policy if exists "exclusions_update_owner" on public.exclusions;
create policy "exclusions_update_owner"
  on public.exclusions for update to authenticated
  using (public.is_group_owner(group_id) and public.group_is_draft(group_id))
  with check (public.is_group_owner(group_id) and public.group_is_draft(group_id));

drop policy if exists "exclusions_delete_owner" on public.exclusions;
create policy "exclusions_delete_owner"
  on public.exclusions for delete to authenticated
  using (public.is_group_owner(group_id) and public.group_is_draft(group_id));

-- =============================================================================
-- 6. assignments — EL SECRETO
--
--    UNA sola política, y es de SELECT. Lee "la fila donde YO soy quien regala".
--    current_member_id(group_id) devuelve NULL si no participo del grupo, y
--    `giver_member_id = NULL` evalúa a NULL (no TRUE), así que la fila se filtra.
--
--    Verificación contra el requisito: ¿puede alguien leer una asignación ajena?
--      - ¿Otro miembro?      NO: su current_member_id() es otro uuid.
--      - ¿El organizador?    NO: no hay cláusula is_group_owner en ningún lado.
--      - ¿Un extraño?        NO: no participa, current_member_id() es NULL.
--      - ¿Vía otra tabla?    NO: ninguna vista ni función proyecta receiver ajeno.
--      - ¿Escribiendo?       NO: sin políticas de escritura y sin GRANT de
--                            INSERT/UPDATE/DELETE para authenticated.
--    La única filtración posible es la deducción por eliminación en grupos muy
--    chicos (por eso el mínimo de 3 y las exclusiones ocultas), inherente al juego.
-- =============================================================================
drop policy if exists "assignments_select_own_gift" on public.assignments;
create policy "assignments_select_own_gift"
  on public.assignments for select to authenticated
  using (giver_member_id = public.current_member_id(group_id));

-- SIN políticas de INSERT/UPDATE/DELETE. A propósito.
-- Escribir asignaciones = draw_group(). Marcar revelado = reveal_assignment().
-- Una política de UPDATE, aun limitada a la fila propia, dejaría al giver
-- reescribir receiver_member_id y elegirse a quién regalar.

-- =============================================================================
-- 7. wishlist_items — lectura para todo el grupo, escritura solo del dueño.
-- =============================================================================
drop policy if exists "wishlist_select_group" on public.wishlist_items;
create policy "wishlist_select_group"
  on public.wishlist_items for select to authenticated
  using (public.is_group_member(public.member_group_id(member_id)));

drop policy if exists "wishlist_insert_own" on public.wishlist_items;
create policy "wishlist_insert_own"
  on public.wishlist_items for insert to authenticated
  with check (public.is_my_member(member_id));

drop policy if exists "wishlist_update_own" on public.wishlist_items;
create policy "wishlist_update_own"
  on public.wishlist_items for update to authenticated
  using (public.is_my_member(member_id))
  with check (public.is_my_member(member_id));

drop policy if exists "wishlist_delete_own" on public.wishlist_items;
create policy "wishlist_delete_own"
  on public.wishlist_items for delete to authenticated
  using (public.is_my_member(member_id));

-- =============================================================================
-- 8. promise_cards — catálogo global de solo lectura.
--    Sin políticas de escritura: se carga por migración o con service_role.
-- =============================================================================
drop policy if exists "promise_cards_select_authenticated" on public.promise_cards;
create policy "promise_cards_select_authenticated"
  on public.promise_cards for select to authenticated
  using (true);

-- =============================================================================
-- 9. member_promises — cada quien ve SOLO su promesa.
--    Se escribe exclusivamente desde draw_promise().
--    (Si algún día se quiere un "muro de promesas" del grupo, basta cambiar el
--    USING por is_group_member(group_id); no afecta el secreto del sorteo.)
-- =============================================================================
drop policy if exists "member_promises_select_own" on public.member_promises;
create policy "member_promises_select_own"
  on public.member_promises for select to authenticated
  using (public.is_my_member(member_id));

-- =============================================================================
-- 10. anonymous_messages — el anonimato es la feature
--
--     DECISIÓN DOCUMENTADA: el receptor NO tiene SELECT sobre la tabla base.
--     Lee su buzón con public.get_my_anonymous_messages(group_id), que proyecta
--     solo (id, body, created_at).
--
--     ¿Por qué no una vista sin la columna from_member_id?
--     Porque PostgREST expone todo el schema public: el cliente podría consultar
--     la tabla base directamente y saltarse la vista. La restricción por columna
--     no existe en RLS (las políticas filtran FILAS, no COLUMNAS), y los
--     column-level GRANT no distinguen "soy el remitente" de "soy el receptor".
--     Cortar el SELECT del receptor en la tabla y exponer una función
--     SECURITY DEFINER es la única forma de que from_member_id jamás viaje.
--
--     El remitente sí lee sus propios envíos: no aprende nada que no supiera.
-- =============================================================================
drop policy if exists "anonymous_messages_select_sender" on public.anonymous_messages;
create policy "anonymous_messages_select_sender"
  on public.anonymous_messages for select to authenticated
  using (from_member_id = public.current_member_id(group_id));

-- Solo podés escribirle a TU amigo asignado, y solo en tu nombre.
-- my_receiver_member_id() devuelve NULL antes del sorteo, así que el INSERT
-- queda bloqueado hasta que el grupo esté sorteado.
drop policy if exists "anonymous_messages_insert_to_my_receiver" on public.anonymous_messages;
create policy "anonymous_messages_insert_to_my_receiver"
  on public.anonymous_messages for insert to authenticated
  with check (
    from_member_id = public.current_member_id(group_id)
    and to_member_id = public.my_receiver_member_id(group_id)
  );

-- Retractarse de un mensaje propio. Sin UPDATE: un mensaje anónimo editable
-- después de leído es una puerta a manipular la conversación.
drop policy if exists "anonymous_messages_delete_sender" on public.anonymous_messages;
create policy "anonymous_messages_delete_sender"
  on public.anonymous_messages for delete to authenticated
  using (from_member_id = public.current_member_id(group_id));
