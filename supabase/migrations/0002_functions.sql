-- =============================================================================
-- Dádiva — 0002: funciones de dominio
--
-- REGLA DE ORO DE ESTE ARCHIVO:
--   Toda función SECURITY DEFINER fija search_path y deriva SIEMPRE la identidad
--   de auth.uid(). Nunca acepta "quién soy" como parámetro. Así, aunque el
--   cliente llame la función con IDs ajenos, no puede suplantar a nadie.
--
--   Las funciones SECURITY DEFINER son propiedad de postgres, que también es
--   dueño de las tablas: por eso NO se les aplica RLS (no usamos FORCE ROW LEVEL
--   SECURITY en ninguna tabla) y sirven para romper la recursión de políticas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Bootstrap de perfil al crearse el usuario en auth.users
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name, avatar_emoji)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Amigo'
    ),
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'avatar_emoji'), ''), '🎁')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Crea el profile al registrarse un usuario. Con magic link el display_name inicial sale del email.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. generate_invite_code — 8 caracteres sin ambigüedad visual
--    Alfabeto de 31 símbolos: sin O, 0, I, 1, L (ni minúsculas).
--    Entropía: 31^8 ≈ 8.5e11 combinaciones.
--    Aleatoriedad fuerte vía gen_random_uuid() (CSPRNG nativo de PostgreSQL),
--    evitando depender de pgcrypto.
-- -----------------------------------------------------------------------------
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = public, pg_temp
as $$
declare
  c_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- 31 símbolos
  v_code     text;
  v_bytes    bytea;
  v_attempt  integer := 0;
  i          integer;
begin
  loop
    v_attempt := v_attempt + 1;
    v_code := '';
    -- 16 bytes aleatorios; usamos los primeros 8.
    v_bytes := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    for i in 0 .. 7 loop
      v_code := v_code || substr(c_alphabet, (get_byte(v_bytes, i) % length(c_alphabet)) + 1, 1);
    end loop;

    exit when not exists (select 1 from public.groups g where g.invite_code = v_code);

    if v_attempt >= 50 then
      raise exception 'No fue posible generar un código de invitación único';
    end if;
  end loop;

  return v_code;
end;
$$;

comment on function public.generate_invite_code() is
  'Genera un código de invitación único de 8 caracteres del alfabeto ABCDEFGHJKMNPQRSTUVWXYZ23456789.';

-- Ahora que la función existe, la enganchamos como DEFAULT de la columna.
alter table public.groups
  alter column invite_code set default public.generate_invite_code();

-- -----------------------------------------------------------------------------
-- 3. Helpers de identidad — ROMPEN LA RECURSIÓN DE RLS
--
--    La trampa clásica de Supabase: una política sobre group_members que hace
--    "select ... from group_members" se evalúa a sí misma → recursión infinita
--    (42P17). Estas funciones consultan las tablas SIN pasar por RLS y son
--    STABLE, así el planner las cachea por statement.
-- -----------------------------------------------------------------------------
create or replace function public.current_member_id(p_group_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select gm.id
  from public.group_members gm
  where gm.group_id = p_group_id
    and gm.user_id = auth.uid()
  limit 1;
$$;

comment on function public.current_member_id(uuid) is
  'group_members.id de quien llama dentro del grupo indicado, o NULL si no participa. Base de toda política de pertenencia.';

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = auth.uid()
  );
$$;

comment on function public.is_group_member(uuid) is
  'TRUE si quien llama pertenece al grupo. SECURITY DEFINER para evitar recursión de RLS.';

create or replace function public.is_group_owner(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = p_group_id
      and g.owner_id = auth.uid()
  );
$$;

comment on function public.is_group_owner(uuid) is
  'TRUE si quien llama es el organizador del grupo. Ser owner NO otorga acceso a assignments.';

create or replace function public.member_group_id(p_member_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select gm.group_id from public.group_members gm where gm.id = p_member_id;
$$;

comment on function public.member_group_id(uuid) is
  'Grupo al que pertenece un group_members.id. Usada por las políticas de wishlist_items.';

create or replace function public.is_my_member(p_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.id = p_member_id
      and gm.user_id = auth.uid()
  );
$$;

comment on function public.is_my_member(uuid) is
  'TRUE si ese group_members.id es la participación de quien llama.';

-- Devuelve SOLO el receptor de quien llama. Llamarla con otro grupo no filtra
-- nada: siempre se resuelve contra auth.uid().
create or replace function public.my_receiver_member_id(p_group_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select a.receiver_member_id
  from public.assignments a
  where a.group_id = p_group_id
    and a.giver_member_id = public.current_member_id(p_group_id)
  limit 1;
$$;

comment on function public.my_receiver_member_id(uuid) is
  'Miembro al que le regala quien llama. Se usa para validar el destinatario de los mensajes anónimos.';

-- -----------------------------------------------------------------------------
-- 4. Triggers de guarda de integridad de dominio
-- -----------------------------------------------------------------------------

-- 4.1 groups: owner_id e invite_code son inmutables; 'drawn' solo lo pone draw_group().
create or replace function public.tg_groups_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'El organizador del grupo no puede cambiarse';
  end if;

  if new.invite_code is distinct from old.invite_code then
    raise exception 'El código de invitación no puede cambiarse';
  end if;

  if new.status is distinct from old.status
     and coalesce(current_setting('dadiva.privileged', true), 'off') <> 'on'
     and new.status <> 'closed' then
    raise exception 'El estado solo puede cerrarse manualmente; el sorteo se realiza con draw_group()';
  end if;

  return new;
end;
$$;

drop trigger if exists groups_guard on public.groups;
create trigger groups_guard
  before update on public.groups
  for each row execute function public.tg_groups_guard();

-- 4.2 group_members: nadie se auto-promueve a owner ni migra su fila de grupo/usuario.
create or replace function public.tg_group_members_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.group_id is distinct from old.group_id
     or new.user_id is distinct from old.user_id then
    raise exception 'No se puede reasignar un miembro a otro grupo o usuario';
  end if;

  if new.role is distinct from old.role
     and coalesce(current_setting('dadiva.privileged', true), 'off') <> 'on' then
    raise exception 'El rol del miembro no puede modificarse';
  end if;

  return new;
end;
$$;

drop trigger if exists group_members_guard on public.group_members;
create trigger group_members_guard
  before update on public.group_members
  for each row execute function public.tg_group_members_guard();

-- 4.3 exclusions: ambos miembros deben pertenecer al grupo de la exclusión.
--     Una CHECK no puede hacer subconsultas, por eso va como trigger.
create or replace function public.tg_exclusions_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_matches integer;
begin
  -- Chequeo explícito antes del conteo: si a = b, el "in (a, b)" colapsa a un
  -- solo id y el mensaje genérico confundiría al organizador.
  if new.member_a_id = new.member_b_id then
    raise exception 'Un miembro no puede excluirse a sí mismo';
  end if;

  select count(*) into v_matches
  from public.group_members gm
  where gm.id in (new.member_a_id, new.member_b_id)
    and gm.group_id = new.group_id;

  if v_matches <> 2 then
    raise exception 'Ambos miembros de la exclusión deben pertenecer al grupo indicado';
  end if;

  if exists (select 1 from public.groups g where g.id = new.group_id and g.status <> 'draft') then
    raise exception 'No se pueden modificar exclusiones después del sorteo';
  end if;

  return new;
end;
$$;

drop trigger if exists exclusions_guard on public.exclusions;
create trigger exclusions_guard
  before insert or update on public.exclusions
  for each row execute function public.tg_exclusions_guard();

-- -----------------------------------------------------------------------------
-- 5. draw_group — EL SORTEO. Server-side, secreto, transaccional.
--
--    Genera un DERANGEMENT (permutación sin puntos fijos) que además respeta
--    las exclusiones. Estrategia: shuffle + validación, hasta 200 intentos.
--
--    Por qué shuffle-and-check y no un algoritmo constructivo: para grupos de
--    tamaño realista (< 60) la probabilidad de que una permutación aleatoria sea
--    un derangement tiende a 1/e ≈ 36.8%, así que 200 intentos fallan solo si
--    las exclusiones hacen el problema realmente infactible (p. ej. 4 personas
--    con 2 parejas cruzadas mal configuradas). Es simple de auditar, que es lo
--    que importa en código que custodia un secreto.
--
--    NO DEVUELVE EL MAPA: solo el número de asignaciones creadas. Si devolviera
--    las parejas, el organizador —que también juega— vería el sorteo completo.
-- -----------------------------------------------------------------------------
create or replace function public.draw_group(p_group_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c_max_attempts constant integer := 200;
  v_owner_id   uuid;
  v_status     public.group_status;
  v_members    uuid[];
  v_receivers  uuid[];
  v_excluded   text[];
  v_count      integer;
  v_attempt    integer := 0;
  v_valid      boolean := false;
  v_inserted   integer;
  i            integer;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para realizar el sorteo';
  end if;

  -- FOR UPDATE serializa sorteos concurrentes sobre el mismo grupo.
  select g.owner_id, g.status
    into v_owner_id, v_status
  from public.groups g
  where g.id = p_group_id
  for update;

  if not found then
    raise exception 'El grupo no existe';
  end if;

  if v_owner_id <> auth.uid() then
    raise exception 'Solo el organizador puede realizar el sorteo';
  end if;

  if v_status <> 'draft' then
    raise exception 'El sorteo de este grupo ya fue realizado o el grupo está cerrado';
  end if;

  select array_agg(gm.id order by gm.id)
    into v_members
  from public.group_members gm
  where gm.group_id = p_group_id;

  v_count := coalesce(array_length(v_members, 1), 0);

  if v_count < 3 then
    raise exception 'Se necesitan al menos 3 participantes para sortear (actualmente hay %)', v_count;
  end if;

  -- Exclusiones desnormalizadas en ambos sentidos: 'A:B' y 'B:A'.
  select coalesce(array_agg(pair), array[]::text[])
    into v_excluded
  from (
    select e.member_a_id::text || ':' || e.member_b_id::text as pair
    from public.exclusions e where e.group_id = p_group_id
    union all
    select e.member_b_id::text || ':' || e.member_a_id::text
    from public.exclusions e where e.group_id = p_group_id
  ) pares;

  -- Shuffle + validación acotada.
  while v_attempt < c_max_attempts and not v_valid loop
    v_attempt := v_attempt + 1;

    select array_agg(m order by random())
      into v_receivers
    from unnest(v_members) as m;

    v_valid := true;
    for i in 1 .. v_count loop
      if v_receivers[i] = v_members[i]
         or (v_members[i]::text || ':' || v_receivers[i]::text) = any (v_excluded) then
        v_valid := false;
        exit;
      end if;
    end loop;
  end loop;

  if not v_valid then
    -- Verificado por fuerza bruta: con 3 participantes solo existen 2 derangements
    -- ((2,3,1) y (3,1,2)) y CUALQUIER exclusión elimina a los dos. Es decir, un
    -- grupo de 3 con una sola pareja excluida es matemáticamente imposible, no un
    -- fallo del algoritmo. El HINT se lo explica al organizador sin cambiar el
    -- mensaje de error contractual.
    raise exception 'No fue posible generar un sorteo válido con las restricciones actuales'
      using hint = 'Con pocos participantes las exclusiones pueden volver el sorteo imposible: '
                   'un grupo de 3 personas no admite ninguna exclusión. Quitá alguna restricción '
                   'o invitá más gente.';
  end if;

  -- Todo lo que sigue es atómico dentro de la transacción de la función.
  delete from public.assignments a where a.group_id = p_group_id;

  insert into public.assignments (group_id, giver_member_id, receiver_member_id)
  select p_group_id, v_members[s], v_receivers[s]
  from generate_series(1, v_count) as s;

  get diagnostics v_inserted = row_count;

  perform set_config('dadiva.privileged', 'on', true);
  update public.groups set status = 'drawn' where id = p_group_id;
  perform set_config('dadiva.privileged', 'off', true);

  return v_inserted;
end;
$$;

comment on function public.draw_group(uuid) is
  'Sortea el grupo (derangement respetando exclusiones) y lo marca como drawn. Devuelve SOLO el conteo: jamás el mapa de asignaciones.';

-- -----------------------------------------------------------------------------
-- 6. reveal_assignment — marca que ya viste a tu amigo secreto
--    Existe para que assignments no necesite NINGUNA política de UPDATE:
--    una política de UPDATE dejaría que el giver reescribiera receiver_member_id.
-- -----------------------------------------------------------------------------
create or replace function public.reveal_assignment(p_group_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member_id uuid;
  v_revealed  timestamptz;
begin
  v_member_id := public.current_member_id(p_group_id);

  if v_member_id is null then
    raise exception 'No participas en este grupo';
  end if;

  update public.assignments a
     set revealed_at = coalesce(a.revealed_at, now())
   where a.group_id = p_group_id
     and a.giver_member_id = v_member_id
  returning a.revealed_at into v_revealed;

  if v_revealed is null then
    raise exception 'Todavía no hay un sorteo para este grupo';
  end if;

  return v_revealed;
end;
$$;

comment on function public.reveal_assignment(uuid) is
  'Marca revealed_at en la asignación PROPIA de quien llama. Idempotente.';

-- -----------------------------------------------------------------------------
-- 7. draw_promise — promesa bíblica del miembro, idempotente y persistente
--    Prefiere tarjetas que no hayan salido en el grupo; si se agotan, repite.
-- -----------------------------------------------------------------------------
create or replace function public.draw_promise(p_group_id uuid)
returns public.promise_cards
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member_id uuid;
  v_card_id   uuid;
  v_card      public.promise_cards;
begin
  v_member_id := public.current_member_id(p_group_id);

  if v_member_id is null then
    raise exception 'No participas en este grupo';
  end if;

  -- Idempotencia: si ya sacó promesa, se devuelve la misma para siempre.
  select mp.promise_card_id into v_card_id
  from public.member_promises mp
  where mp.group_id = p_group_id
    and mp.member_id = v_member_id;

  if v_card_id is null then
    -- Preferimos cartas aún no repartidas en este grupo.
    select pc.id into v_card_id
    from public.promise_cards pc
    where not exists (
      select 1 from public.member_promises mp
      where mp.group_id = p_group_id
        and mp.promise_card_id = pc.id
    )
    order by random()
    limit 1;

    -- Catálogo agotado para este grupo: se permiten repetidas.
    if v_card_id is null then
      select pc.id into v_card_id
      from public.promise_cards pc
      order by random()
      limit 1;
    end if;

    if v_card_id is null then
      raise exception 'No hay tarjetas de promesa disponibles en el catálogo';
    end if;

    -- ON CONFLICT cubre la carrera de dos pestañas pidiendo promesa a la vez.
    insert into public.member_promises (group_id, member_id, promise_card_id)
    values (p_group_id, v_member_id, v_card_id)
    on conflict (group_id, member_id) do nothing;

    -- Releemos: si perdimos la carrera, vale la promesa que ya quedó guardada.
    select mp.promise_card_id into v_card_id
    from public.member_promises mp
    where mp.group_id = p_group_id
      and mp.member_id = v_member_id;
  end if;

  select pc.* into v_card from public.promise_cards pc where pc.id = v_card_id;
  return v_card;
end;
$$;

comment on function public.draw_promise(uuid) is
  'Asigna (o devuelve) la tarjeta de promesa del miembro que llama. Idempotente: la misma promesa en cada reingreso.';

-- -----------------------------------------------------------------------------
-- 8. join_group_by_code — unirse sin poder listar grupos ajenos
--    groups no tiene política de SELECT para no-miembros: este es el ÚNICO
--    camino de entrada, y solo con el código exacto.
-- -----------------------------------------------------------------------------
create or replace function public.join_group_by_code(
  p_invite_code text,
  p_display_name text
)
returns public.group_members
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid     uuid := auth.uid();
  v_code    text := upper(btrim(coalesce(p_invite_code, '')));
  v_name    text := btrim(coalesce(p_display_name, ''));
  v_group   public.groups;
  v_member  public.group_members;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión para unirte a un grupo';
  end if;

  if v_code !~ '^[A-Z2-9]{8}$' then
    raise exception 'El código de invitación no es válido';
  end if;

  select g.* into v_group from public.groups g where g.invite_code = v_code;

  if not found then
    raise exception 'No encontramos un grupo con ese código';
  end if;

  -- Idempotente: reingresar devuelve la membresía existente sin tocar nada.
  select gm.* into v_member
  from public.group_members gm
  where gm.group_id = v_group.id
    and gm.user_id = v_uid;

  if found then
    return v_member;
  end if;

  if v_group.status <> 'draft' then
    raise exception 'Este grupo ya realizó el sorteo y no admite nuevos participantes';
  end if;

  if v_name = '' then
    select p.display_name into v_name from public.profiles p where p.id = v_uid;
    v_name := coalesce(nullif(v_name, ''), 'Amigo');
  end if;

  insert into public.group_members (group_id, user_id, display_name, role)
  values (v_group.id, v_uid, left(v_name, 60), 'member')
  returning * into v_member;

  return v_member;
end;
$$;

comment on function public.join_group_by_code(text, text) is
  'Une a quien llama a un grupo por código. Idempotente, rechaza grupos ya sorteados y nunca expone grupos ajenos.';

-- -----------------------------------------------------------------------------
-- 9. get_my_anonymous_messages — buzón del receptor SIN el remitente
--
--    DECISIÓN (documentada también en 0003): la tabla anonymous_messages no
--    concede SELECT al receptor. Una vista no alcanzaría, porque PostgREST
--    expone igualmente la tabla base del schema public y el cliente podría
--    consultarla directamente. Cortar el acceso en la tabla y exponer esta
--    función es la única forma de que from_member_id jamás viaje al receptor.
-- -----------------------------------------------------------------------------
create or replace function public.get_my_anonymous_messages(p_group_id uuid)
returns table (
  id         uuid,
  body       text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.id, m.body, m.created_at
  from public.anonymous_messages m
  where m.group_id = p_group_id
    and m.to_member_id = public.current_member_id(p_group_id)
  order by m.created_at desc;
$$;

comment on function public.get_my_anonymous_messages(uuid) is
  'Mensajes anónimos recibidos por quien llama. Proyecta solo id, body y created_at: nunca from_member_id.';

create or replace function public.group_is_draft(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.groups g
    where g.id = p_group_id and g.status = 'draft'
  );
$$;

comment on function public.group_is_draft(uuid) is
  'TRUE si el grupo sigue en borrador. Evita subconsultas a groups dentro de políticas de otras tablas (doble evaluación de RLS).';

-- -----------------------------------------------------------------------------
-- 10. Permisos de ejecución
--     Por defecto PostgreSQL concede EXECUTE a PUBLIC. En funciones SECURITY
--     DEFINER eso es inaceptable: lo revocamos y concedemos explícitamente.
-- -----------------------------------------------------------------------------
do $$
declare
  v_signature text;
begin
  foreach v_signature in array array[
    'public.generate_invite_code()',
    'public.current_member_id(uuid)',
    'public.is_group_member(uuid)',
    'public.is_group_owner(uuid)',
    'public.member_group_id(uuid)',
    'public.is_my_member(uuid)',
    'public.my_receiver_member_id(uuid)',
    'public.group_is_draft(uuid)',
    'public.draw_group(uuid)',
    'public.reveal_assignment(uuid)',
    'public.draw_promise(uuid)',
    'public.join_group_by_code(text, text)',
    'public.get_my_anonymous_messages(uuid)'
  ]
  loop
    execute format('revoke all on function %s from public, anon', v_signature);
    execute format('grant execute on function %s to authenticated, service_role', v_signature);
  end loop;
end
$$;
