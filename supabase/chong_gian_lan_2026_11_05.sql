-- 5/11: chống gian lận (Tyler chốt "làm cả 3"). Chỉ thêm bảng, hàm, trigger mới; không sửa hàm cũ.
-- 1) Số vô lý (tiền vượt trần theo cảnh giới, số kiếp quá lớn): kiếp ghi lên bị gắn unranked + suspect, không lên bảng xếp hạng.
-- 2) Danh sách ẩn khỏi bảng xếp hạng (không xóa dữ liệu, gỡ được).
create table if not exists vkl_priv.lb_hidden (username text primary key, note text, created_at timestamptz default now());
insert into vkl_priv.lb_hidden (username, note) values
  ('datphamyt', 'kiếp 2 có 39 triệu linh thạch'),
  ('thiende009', 'số kiếp 1.000.000+'),
  ('quocdung', 'nhiều kiếp Phàm nhân tới Hóa Thần có khoảng 1 triệu linh thạch')
on conflict do nothing;

create or replace function vkl_priv.sane_char(ch jsonb) returns boolean
language sql immutable set search_path to '' as $$
  select coalesce((ch->>'linhThach')::numeric, 0) <= (array[50000,50000,80000,120000,200000,500000,500000,1000000,1500000,1500000,6000000,10000000])[least(12, greatest(1, coalesce((ch->>'realm')::int, 0) + 1))]
     and coalesce((ch->>'lifeNo')::numeric, 1) <= 2000
$$;

create or replace function vkl_priv.lives_guard() returns trigger
language plpgsql security definer set search_path to '' as $$
begin
  if not vkl_priv.sane_char(jsonb_build_object('linhThach', new.wealth, 'realm', new.realm_no, 'lifeNo', new.life_no))
     or exists (select 1 from vkl_priv.lb_hidden h where h.username = new.player_name) then
    new.look := coalesce(new.look, '{}'::jsonb) || '{"unranked": true, "suspect": true}'::jsonb;
  end if;
  return new;
end $$;
drop trigger if exists vkl_lives_guard on public.vkl_lives;
create trigger vkl_lives_guard before insert on public.vkl_lives for each row execute function vkl_priv.lives_guard();

-- Bảng xếp hạng mới: như vkl_leaderboard nhưng bỏ người trong danh sách ẩn và số vô lý (bản đang chơi cũng lọc)
create or replace function public.vkl_leaderboard2(p_kind text, p_lean text default 'all', p_path text default 'all', p_scope text default 'all')
returns table(username text, c jsonb, alive boolean)
language sql stable security definer set search_path to '' as $$
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
    select username, ch, alive from live, wk where p_scope in ('all', 'alive') or (p_scope = 'week' and live.at >= wk.t0)
    union all
    select username, ch, alive from dead, wk where p_scope in ('all', 'dead') or (p_scope = 'week' and dead.at >= wk.t0)
  )
  select username, ch as c, alive
  from allrows
  where vkl_priv.sane_char(ch)
    and not exists (select 1 from vkl_priv.lb_hidden h where h.username = allrows.username)
    and (p_lean = 'all'
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
    case when p_kind <> 'wealth' then coalesce((ch->>'cultivation')::numeric, 0) end desc nulls last
  limit 60;
$$;
grant execute on function public.vkl_leaderboard2(text, text, text, text) to anon, authenticated;

-- 3) Lôi đài, chiến thư tính trận trên máy chủ (app/api/loi-dai). Khóa bí mật nằm ở vkl_priv.srv_secret và biến VKL_SRV_SECRET trên Vercel.
create table if not exists vkl_priv.srv_secret (k text primary key, created_at timestamptz default now());
revoke all on vkl_priv.srv_secret from anon, authenticated;
create or replace function public.vkl_arena_fight_srv(p_secret text, p_token uuid, p_opp text, p_win boolean, p_detail text, p_revenge bigint, p_hp integer, p_swords integer)
returns jsonb language plpgsql security definer set search_path to '' as $$
begin
  if p_secret is null or not exists (select 1 from vkl_priv.srv_secret s where s.k = p_secret) then raise exception 'FORBIDDEN'; end if;
  perform set_config('vkl.srv', '1', true);
  return public.vkl_arena_fight3(p_token, p_opp, p_win, p_detail, p_revenge, p_hp, p_swords);
end $$;
create or replace function public.vkl_thach_fight_srv(p_secret text, p_token uuid, p_opp text, p_life_id bigint, p_win boolean, p_hp integer, p_swords integer, p_detail text)
returns jsonb language plpgsql security definer set search_path to '' as $$
begin
  if p_secret is null or not exists (select 1 from vkl_priv.srv_secret s where s.k = p_secret) then raise exception 'FORBIDDEN'; end if;
  perform set_config('vkl.srv', '1', true);
  return public.vkl_thach_fight(p_token, p_opp, p_life_id, p_win, p_hp, p_swords, p_detail);
end $$;
create or replace function vkl_priv.srv_only() returns trigger language plpgsql set search_path to '' as $$
begin
  if coalesce(current_setting('vkl.srv', true), '') <> '1' then raise exception 'USE_SERVER'; end if;
  return new;
end $$;
-- BẬT SAU khi VKL_SRV_SECRET đã có trên Vercel và bản mới đã lên (chặn hẳn đường ghi cũ vkl_arena_fight3, vkl_thach_fight gọi thẳng):
-- create trigger vkl_arena_log_srv before insert on public.vkl_arena_log for each row execute function vkl_priv.srv_only();
-- create trigger vkl_thach_srv before insert on public.vkl_thach for each row execute function vkl_priv.srv_only();
