-- 14/11/2026 NHÁP, CHƯA CHẠY trên Supabase. Tyler duyệt rồi mới chạy (xem docs/tang-truong.md, đêm 13/11, mục "Bảng xếp hạng chậm").
-- Vì sao vkl_leaderboard2 chậm: mỗi lần gọi, hàm dựng lại jsonb cho TOÀN BỘ vkl_lives (~27.000 kiếp, look ~1,7KB mỗi kiếp)
-- và mọi bản lưu đang sống (đọc cả state rất lớn), chạy sane_char từng dòng, rồi sắp xếp theo biểu thức jsonb. Không chỉ mục
-- nào giúp được vì cả cột sắp xếp lẫn điều kiện lọc đều nằm trong jsonb vừa dựng. Thử trên Postgres 16 cục bộ với 30.000 kiếp
-- và 3.000 bản lưu: 1,0-1,6 giây mỗi lần gọi (máy Supabase nhỏ chậm hơn nhiều, đúng như ~4 giây đo được 13/11).
--
-- Cách sửa: bảng tính sẵn vkl_priv.lb_row (cột kiểu số, có chỉ mục), làm mới tăng dần mỗi 2 phút bằng pg_cron
-- (chỉ kiếp mới theo id và bản lưu đổi theo updated_at), và hàm đọc MỚI public.vkl_leaderboard3 cùng chữ ký, cùng thứ tự.
-- Không sửa và không cấp lại quyền vkl_leaderboard / vkl_leaderboard2. Không thêm trigger vào đường ghi kiếp hay lưu game.
-- Chạy được nhiều lần.

create table if not exists vkl_priv.lb_row (
  src text not null,               -- 'l' kiếp đã khép (vkl_lives.id), 's' bản lưu đang sống (player_id)
  key text not null,
  username text not null,
  alive boolean not null,
  at timestamptz not null,
  asc_no int not null,             -- 1 nếu đã phi thăng
  realm int not null,
  layer int not null,
  cult numeric not null,
  age_n numeric not null,
  wealth numeric not null,
  dao int not null,
  path text not null,
  ch jsonb not null,               -- đúng dạng cột c của vkl_leaderboard2 (đã bỏ log, seenEvents, pills, inventory, evCount, kills)
  primary key (src, key)
);
create index if not exists lb_row_power on vkl_priv.lb_row (asc_no desc, realm desc, layer desc, cult desc);
create index if not exists lb_row_wealth on vkl_priv.lb_row (wealth desc);
create index if not exists lb_row_age on vkl_priv.lb_row (age_n desc, asc_no desc, realm desc, layer desc, cult desc);
create index if not exists lb_row_at on vkl_priv.lb_row (at);
revoke all on vkl_priv.lb_row from public, anon, authenticated;

create table if not exists vkl_priv.lb_mark (k text primary key, last_id bigint not null default 0, last_at timestamptz not null default 'epoch');
insert into vkl_priv.lb_mark (k) values ('lb') on conflict do nothing;

-- dựng một dòng từ jsonb nhân vật (cùng công thức với vkl_leaderboard2)
create or replace function vkl_priv.lb_cols(ch jsonb)
returns table(asc_no int, realm int, layer int, cult numeric, age_n numeric, wealth numeric, dao int, path text)
language sql immutable set search_path to '' as $$
  select coalesce((ch->>'ascended')::boolean, false)::int,
         coalesce((ch->>'realm')::int, 0), coalesce((ch->>'layer')::int, 0),
         coalesce((ch->>'cultivation')::numeric, 0), floor(coalesce((ch->>'age')::numeric, 0)),
         coalesce((ch->>'linhThach')::numeric, 0), coalesce((ch->>'daoTam')::int, 0), coalesce(ch->>'path', 'none')
$$;

-- làm mới tăng dần; p_full = true thì dựng lại từ đầu (lần đầu, hoặc khi nghi lệch)
create or replace function vkl_priv.lb_refresh(p_full boolean default false)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare m record; n_l int := 0; n_s int := 0; n_d int := 0; t0 timestamptz := clock_timestamp(); max_id bigint;
begin
  perform set_config('statement_timeout', '120s', true);
  if p_full then
    delete from vkl_priv.lb_row;
    update vkl_priv.lb_mark set last_id = 0, last_at = 'epoch' where k = 'lb';
  end if;
  select * into m from vkl_priv.lb_mark where k = 'lb' for update;
  select coalesce(max(id), 0) into max_id from public.vkl_lives;

  -- 1) kiếp mới khép
  with d as (
    select l.id, l.player_name as username, l.created_at as at,
      coalesce(l.look, '{}'::jsonb) || jsonb_build_object(
        'name', l.char_name, 'age', l.age,
        'lifespan', greatest(l.age, coalesce((l.look->>'lifespan')::int, l.age)),
        'realm', coalesce(l.realm_no, case
          when l.realm like 'Độ Kiếp%' then 7 when l.realm like 'Luyện Hư%' then 6 when l.realm like 'Hóa Thần%' then 5
          when l.realm like 'Nguyên Anh%' then 4 when l.realm like 'Kim Đan%' then 3 when l.realm like 'Trúc Cơ%' then 2
          when l.realm like 'Luyện Khí%' then 1 else 0 end),
        'layer', coalesce(l.layer_no, 1), 'linhThach', l.wealth, 'daoTam', l.dao_tam, 'lifeNo', l.life_no,
        'dead', true, 'ascended', l.ascended, 'cause', l.cause) as ch
    from public.vkl_lives l
    where l.id > m.last_id and l.id <= max_id
      and coalesce((l.look->>'unranked')::boolean, false) = false
  )
  insert into vkl_priv.lb_row (src, key, username, alive, at, asc_no, realm, layer, cult, age_n, wealth, dao, path, ch)
  select 'l', d.id::text, d.username, false, d.at, c.*, d.ch
  from d, lateral vkl_priv.lb_cols(d.ch) c
  where vkl_priv.sane_char(d.ch)
  on conflict (src, key) do nothing;
  get diagnostics n_l = row_count;

  -- 2) bản lưu đổi từ lần trước: sống thì ghi đè, chết hoặc số vô lý thì bỏ
  with s as (
    select p.username, s.player_id, s.updated_at as at,
      ((s.state->'char') - 'log'::text - 'seenEvents'::text - 'pills'::text - 'inventory'::text - 'evCount'::text - 'kills'::text) as ch,
      jsonb_typeof(s.state) = 'object' and jsonb_typeof(s.state->'char') = 'object'
        and coalesce((s.state->'char'->>'dead')::boolean, false) = false as live
    from public.vkl_saves s join public.vkl_players p on p.id = s.player_id
    where s.updated_at > m.last_at
  ),
  del as (
    delete from vkl_priv.lb_row r using s
    where r.src = 's' and r.key = s.player_id::text and (not s.live or not vkl_priv.sane_char(s.ch))
    returning 1
  ),
  up as (
    insert into vkl_priv.lb_row (src, key, username, alive, at, asc_no, realm, layer, cult, age_n, wealth, dao, path, ch)
    select 's', s.player_id::text, s.username, true, s.at, c.*, s.ch
    from s, lateral vkl_priv.lb_cols(s.ch) c
    where s.live and vkl_priv.sane_char(s.ch)
    on conflict (src, key) do update set username = excluded.username, at = excluded.at, asc_no = excluded.asc_no,
      realm = excluded.realm, layer = excluded.layer, cult = excluded.cult, age_n = excluded.age_n, wealth = excluded.wealth,
      dao = excluded.dao, path = excluded.path, ch = excluded.ch
    returning 1
  )
  select (select count(*) from up), (select count(*) from del) into n_s, n_d;

  -- 3) bản lưu đã bị xóa hẳn
  delete from vkl_priv.lb_row r where r.src = 's' and not exists (select 1 from public.vkl_saves s where s.player_id::text = r.key);

  update vkl_priv.lb_mark set last_id = max_id,
    last_at = coalesce((select max(updated_at) from public.vkl_saves where updated_at > m.last_at), m.last_at)
  where k = 'lb';
  return jsonb_build_object('lives', n_l, 'saves', n_s, 'dropped', n_d, 'ms', round(extract(epoch from clock_timestamp() - t0) * 1000));
end $$;
revoke all on function vkl_priv.lb_refresh(boolean) from public, anon, authenticated;

-- hàm đọc MỚI, cùng chữ ký và cùng thứ tự với vkl_leaderboard2
create or replace function public.vkl_leaderboard3(p_kind text, p_lean text default 'all', p_path text default 'all', p_scope text default 'all')
returns table(username text, c jsonb, alive boolean)
language sql stable security definer set search_path to '' as $$
  with wk as (select (date_trunc('week', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh') as t0)
  select r.username, r.ch, r.alive
  from vkl_priv.lb_row r, wk
  where (p_scope = 'all' or (p_scope = 'alive' and r.alive) or (p_scope = 'dead' and not r.alive) or (p_scope = 'week' and r.at >= wk.t0))
    and (p_lean = 'all' or (p_lean = 'chinh' and r.dao >= 20) or (p_lean = 'ta' and r.dao <= -20) or (p_lean = 'trung' and r.dao between -19 and 19))
    and (p_path = 'all' or r.path = p_path)
  order by
    case when p_kind = 'wealth' then r.wealth end desc nulls last,
    case when p_kind = 'age' then r.age_n end desc nulls last,
    case when p_kind not in ('wealth', 'age') then r.asc_no end desc nulls last,
    case when p_kind <> 'wealth' then r.realm end desc nulls last,
    case when p_kind <> 'wealth' then r.layer end desc nulls last,
    case when p_kind <> 'wealth' then r.cult end desc nulls last
  limit 60;
$$;
grant execute on function public.vkl_leaderboard3(text, text, text, text) to anon, authenticated;

-- dựng lần đầu, rồi làm mới mỗi 2 phút (Vercel giữ kết quả 2 phút nên bảng chậm tối đa ~4 phút, đủ cho bảng xếp hạng)
select vkl_priv.lb_refresh(true);
-- create extension if not exists pg_cron;  -- bật nếu chưa có (Ngày 4 của 4.6.0 cũng cần)
-- select cron.schedule('vkl_lb_refresh', '*/2 * * * *', $c$select vkl_priv.lb_refresh()$c$);
