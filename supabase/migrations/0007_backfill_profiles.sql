-- =============================================================================
-- Dádiva — 0007: rellenar perfiles de usuarios anteriores al trigger
-- =============================================================================
-- El trigger `handle_new_user` solo dispara en INSERT sobre auth.users. Quien
-- ya se había autenticado antes de que el esquema existiera se quedó sin fila
-- en `profiles`, y la app lo mandaba a completar su perfil… contra una fila
-- inexistente.
--
-- Pasó en producción con el primer usuario real. Esta migración lo alcanza y
-- deja el estado consistente. Es idempotente: se puede correr las veces que sea.
-- =============================================================================

insert into public.profiles (id, display_name, avatar_emoji)
select
  u.id,
  coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Amigo'
  ),
  coalesce(nullif(btrim(u.raw_user_meta_data ->> 'avatar_emoji'), ''), '🎁')
from auth.users u
on conflict (id) do nothing;
