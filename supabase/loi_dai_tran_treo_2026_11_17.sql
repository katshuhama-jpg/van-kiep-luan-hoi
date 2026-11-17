-- 17/11 (Hoang Le báo "không đánh được lôi đài"): trận đã rút đối thủ từ ngày cũ bị treo mãi.
-- Nguyên nhân: vkl_arena_state2 reset lượt khi sang ngày mới nhưng không xóa `pending`. Ngày đã thành hôm nay
-- nên vkl_arena_draw không reset nữa và cứ trả lại đúng đối thủ cũ; vkl_arena_pick2 báo PENDING và trả bóng
-- của ngày cũ; còn /api/loi-dai đọc bóng qua state2 thì thấy champ_day khác hôm nay nên không có bóng
-- (NO_SHADOW) -> "Máy chủ chưa ghi được trận này". 22 tài khoản kẹt, có người kẹt từ 2/11.
-- Sửa: (1) state2 xóa trận treo khi sang ngày mới, giống vkl_arena_draw; (2) pick2 coi trận treo của bóng
-- ngày cũ là đã hết, cho chọn bóng mới; (3) đền bù 100 phúc duyên + thư tạ lỗi cho người bị kẹt rồi gỡ trận treo.

create or replace function public.vkl_arena_state2(p_token uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare v_me text := vkl_priv.me(p_token); v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date; r public.vkl_arena%rowtype;
begin
  perform vkl_priv.arena_roll();
  if v_me is not null then
    insert into public.vkl_arena (username, day) values (v_me, v_today) on conflict (username) do nothing;
    -- 17/11: sang ngày mới thì trận đã rút hôm trước cũng hết (như vkl_arena_draw)
    update public.vkl_arena set day = v_today, used = 0, met = '{}', pending = null where username = v_me and (day is null or day <> v_today);
    -- 17/11: trận treo mà bóng đã hết hạn thì không đánh được nữa, gỡ ra
    update public.vkl_arena set pending = null where username = v_me and pending is not null and champ_day is distinct from v_today;
    select * into r from public.vkl_arena where username = v_me;
  end if;
  return jsonb_build_object(
    'me', case when v_me is null then null else jsonb_build_object('username', v_me, 'pts', r.pts, 'used', r.used, 'wins', r.wins, 'losses', r.losses,
      'winRun', r.win_run, 'champ', case when r.champ_day = v_today then r.champ else null end) end,
    'opps', case when v_me is null or r.used >= 3 then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object('username', x.username, 'pts', x.pts)) from (
        select p.username, coalesce(a.pts, 0) as pts
        from public.vkl_players p left join public.vkl_arena a on a.username = p.username
        where p.username <> v_me and p.username !~ '^(test|ui)_' and not (p.username = any(r.met))
          and exists (select 1 from public.vkl_lives l where l.player_name = p.username)
        order by random() limit 3) x), '[]'::jsonb) end,
    'revenge', case when v_me is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'target', target, 'at', created_at) order by created_at desc)
      from public.vkl_arena_revenge where owner = v_me and not used and created_at > now() - interval '48 hours'), '[]'::jsonb) end,
    'top', coalesce((select jsonb_agg(jsonb_build_object('username', username, 'pts', pts, 'wins', wins, 'losses', losses, 'winRun', win_run) order by pts desc, wins desc, updated_at)
      from (select * from public.vkl_arena where pts > 0 and username !~ '^(test|ui)_' order by pts desc, wins desc, updated_at limit 20) t), '[]'::jsonb),
    'champs', coalesce((select jsonb_agg(jsonb_build_object('week', week, 'rank', rank, 'username', username, 'pts', elo) order by rank)
      from public.vkl_arena_champ where week = (select max(week) from public.vkl_arena_champ)), '[]'::jsonb)
  );
end; $function$;

create or replace function public.vkl_arena_pick2(p_token uuid, p_life_id bigint)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare v_me text := vkl_priv.me(p_token); v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date; v_c jsonb; r public.vkl_arena%rowtype;
begin
  if v_me is null then raise exception 'NOT_LOGGED_IN'; end if;
  insert into public.vkl_arena (username) values (v_me) on conflict (username) do nothing;
  select * into r from public.vkl_arena where username = v_me for update;
  -- 17/11: trận treo với bóng của ngày cũ thì không đánh được nữa, gỡ ra để chọn bóng mới
  if r.pending is not null and r.champ_day is distinct from v_today then
    update public.vkl_arena set pending = null where username = v_me;
    r.pending := null;
  end if;
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

-- Đền bù (Tyler chốt 17/11): 100 phúc duyên + thư tạ lỗi cho mọi tài khoản đang kẹt trận treo, rồi gỡ trận treo
with aff as (
  select username from public.vkl_arena
  where pending is not null and champ_day is distinct from (now() at time zone 'Asia/Ho_Chi_Minh')::date
    and username !~ '^(test|ui)_'
),
g as (
  insert into public.vkl_gift (to_player, kind, amount, note)
  select username, 'phuc', 100, 'Thiên Đạo đền bù: lôi đài kẹt một trận cũ nên đạo hữu không ghi được trận, nay đã sửa'
  from aff returning id
),
m as (
  insert into public.vkl_mail (to_player, from_player, kind, body)
  select username, null, 'thien_dao',
    'Thiên Đạo tạ lỗi: lôi đài giữ lại một trận đã rút từ hôm trước nên đạo hữu ra đài mãi vẫn gặp đúng người cũ, đánh xong không ghi được. Lỗi đã sửa, gửi kèm 100 phúc duyên đền bù. Tải lại trang để nhận rồi ra đài như thường nhé.'
  from aff returning id
),
u as (
  update public.vkl_arena a set pending = null from aff where a.username = aff.username returning a.username
)
select (select count(*) from g) qua, (select count(*) from m) thu, (select count(*) from u) go_tran_treo;
