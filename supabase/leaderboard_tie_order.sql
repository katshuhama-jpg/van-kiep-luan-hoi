-- Bảng xếp hạng: hai người bằng điểm thì ai đạt trước đứng trên (thay cho tạm xếp theo tuổi ở máy người chơi).
-- Chạy một lần trong Supabase > SQL Editor > Run. Chỉ thay thân hàm vkl_leaderboard(text,text,text,text), không đụng dữ liệu.
CREATE OR REPLACE FUNCTION public.vkl_leaderboard(p_kind text, p_lean text DEFAULT 'all'::text, p_path text DEFAULT 'all'::text, p_scope text DEFAULT 'all'::text)
 RETURNS TABLE(username text, c jsonb, alive boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with wk as (select (date_trunc('week', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh') as t0),
  live as (
    select p.username,
      ((s.state->'char') - 'log'::text - 'seenEvents'::text - 'pills'::text - 'inventory'::text - 'evCount'::text - 'kills'::text) as ch,
      true as alive, s.updated_at as at
    from public.vkl_saves s
    join public.vkl_players p on p.id = s.player_id
    where jsonb_typeof(s.state) = 'object'
      and jsonb_typeof(s.state->'char') = 'object'
      and coalesce((s.state->'char'->>'dead')::boolean, false) = false
  ),
  dead as (
    select l.player_name as username,
      coalesce(l.look, '{}'::jsonb) || jsonb_build_object(
        'name', l.char_name, 'age', l.age,
        'lifespan', greatest(l.age, coalesce((l.look->>'lifespan')::int, l.age)),
        'realm', coalesce(l.realm_no, case
          when l.realm like 'Độ Kiếp%' then 7 when l.realm like 'Luyện Hư%' then 6 when l.realm like 'Hóa Thần%' then 5
          when l.realm like 'Nguyên Anh%' then 4 when l.realm like 'Kim Đan%' then 3 when l.realm like 'Trúc Cơ%' then 2
          when l.realm like 'Luyện Khí%' then 1 else 0 end),
        'layer', coalesce(l.layer_no, 1), 'linhThach', l.wealth, 'daoTam', l.dao_tam, 'lifeNo', l.life_no,
        'dead', true, 'ascended', l.ascended, 'cause', l.cause
      ) as ch,
      false as alive, l.created_at as at
    from public.vkl_lives l
    where coalesce((l.look->>'unranked')::boolean, false) = false
  ),
  allrows as (
    select username, ch, alive, at from live, wk where p_scope in ('all', 'alive') or (p_scope = 'week' and live.at >= wk.t0)
    union all
    select username, ch, alive, at from dead, wk where p_scope in ('all', 'dead') or (p_scope = 'week' and dead.at >= wk.t0)
  )
  -- rankAt: lúc đạt, để máy người chơi giữ đúng thứ tự khi bằng điểm
  select username, ch || jsonb_build_object('rankAt', at) as c, alive
  from allrows
  where (p_lean = 'all'
         or (p_lean = 'chinh' and (ch->>'daoTam')::int >= 20)
         or (p_lean = 'ta' and (ch->>'daoTam')::int <= -20)
         or (p_lean = 'trung' and (ch->>'daoTam')::int between -19 and 19))
    and (p_path = 'all' or coalesce(ch->>'path', 'none') = p_path)
  order by
    case when p_kind = 'wealth' then (ch->>'linhThach')::numeric end desc nulls last,
    case when p_kind = 'age' then floor((ch->>'age')::numeric) end desc nulls last,
    case when p_kind not in ('wealth', 'age') then coalesce((ch->>'ascended')::boolean, false)::int end desc nulls last,
    case when p_kind <> 'wealth' then (ch->>'realm')::int end desc nulls last,
    case when p_kind <> 'wealth' then (ch->>'layer')::int end desc nulls last,
    case when p_kind <> 'wealth' then coalesce((ch->>'cultivation')::numeric, 0) end desc nulls last,
    -- bằng điểm: ai đạt trước đứng trên, để thứ hạng cố định
    at asc, username asc, ch->>'name' asc
  limit 60;
$function$;
