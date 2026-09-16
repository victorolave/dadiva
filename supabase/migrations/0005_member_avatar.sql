-- =============================================================================
-- 0005 · El avatar del miembro vive en group_members, no en profiles
-- =============================================================================
-- Motivo: `profiles` tiene lectura SOLO propia (principio de menor privilegio,
-- ver 0003). La interfaz necesita mostrar el avatar de los COMPAÑEROS de grupo,
-- así que había dos caminos:
--
--   (a) ampliar la política de `profiles` a "quienes comparten grupo conmigo"
--   (b) llevar el avatar a `group_members`, que ya es la tabla group-scoped
--
-- Elegimos (b). `group_members.display_name` ya funciona así: el nombre que ves
-- es el del grupo, no el global. El avatar es exactamente el mismo tipo de dato
-- y hacerlo simétrico evita abrir `profiles` a terceros. Beneficio extra: cada
-- quien puede usar un emoji distinto en cada grupo.
-- -----------------------------------------------------------------------------

alter table public.group_members
  add column if not exists avatar_emoji text not null default '🎁';

comment on column public.group_members.avatar_emoji is
  'Emoji del miembro DENTRO de este grupo. Group-scoped como display_name, para no abrir profiles a terceros.';

-- Un solo grafema. Sin esto, alguien podría meter un párrafo entero y romper el
-- layout de todas las listas de miembros del grupo.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'group_members_avatar_emoji_length'
  ) then
    alter table public.group_members
      add constraint group_members_avatar_emoji_length
      check (char_length(avatar_emoji) between 1 and 8);
  end if;
end $$;

-- Backfill desde profiles para los miembros que ya existían.
update public.group_members gm
   set avatar_emoji = p.avatar_emoji
  from public.profiles p
 where p.id = gm.user_id
   and gm.avatar_emoji = '🎁'
   and p.avatar_emoji is not null
   and p.avatar_emoji <> '🎁';

-- -----------------------------------------------------------------------------
-- join_group_by_code hereda el emoji del perfil al entrar al grupo, de modo que
-- la persona no tiene que volver a elegirlo en cada grupo nuevo.
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
  v_group    public.groups%rowtype;
  v_member   public.group_members%rowtype;
  v_user_id  uuid := auth.uid();
  v_emoji    text;
begin
  if v_user_id is null then
    raise exception 'Necesitas iniciar sesión para unirte a un grupo';
  end if;

  if coalesce(btrim(p_display_name), '') = '' then
    raise exception 'Escribe tu nombre para que los demás sepan quién eres';
  end if;

  select * into v_group
    from public.groups
   where invite_code = upper(btrim(p_invite_code));

  if not found then
    raise exception 'Ese código no corresponde a ningún grupo';
  end if;

  -- Idempotencia: quien abre el enlace de invitación dos veces no debe ver un
  -- error. Ya está adentro, que es lo que quería.
  select * into v_member
    from public.group_members
   where group_id = v_group.id
     and user_id  = v_user_id;

  if found then
    return v_member;
  end if;

  if v_group.status <> 'draft' then
    raise exception 'Este grupo ya fue sorteado y no admite más personas';
  end if;

  select coalesce(p.avatar_emoji, '🎁') into v_emoji
    from public.profiles p
   where p.id = v_user_id;

  insert into public.group_members (group_id, user_id, display_name, role, avatar_emoji)
       values (v_group.id, v_user_id, btrim(p_display_name), 'member', coalesce(v_emoji, '🎁'))
    returning * into v_member;

  return v_member;
end;
$$;

comment on function public.join_group_by_code(text, text) is
  'Une a quien llama a un grupo por código de invitación. Idempotente: si ya es miembro devuelve su fila.';
