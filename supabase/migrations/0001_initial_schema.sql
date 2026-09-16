-- =============================================================================
-- Dádiva — 0001: esquema inicial
-- Extensiones, tipos enum, tablas, índices y triggers de updated_at.
-- Las funciones de dominio viven en 0002 y las políticas RLS en 0003.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensiones
-- gen_random_uuid() es nativo desde PostgreSQL 13, no requiere pgcrypto.
-- pg_trgm no se usa hoy; se deja fuera a propósito para no inflar el esquema.
-- -----------------------------------------------------------------------------
create schema if not exists extensions;

-- -----------------------------------------------------------------------------
-- Tipos enum (idempotentes: no existe "create type if not exists")
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type t
                 join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'group_status' and n.nspname = 'public') then
    create type public.group_status as enum ('draft', 'drawn', 'closed');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type t
                 join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'member_role' and n.nspname = 'public') then
    create type public.member_role as enum ('owner', 'member');
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- Utilidad: trigger genérico de updated_at
-- -----------------------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.tg_set_updated_at() is
  'Mantiene updated_at sincronizado en cada UPDATE.';

-- -----------------------------------------------------------------------------
-- profiles — espejo público de auth.users
-- El email NUNCA se replica aquí: vive solo en auth.users.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text        not null check (length(btrim(display_name)) between 1 and 60),
  avatar_emoji text        not null default '🎁' check (length(avatar_emoji) <= 8),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil público del usuario. Se crea automáticamente vía trigger sobre auth.users.';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- -----------------------------------------------------------------------------
-- groups — un amigo secreto
-- invite_code recibe su DEFAULT en 0002, cuando ya existe generate_invite_code().
-- status solo pasa a 'drawn' desde draw_group(); ver trigger de guarda en 0002.
-- -----------------------------------------------------------------------------
create table if not exists public.groups (
  id              uuid primary key default gen_random_uuid(),
  name            text        not null check (length(btrim(name)) between 1 and 80),
  description     text        check (length(description) <= 500),
  owner_id        uuid        not null references public.profiles (id) on delete cascade,
  exchange_date   date,
  budget_amount   numeric(12, 2) check (budget_amount is null or budget_amount >= 0),
  budget_currency text        not null default 'COP' check (length(budget_currency) = 3),
  invite_code     text        not null unique check (invite_code ~ '^[A-Z2-9]{8}$'),
  status          public.group_status not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.groups is
  'Grupo de amigo secreto. El organizador (owner_id) también participa del sorteo.';
comment on column public.groups.invite_code is
  'Código de 8 caracteres sin ambigüedad visual (sin O, 0, I, 1, L). DEFAULT asignado en 0002.';

drop trigger if exists groups_set_updated_at on public.groups;
create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.tg_set_updated_at();

create index if not exists groups_owner_id_idx on public.groups (owner_id);
create index if not exists groups_status_idx    on public.groups (status);

-- -----------------------------------------------------------------------------
-- group_members — participación de un usuario en un grupo
-- display_name puede diferir del profile (apodos por grupo).
-- -----------------------------------------------------------------------------
create table if not exists public.group_members (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid        not null references public.groups (id)   on delete cascade,
  user_id      uuid        not null references public.profiles (id) on delete cascade,
  display_name text        not null check (length(btrim(display_name)) between 1 and 60),
  role         public.member_role not null default 'member',
  joined_at    timestamptz not null default now(),
  constraint group_members_group_user_unique unique (group_id, user_id)
);

comment on table public.group_members is
  'Miembro de un grupo. La identidad de dominio en el resto del esquema es group_members.id, no user_id.';

create index if not exists group_members_group_id_idx on public.group_members (group_id);
create index if not exists group_members_user_id_idx  on public.group_members (user_id);

-- -----------------------------------------------------------------------------
-- exclusions — pares que NO pueden tocarse (ej. parejas)
-- Relación SIMÉTRICA: se guarda una sola fila y se interpreta en ambos sentidos.
-- -----------------------------------------------------------------------------
create table if not exists public.exclusions (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups (id)        on delete cascade,
  member_a_id  uuid not null references public.group_members (id) on delete cascade,
  member_b_id  uuid not null references public.group_members (id) on delete cascade,
  created_at   timestamptz not null default now(),
  constraint exclusions_not_self check (member_a_id <> member_b_id)
);

comment on table public.exclusions is
  'Par de miembros que no pueden regalarse entre sí. Simétrica: una fila cubre A->B y B->A.';

-- Par normalizado con least/greatest: (A,B) y (B,A) colisionan en el mismo índice.
create unique index if not exists exclusions_normalized_pair_unique
  on public.exclusions (group_id, least(member_a_id, member_b_id), greatest(member_a_id, member_b_id));

create index if not exists exclusions_group_id_idx on public.exclusions (group_id);

-- -----------------------------------------------------------------------------
-- assignments — EL SECRETO. Solo lo escribe draw_group().
-- Ningún cliente inserta, actualiza ni borra aquí (ver 0003).
-- -----------------------------------------------------------------------------
create table if not exists public.assignments (
  id                  uuid primary key default gen_random_uuid(),
  group_id            uuid not null references public.groups (id)        on delete cascade,
  giver_member_id     uuid not null references public.group_members (id) on delete cascade,
  receiver_member_id  uuid not null references public.group_members (id) on delete cascade,
  revealed_at         timestamptz,
  created_at          timestamptz not null default now(),
  constraint assignments_no_self check (giver_member_id <> receiver_member_id),
  constraint assignments_one_gift_per_giver    unique (group_id, giver_member_id),
  constraint assignments_one_gift_per_receiver unique (group_id, receiver_member_id)
);

comment on table public.assignments is
  'Resultado del sorteo. RLS permite leer ÚNICAMENTE la fila propia (giver = quien consulta). Ni el organizador ve las ajenas.';

create index if not exists assignments_group_id_idx on public.assignments (group_id);
create index if not exists assignments_giver_idx    on public.assignments (giver_member_id);

-- -----------------------------------------------------------------------------
-- wishlist_items — lista de deseos por miembro
-- Visible para todo el grupo (quien regala necesita verla), editable solo por su dueño.
-- -----------------------------------------------------------------------------
create table if not exists public.wishlist_items (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.group_members (id) on delete cascade,
  title      text not null check (length(btrim(title)) between 1 and 140),
  url        text check (url is null or url ~* '^https?://'),
  notes      text check (length(notes) <= 500),
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.wishlist_items is
  'Deseos de un miembro. Lectura para todo el grupo, escritura solo del dueño.';

create index if not exists wishlist_items_member_id_idx on public.wishlist_items (member_id, position);

-- -----------------------------------------------------------------------------
-- promise_cards — catálogo GLOBAL de versículos (no pertenece a ningún grupo)
-- Lectura para cualquier usuario autenticado; escritura solo service_role.
-- -----------------------------------------------------------------------------
create table if not exists public.promise_cards (
  id         uuid primary key default gen_random_uuid(),
  reference  text not null,
  text       text not null,
  version    text not null default 'RVR1960',
  theme_key  text not null default 'default',
  created_at timestamptz not null default now(),
  constraint promise_cards_reference_version_unique unique (reference, version)
);

comment on table public.promise_cards is
  'Catálogo global de tarjetas de promesa bíblica. theme_key identifica la variante visual.';

create index if not exists promise_cards_theme_key_idx on public.promise_cards (theme_key);

-- -----------------------------------------------------------------------------
-- member_promises — la promesa que sacó cada persona (una por grupo, persistente)
-- -----------------------------------------------------------------------------
create table if not exists public.member_promises (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid not null references public.groups (id)         on delete cascade,
  member_id       uuid not null references public.group_members (id)  on delete cascade,
  promise_card_id uuid not null references public.promise_cards (id)  on delete restrict,
  drawn_at        timestamptz not null default now(),
  constraint member_promises_one_per_member unique (group_id, member_id)
);

comment on table public.member_promises is
  'Promesa asignada a un miembro. UNIQUE(group_id, member_id) garantiza idempotencia al reingresar.';

create index if not exists member_promises_group_id_idx on public.member_promises (group_id);
create index if not exists member_promises_card_idx     on public.member_promises (group_id, promise_card_id);

-- -----------------------------------------------------------------------------
-- anonymous_messages — mensajes anónimos hacia el amigo asignado
-- El receptor NUNCA puede leer from_member_id: ver la decisión documentada en 0003.
-- -----------------------------------------------------------------------------
create table if not exists public.anonymous_messages (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid not null references public.groups (id)        on delete cascade,
  from_member_id uuid not null references public.group_members (id) on delete cascade,
  to_member_id   uuid not null references public.group_members (id) on delete cascade,
  body           text not null check (length(btrim(body)) between 1 and 1000),
  created_at     timestamptz not null default now(),
  constraint anonymous_messages_not_self check (from_member_id <> to_member_id)
);

comment on table public.anonymous_messages is
  'Mensajes anónimos. El receptor los lee vía public.get_my_anonymous_messages(); la tabla base le niega SELECT para no filtrar from_member_id.';

create index if not exists anonymous_messages_to_idx   on public.anonymous_messages (group_id, to_member_id, created_at desc);
create index if not exists anonymous_messages_from_idx on public.anonymous_messages (group_id, from_member_id, created_at desc);
