-- 19/11 (Phan Anh Tuấn, Tyler duyệt): danh sách bóng chỉ lấy 12 kiếp cảnh giới cao nhất nên kiếp mạnh nhất có thể rơi mất;
-- sang ngày mới lôi đài tự lấy kiếp cảnh giới cao nhất chứ không giữ bóng hôm qua.
-- (1) candidates2 lấy 40 kiếp cảnh giới cao nhất và luôn kèm kiếp ra đài gần nhất; client xếp theo sức mạnh, hiện 12 (rankCands).
-- (2) state2 trả thêm me.lastLife (kiếp ra đài gần nhất, kể cả hôm trước) để sang ngày mới giữ bóng cũ.
create or replace function public.vkl_arena_candidates2(p_token uuid)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare v_me text := vkl_priv.me(p_token); v_last bigint;
begin
  if v_me is null then return '[]'::jsonb; end if;
  select nullif((a.champ->>'lifeId')::bigint, 0) into v_last from public.vkl_arena a where a.username = v_me;
  return coalesce((select jsonb_agg(c order by realm desc, layer desc) from (
    select ((s.state->'char') - 'log'::text - 'seenEvents'::text - 'evCount'::text - 'miles'::text - 'mileSnap'::text - 'inventory'::text) || jsonb_build_object('alive', true, 'lifeId', 0) as c,
      coalesce((s.state->'char'->>'realm')::int, 0) as realm, coalesce((s.state->'char'->>'layer')::int, 1) as layer
    from public.vkl_saves s join public.vkl_players p on p.id = s.player_id
    where p.username = v_me and jsonb_typeof(s.state) = 'object' and jsonb_typeof(s.state->'char') = 'object'
      and coalesce((s.state->'char'->>'dead')::boolean, false) = false
    union all
    select vkl_priv.life_shadow(l), coalesce(l.realm_no, 0), coalesce(l.layer_no, 1) from public.vkl_lives l
     where l.player_name = v_me
       and (l.id in (select id from public.vkl_lives where player_name = v_me order by realm_no desc nulls last, layer_no desc nulls last limit 40)
            or l.id = v_last)
  ) t), '[]'::jsonb);
end; $function$;

do $$ declare d text; begin
  d := pg_get_functiondef('public.vkl_arena_state2(uuid)'::regprocedure);
  if position('lastLife' in d) = 0 then
    d := replace(d, '''champ'', case when r.champ_day = v_today', '''lastLife'', (r.champ->>''lifeId'')::bigint, ''champ'', case when r.champ_day = v_today');
    if position('lastLife' in d) = 0 then raise exception 'state2: không tìm thấy chỗ chèn lastLife'; end if;
    execute d;
  end if;
end $$;
