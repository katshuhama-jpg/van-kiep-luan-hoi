-- Lôi đài: đổi bóng xuất chiến qua lại giữa các kiếp (1/11/2026, lên bản sáng 2/11).
-- Hàm mới, không sửa vkl_arena_pick / vkl_arena_candidates cũ.
-- vkl_arena_candidates2: tối đa 12 kiếp mạnh nhất (gồm nhân vật đang sống).
-- vkl_arena_pick2: đổi bóng bất cứ lúc nào, trừ khi đang có trận đã rút đối thủ mà chưa đánh (pending), để không đổi bóng sau khi biết đối thủ.

create or replace function public.vkl_arena_candidates2(p_token uuid)
returns jsonb language plpgsql security definer set search_path to '' as $function$
declare v_me text := vkl_priv.me(p_token);
begin
  if v_me is null then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(c order by realm desc, layer desc) from (
    select x.c, x.realm, x.layer from (
      select ((s.state->'char') - 'log'::text - 'seenEvents'::text - 'evCount'::text - 'miles'::text - 'mileSnap'::text - 'inventory'::text) || jsonb_build_object('alive', true, 'lifeId', 0) as c,
        coalesce((s.state->'char'->>'realm')::int, 0) as realm, coalesce((s.state->'char'->>'layer')::int, 1) as layer
      from public.vkl_saves s join public.vkl_players p on p.id = s.player_id
      where p.username = v_me and jsonb_typeof(s.state) = 'object' and jsonb_typeof(s.state->'char') = 'object'
        and coalesce((s.state->'char'->>'dead')::boolean, false) = false
      union all
      select vkl_priv.life_shadow(l), coalesce(l.realm_no, 0), coalesce(l.layer_no, 1) from public.vkl_lives l where l.player_name = v_me
    ) x order by x.realm desc, x.layer desc limit 12) t), '[]'::jsonb);
end; $function$;

create or replace function public.vkl_arena_pick2(p_token uuid, p_life_id bigint)
returns jsonb language plpgsql security definer set search_path to '' as $function$
declare v_me text := vkl_priv.me(p_token); v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date; v_c jsonb; r public.vkl_arena%rowtype;
begin
  if v_me is null then raise exception 'NOT_LOGGED_IN'; end if;
  insert into public.vkl_arena (username) values (v_me) on conflict (username) do nothing;
  select * into r from public.vkl_arena where username = v_me for update;
  if r.pending is not null and r.day = v_today then return jsonb_build_object('error', 'PENDING', 'champ', r.champ); end if;
  if p_life_id = 0 then
    select ((s.state->'char') - 'log'::text - 'seenEvents'::text - 'evCount'::text - 'miles'::text - 'mileSnap'::text - 'inventory'::text) || jsonb_build_object('alive', true, 'lifeId', 0)
      into v_c from public.vkl_saves s join public.vkl_players p on p.id = s.player_id
      where p.username = v_me and jsonb_typeof(s.state->'char') = 'object' and coalesce((s.state->'char'->>'dead')::boolean, false) = false;
  else
    select vkl_priv.life_shadow(l) into v_c from public.vkl_lives l where l.id = p_life_id and l.player_name = v_me;
  end if;
  if v_c is null then return jsonb_build_object('error', 'NO_LIFE'); end if;
  update public.vkl_arena set champ = v_c, champ_day = v_today where username = v_me;
  return jsonb_build_object('champ', v_c);
end; $function$;
