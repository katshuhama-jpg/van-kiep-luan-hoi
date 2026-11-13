-- 4.6.0 Sơn Môn Tranh Bá, Ngày 1 (lên bản 14/11/2026, giấu sau cờ SON_MON_ON).
-- Chỉ thêm bảng, hàm, trigger MỚI; không sửa hàm cũ. Áp SAU supabase/son_mon_cfg_*.sql (hàm vkl_priv.sm_cfg).
-- Mọi bảng bật RLS và không có policy: trình duyệt chỉ đọc ghi qua hàm vkl_phu_* (kiểm tra ở máy chủ).
-- Tài nguyên tính lười: mỗi lần đọc hay ra lệnh thì vkl_priv.sm_settle cộng sản lượng từ last_at tới giờ,
-- áp các việc trong hàng chờ đã xong theo đúng thứ tự thời gian (công trình xong giữa chừng thì sản lượng đổi từ lúc đó).

create schema if not exists vkl_priv;

-- ---------- Bảng ----------
create table if not exists public.vkl_ky (
  id serial primary key,
  ten text not null,
  bat_dau timestamptz not null,
  ket_thuc timestamptz not null,
  size int not null check (size between 11 and 81 and size % 2 = 1),
  dai_mo timestamptz,            -- mốc Thiên Đạo Đài mở (Ngày 6)
  khai_thien text,               -- tên sơn môn Khai Thiên Lập Địa (Ngày 7)
  created_at timestamptz not null default now()
);

create table if not exists public.vkl_tile (
  ky_id int not null references public.vkl_ky (id) on delete cascade,
  x int not null,
  y int not null,
  loai text not null check (loai in ('trong', 'phu', 'yeu_dong', 'phuc_dia', 'dai', 'thanh_dia')),
  khu text not null check (khu in ('thien', 'hong_tran', 'u_minh', 'tam')),
  vong text not null check (vong in ('gan', 'giua', 'ria', 'tam')),
  phu_id bigint,                 -- động phủ đứng trên ô (loai = phu) hoặc động phủ đang giữ phúc địa
  cap int not null default 0,    -- cấp yêu động / phúc địa / tầng Đài
  bonus text check (bonus in ('ls', 'lt', 'kt')),
  npc jsonb,                     -- quân NPC giữ ô và của cải yêu động
  quy_thuan int not null default 100,
  primary key (ky_id, x, y)
);
create index if not exists vkl_tile_free on public.vkl_tile (ky_id, khu, vong) where loai = 'trong';
create index if not exists vkl_tile_phu on public.vkl_tile (phu_id) where phu_id is not null;

create table if not exists public.vkl_phu (
  id bigserial primary key,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  ky_id int not null references public.vkl_ky (id) on delete cascade,
  x int not null,
  y int not null,
  gioi text not null check (gioi in ('thien', 'hong_tran', 'u_minh')),
  ls numeric(14, 2) not null default 0,
  lt numeric(14, 2) not null default 0,
  kt numeric(14, 2) not null default 0,
  lk numeric(14, 2) not null default 0,
  last_at timestamptz not null default now(),
  bao_ho_den timestamptz,
  be_quan_tu timestamptz,
  be_quan_den timestamptz,
  be_quan_dung int not null default 0,   -- số giây bế quan đã dùng trong Kỷ
  nc_cong int not null default 0,
  nc_thu int not null default 0,
  nc_toc int not null default 0,
  hero_nghi_den timestamptz,
  diem int not null default 0,
  quy_thuan int not null default 100,
  created_at timestamptz not null default now(),
  unique (player_id, ky_id),
  unique (ky_id, x, y)
);

create table if not exists public.vkl_phu_building (
  phu_id bigint not null references public.vkl_phu (id) on delete cascade,
  kind text not null,
  level int not null default 0 check (level between 0 and 20),
  primary key (phu_id, kind)
);

create table if not exists public.vkl_phu_queue (
  id bigserial primary key,
  phu_id bigint not null references public.vkl_phu (id) on delete cascade,
  loai text not null check (loai in ('xay', 'luyen', 'nghien_cuu')),
  kind text not null,            -- công trình, đệ tử, hoặc nhánh nghiên cứu
  level int,                     -- cấp sẽ lên (xay, nghien_cuu)
  n int,                         -- số đệ tử (luyen)
  start_at timestamptz not null default now(),
  done_at timestamptz not null
);
create index if not exists vkl_phu_queue_due on public.vkl_phu_queue (phu_id, done_at);

-- quân đóng ở động phủ phu_id, thuộc động phủ chu_phu (khác nhau khi là viện binh)
create table if not exists public.vkl_phu_troop (
  phu_id bigint not null references public.vkl_phu (id) on delete cascade,
  chu_phu bigint not null references public.vkl_phu (id) on delete cascade,
  unit text not null,
  n int not null default 0 check (n >= 0),
  primary key (phu_id, chu_phu, unit)
);

create table if not exists public.vkl_march (
  id bigserial primary key,
  ky_id int not null references public.vkl_ky (id) on delete cascade,
  from_phu bigint not null references public.vkl_phu (id) on delete cascade,
  to_x int not null,
  to_y int not null,
  to_phu bigint,
  kieu text not null check (kieu in ('cuop', 'cong_pha', 'trinh_sat', 'chieu_hang', 'vien_binh')),
  army jsonb not null,
  hero boolean not null default false,
  muc_tieu text,                 -- công trình nhắm khi công phá
  start_at timestamptz not null default now(),
  arrive_at timestamptz not null,
  back_at timestamptz,
  state text not null default 'di' check (state in ('di', 've', 'dong', 'xong')),
  loot jsonb,
  created_at timestamptz not null default now()
);
create index if not exists vkl_march_arrive on public.vkl_march (arrive_at) where state = 'di';
create index if not exists vkl_march_back on public.vkl_march (back_at) where state = 've';
create index if not exists vkl_march_to on public.vkl_march (ky_id, to_x, to_y) where state = 'di';
create index if not exists vkl_march_from on public.vkl_march (from_phu) where state in ('di', 've', 'dong');

create table if not exists public.vkl_report (
  id bigserial primary key,
  ky_id int not null references public.vkl_ky (id) on delete cascade,
  phu_id bigint not null references public.vkl_phu (id) on delete cascade,
  march_id bigint,
  kieu text not null,
  ket_qua jsonb not null,
  doc boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists vkl_report_phu on public.vkl_report (phu_id, created_at desc);

create table if not exists public.vkl_mon (
  id bigserial primary key,
  ky_id int not null references public.vkl_ky (id) on delete cascade,
  ten text not null,
  chu uuid not null references public.vkl_players (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (ky_id, ten)
);

create table if not exists public.vkl_mon_member (
  mon_id bigint not null references public.vkl_mon (id) on delete cascade,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  ky_id int not null references public.vkl_ky (id) on delete cascade,
  vai text not null default 'de_tu' check (vai in ('chuong_mon', 'truong_lao', 'de_tu')),
  su_phu uuid,                   -- Sư Đồ (Ngày 5)
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (mon_id, player_id, joined_at)
);
create index if not exists vkl_mon_member_p on public.vkl_mon_member (player_id, ky_id) where left_at is null;

-- linh khí từ kiếp: mỗi kiếp một dòng (kể cả khi chạm trần: amount = 0), để Tyler xem tay ai chạm trần nhiều ngày liền
create table if not exists public.vkl_linh_khi_log (
  id bigserial primary key,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  ngay date not null,
  life_id bigint,
  raw int not null,              -- linh khí theo bảng
  amount int not null,           -- linh khí thật sự cộng (sau trần 300/ngày)
  phu_id bigint,                 -- động phủ nhận (null khi chưa có động phủ ở Kỷ đang chạy)
  created_at timestamptz not null default now()
);
create index if not exists vkl_linh_khi_log_pd on public.vkl_linh_khi_log (player_id, ngay);

alter table public.vkl_ky enable row level security;
alter table public.vkl_tile enable row level security;
alter table public.vkl_phu enable row level security;
alter table public.vkl_phu_building enable row level security;
alter table public.vkl_phu_queue enable row level security;
alter table public.vkl_phu_troop enable row level security;
alter table public.vkl_march enable row level security;
alter table public.vkl_report enable row level security;
alter table public.vkl_mon enable row level security;
alter table public.vkl_mon_member enable row level security;
alter table public.vkl_linh_khi_log enable row level security;

-- ---------- Công thức (đọc số từ vkl_priv.sm_cfg) ----------
create or replace function vkl_priv.sm_num(p_path text[]) returns numeric
language sql immutable set search_path = '' as $$ select (vkl_priv.sm_cfg() #>> p_path)::numeric $$;

create or replace function vkl_priv.sm_cost(p_kind text, p_level int) returns jsonb
language sql immutable set search_path = '' as $$
  with c as (select vkl_priv.sm_cfg() j)
  select jsonb_build_object(
    'ls', round((j #>> array['b', p_kind, 'base', 'ls'])::numeric * power((j #>> '{sm,costG}')::numeric, p_level - 1)),
    'lt', round((j #>> array['b', p_kind, 'base', 'lt'])::numeric * power((j #>> '{sm,costG}')::numeric, p_level - 1)),
    'kt', round((j #>> array['b', p_kind, 'base', 'kt'])::numeric * power((j #>> '{sm,costG}')::numeric, p_level - 1)),
    'lk', case when p_level > 10 then (j #>> '{sm,lkPer}')::numeric * (p_level - 10) else 0 end)
  from c
$$;

create or replace function vkl_priv.sm_build_sec(p_kind text, p_level int, p_cd int) returns int
language sql immutable set search_path = '' as $$
  with c as (select vkl_priv.sm_cfg() j)
  select round((j #>> array['b', p_kind, 'baseSec'])::numeric * power((j #>> '{sm,timeG}')::numeric, p_level - 1)
               * power((j #>> '{sm,cdSpeed}')::numeric, greatest(0, p_cd - 1)))::int
  from c
$$;

create or replace function vkl_priv.sm_prod(p_level int, p_gioi text) returns numeric
language sql immutable set search_path = '' as $$
  with c as (select vkl_priv.sm_cfg() j)
  select (case when p_level <= 0 then (j #>> '{sm,prodBase}')::numeric
               else (j #>> '{sm,prodA}')::numeric * power((j #>> '{sm,prodG}')::numeric, p_level - 1) end)
         * (case when p_gioi = 'hong_tran' then 1 + (j #>> '{sm,hongTranProd}')::numeric else 1 end)
  from c
$$;

create or replace function vkl_priv.sm_cap(p_tb int) returns numeric
language sql immutable set search_path = '' as $$
  select round(vkl_priv.sm_num('{sm,capA}') * power(vkl_priv.sm_num('{sm,capG}'), p_tb))
$$;

create or replace function vkl_priv.sm_train_sec(p_unit text, p_lv int) returns int
language sql immutable set search_path = '' as $$
  select round(vkl_priv.sm_num(array['u', p_unit, 'trainSec']) * power(vkl_priv.sm_num('{sm,lvSpeed}'), greatest(0, p_lv - 1)))::int
$$;

create or replace function vkl_priv.sm_lv(p_phu bigint, p_kind text) returns int
language sql stable set search_path = '' as $$
  select coalesce((select level from public.vkl_phu_building where phu_id = p_phu and kind = p_kind), 0)
$$;

-- điểm (dân số): tổng pop * cấp(cấp+1)/2
create or replace function vkl_priv.sm_points(p_phu bigint) returns int
language sql stable set search_path = '' as $$
  select coalesce(round(sum((vkl_priv.sm_cfg() #>> array['b', b.kind, 'pop'])::numeric * b.level * (b.level + 1) / 2)), 0)::int
  from public.vkl_phu_building b where b.phu_id = p_phu
$$;

-- linh thảo đệ tử ăn mỗi giờ: quân của mình ở nhà, quân mình đang đi đường, quân mình đóng viện nơi khác
create or replace function vkl_priv.sm_upkeep(p_phu bigint) returns numeric
language sql stable set search_path = '' as $$
  select coalesce((select sum(t.n * (vkl_priv.sm_cfg() #>> array['u', t.unit, 'upkeep'])::numeric)
                   from public.vkl_phu_troop t where t.chu_phu = p_phu), 0)
       + coalesce((select sum((a.value)::numeric * (vkl_priv.sm_cfg() #>> array['u', a.key, 'upkeep'])::numeric)
                   from public.vkl_march m, jsonb_each_text(m.army) a
                   where m.from_phu = p_phu and m.state in ('di', 've')), 0)
$$;

-- Cộng sản lượng cho khoảng [t0, t1) theo cấp công trình hiện tại; bỏ phần thời gian bế quan; chặn ở sức chứa.
create or replace function vkl_priv.sm_accrue(p_phu bigint, t0 timestamptz, t1 timestamptz) returns void
language plpgsql set search_path = '' as $$
declare
  p public.vkl_phu;
  h numeric;
  cap numeric;
  pls numeric; plt numeric; pkt numeric; up numeric;
begin
  if t1 <= t0 then return; end if;
  select * into p from public.vkl_phu where id = p_phu;
  h := extract(epoch from (t1 - t0)) / 3600.0;
  if p.be_quan_tu is not null and p.be_quan_den is not null then
    h := h - greatest(0, extract(epoch from (least(t1, p.be_quan_den) - greatest(t0, p.be_quan_tu)))) / 3600.0;
  end if;
  if h <= 0 then return; end if;
  cap := vkl_priv.sm_cap(vkl_priv.sm_lv(p_phu, 'tang_bao'));
  pls := vkl_priv.sm_prod(vkl_priv.sm_lv(p_phu, 'linh_mach'), p.gioi);
  plt := vkl_priv.sm_prod(vkl_priv.sm_lv(p_phu, 'duoc_vien'), p.gioi);
  pkt := vkl_priv.sm_prod(vkl_priv.sm_lv(p_phu, 'khoang_dong'), p.gioi);
  -- phúc địa đang giữ: +25% loại tài nguyên của ô
  select pls * (1 + coalesce(sum(case when bonus = 'ls' then vkl_priv.sm_num('{pd,bonus}') end), 0)),
         plt * (1 + coalesce(sum(case when bonus = 'lt' then vkl_priv.sm_num('{pd,bonus}') end), 0)),
         pkt * (1 + coalesce(sum(case when bonus = 'kt' then vkl_priv.sm_num('{pd,bonus}') end), 0))
    into pls, plt, pkt
    from public.vkl_tile where ky_id = p.ky_id and loai = 'phuc_dia' and phu_id = p_phu;
  up := vkl_priv.sm_upkeep(p_phu);
  -- Kỷ 1: thiếu linh thảo thì kho về 0, đệ tử không chết đói (ghi trong plan)
  -- kho đã vượt sức chứa (vd cướp về) thì giữ nguyên, không cộng thêm; ăn lương thì vẫn trừ
  update public.vkl_phu set
    ls = case when ls >= cap then ls else least(cap, ls + pls * h) end,
    lt = case when plt - up < 0 then greatest(0, lt + (plt - up) * h)
              when lt >= cap then lt else least(cap, lt + (plt - up) * h) end,
    kt = case when kt >= cap then kt else least(cap, kt + pkt * h) end
  where id = p_phu;
end $$;

-- Áp mọi việc trong hàng chờ đã xong, theo thứ tự thời gian, rồi cộng sản lượng tới bây giờ.
create or replace function vkl_priv.sm_settle(p_phu bigint) returns void
language plpgsql set search_path = '' as $$
declare
  t timestamptz;
  q public.vkl_phu_queue;
begin
  select last_at into t from public.vkl_phu where id = p_phu for update;
  if t is null then return; end if;
  loop
    select * into q from public.vkl_phu_queue where phu_id = p_phu and done_at <= now() order by done_at, id limit 1;
    exit when q.id is null;
    perform vkl_priv.sm_accrue(p_phu, t, greatest(t, q.done_at));
    t := greatest(t, q.done_at);
    if q.loai = 'xay' then
      insert into public.vkl_phu_building (phu_id, kind, level) values (p_phu, q.kind, q.level)
        on conflict (phu_id, kind) do update set level = greatest(public.vkl_phu_building.level, excluded.level);
    elsif q.loai = 'luyen' then
      insert into public.vkl_phu_troop (phu_id, chu_phu, unit, n) values (p_phu, p_phu, q.kind, q.n)
        on conflict (phu_id, chu_phu, unit) do update set n = public.vkl_phu_troop.n + excluded.n;
    elsif q.loai = 'nghien_cuu' then
      update public.vkl_phu set
        nc_cong = case when q.kind = 'cong' then greatest(nc_cong, q.level) else nc_cong end,
        nc_thu = case when q.kind = 'thu' then greatest(nc_thu, q.level) else nc_thu end,
        nc_toc = case when q.kind = 'toc' then greatest(nc_toc, q.level) else nc_toc end
      where id = p_phu;
    end if;
    delete from public.vkl_phu_queue where id = q.id;
    q := null;
  end loop;
  perform vkl_priv.sm_accrue(p_phu, t, now());
  update public.vkl_phu set last_at = now(), diem = vkl_priv.sm_points(p_phu) where id = p_phu;
end $$;

-- Trừ tài nguyên nếu đủ; không đủ thì báo NO_RES
create or replace function vkl_priv.sm_pay(p_phu bigint, c jsonb, k numeric default 1) returns void
language plpgsql set search_path = '' as $$
declare n int;
begin
  update public.vkl_phu set
    ls = ls - (c->>'ls')::numeric * k, lt = lt - (c->>'lt')::numeric * k,
    kt = kt - (c->>'kt')::numeric * k, lk = lk - coalesce((c->>'lk')::numeric, 0) * k
  where id = p_phu
    and ls >= (c->>'ls')::numeric * k and lt >= (c->>'lt')::numeric * k
    and kt >= (c->>'kt')::numeric * k and lk >= coalesce((c->>'lk')::numeric, 0) * k;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'NO_RES'; end if;
end $$;

-- Kỷ đang chạy (null khi giữa hai Kỷ)
create or replace function vkl_priv.sm_ky_now() returns int
language sql stable set search_path = '' as $$
  select id from public.vkl_ky where now() >= bat_dau and now() < ket_thuc order by id desc limit 1
$$;

create or replace function vkl_priv.sm_my_phu(p_token uuid) returns bigint
language plpgsql stable set search_path = '' as $$
declare v_me uuid := public.vkl_player(p_token); v_ky int := vkl_priv.sm_ky_now(); v bigint;
begin
  if v_me is null then raise exception 'NOT_LOGGED_IN'; end if;
  if v_ky is null then raise exception 'NO_KY'; end if;
  select id into v from public.vkl_phu where player_id = v_me and ky_id = v_ky;
  if v is null then raise exception 'NO_PHU'; end if;
  return v;
end $$;

-- ---------- Sinh bản đồ Kỷ ----------
-- Ba khu hình quạt quanh tâm: Thiên phía bắc, Hồng Trần đông nam, U Minh tây nam (y tăng xuống dưới).
-- Vòng theo khoảng cách tới tâm: gần tâm (<= 35% bán kính), giữa (<= 70%), rìa.
-- Tâm: ô giữa là Thánh địa (không vào được), 3 ô quanh tâm là Thiên Đạo Đài, mỗi khu một Đài.
-- Yêu động 7% số ô, phúc địa 3%, chia ĐỀU theo từng khu và từng vòng để ba giới công bằng; cấp cao hơn khi gần tâm.
create or replace function vkl_priv.sm_gen_map(p_ky int) returns int
language plpgsql set search_path = '' as $$
#variable_conflict use_column
declare
  n int; c int; x int; y int; dx int; dy int; d numeric; ang numeric; khu text; vong text; lv int;
  cnt int := 0; cf jsonb := vkl_priv.sm_cfg(); g record; v_khu text; t record; k_yd int; k_pd int; i int;
begin
  select size into n from public.vkl_ky where id = p_ky;
  if n is null then raise exception 'NO_KY'; end if;
  delete from public.vkl_tile where ky_id = p_ky;
  perform setseed((p_ky % 1000) / 1000.0);
  c := (n - 1) / 2;
  for y in 0 .. n - 1 loop
    for x in 0 .. n - 1 loop
      dx := x - c; dy := y - c;
      d := sqrt(dx * dx + dy * dy) / c;
      if d > 1.0 then continue; end if; -- bản đồ tròn
      -- góc theo độ, 0 = đông, 90 = nam (y xuống dưới); Thiên quanh -90 (bắc), Hồng Trần quanh 30, U Minh quanh 150
      ang := degrees(atan2(dy, dx));
      if ang >= -150 and ang < -30 then khu := 'thien';
      elsif ang >= -30 and ang < 90 then khu := 'hong_tran';
      else khu := 'u_minh'; end if;
      vong := case when d <= 0.35 then 'gan' when d <= 0.7 then 'giua' else 'ria' end;
      if dx = 0 and dy = 0 then
        insert into public.vkl_tile (ky_id, x, y, loai, khu, vong) values (p_ky, x, y, 'thanh_dia', 'tam', 'tam');
      elsif (dx, dy) in ((0, -1), (1, 1), (-1, 1)) then
        insert into public.vkl_tile (ky_id, x, y, loai, khu, vong, npc)
        values (p_ky, x, y, 'dai', 'tam', 'tam', jsonb_build_object('tam_giao', case when dy = -1 then 'xien' when dx = 1 then 'triet' else 'nhan' end));
      else
        insert into public.vkl_tile (ky_id, x, y, loai, khu, vong) values (p_ky, x, y, 'trong', khu, vong);
      end if;
      cnt := cnt + 1;
    end loop;
  end loop;
  -- mỗi vòng lấy số ô theo khu ít ô nhất, để ba khu có đúng cùng số yêu động và phúc địa
  for g in select vong as v, min(m) as m from (select khu, vong, count(*) m from public.vkl_tile where ky_id = p_ky and loai = 'trong' group by 1, 2) z group by 1 loop
    k_yd := round(g.m * 0.07); k_pd := greatest(1, round(g.m * 0.03));
    for v_khu in select unnest(array['thien', 'hong_tran', 'u_minh']) loop
      i := 0;
      for t in select x, y from public.vkl_tile where ky_id = p_ky and loai = 'trong' and public.vkl_tile.khu = v_khu and vong = g.v order by random() limit k_yd + k_pd loop
        lv := case g.v when 'gan' then 6 + floor(random() * 5) when 'giua' then 3 + floor(random() * 5) else 1 + floor(random() * 4) end;
        if i < k_yd then
          update public.vkl_tile set loai = 'yeu_dong', cap = lv, npc = jsonb_build_object(
              'def', round((cf #>> '{yd,defA}')::numeric * power((cf #>> '{yd,defG}')::numeric, lv - 1)),
              'res', round((cf #>> '{yd,resA}')::numeric * power((cf #>> '{yd,resG}')::numeric, lv - 1)),
              'lay', 0, 'at', now())
            where ky_id = p_ky and x = t.x and y = t.y;
        else
          update public.vkl_tile set loai = 'phuc_dia', cap = lv, bonus = (array['ls', 'lt', 'kt'])[1 + (i % 3)],
              npc = jsonb_build_object('def', round((cf #>> '{pd,defA}')::numeric * power((cf #>> '{pd,defG}')::numeric, lv - 1)))
            where ky_id = p_ky and x = t.x and y = t.y;
        end if;
        i := i + 1;
      end loop;
    end loop;
  end loop;
  return cnt;
end $$;

-- Tạo Kỷ mới và sinh bản đồ. Tyler hoặc tác vụ đêm gọi bằng quyền quản trị (không cấp cho trình duyệt).
create or replace function vkl_priv.sm_ky_create(p_ten text, p_bat_dau timestamptz, p_ket_thuc timestamptz, p_size int) returns int
language plpgsql set search_path = '' as $$
declare v int;
begin
  insert into public.vkl_ky (ten, bat_dau, ket_thuc, size, dai_mo)
  values (p_ten, p_bat_dau, p_ket_thuc, p_size,
          p_ket_thuc - case when p_ket_thuc - p_bat_dau <= interval '10 days 12 hours' then interval '3 days' else interval '4 days' end)
  returning id into v;
  perform vkl_priv.sm_gen_map(v);
  return v;
end $$;

-- ---------- Trạng thái trả về cho trình duyệt ----------
create or replace function vkl_priv.sm_state_json(p_phu bigint) returns jsonb
language plpgsql stable set search_path = '' as $$
declare p public.vkl_phu; k public.vkl_ky; cd int; tb int; slots int;
begin
  select * into p from public.vkl_phu where id = p_phu;
  select * into k from public.vkl_ky where id = p.ky_id;
  cd := vkl_priv.sm_lv(p_phu, 'chinh_dien');
  tb := vkl_priv.sm_lv(p_phu, 'tang_bao');
  slots := case when cd >= vkl_priv.sm_num('{sm,queue2At}') then 2 else 1 end;
  return jsonb_build_object(
    'now', now(),
    'ky', jsonb_build_object('id', k.id, 'ten', k.ten, 'bat_dau', k.bat_dau, 'ket_thuc', k.ket_thuc, 'size', k.size, 'dai_mo', k.dai_mo),
    'phu', jsonb_build_object('id', p.id, 'x', p.x, 'y', p.y, 'gioi', p.gioi,
      'res', jsonb_build_object('ls', floor(p.ls), 'lt', floor(p.lt), 'kt', floor(p.kt), 'lk', floor(p.lk)),
      'cap', vkl_priv.sm_cap(tb),
      'prod', jsonb_build_object(
        'ls', round(vkl_priv.sm_prod(vkl_priv.sm_lv(p_phu, 'linh_mach'), p.gioi)),
        'lt', round(vkl_priv.sm_prod(vkl_priv.sm_lv(p_phu, 'duoc_vien'), p.gioi)),
        'kt', round(vkl_priv.sm_prod(vkl_priv.sm_lv(p_phu, 'khoang_dong'), p.gioi))),
      'upkeep', vkl_priv.sm_upkeep(p_phu),
      'bao_ho_den', p.bao_ho_den, 'be_quan_den', p.be_quan_den, 'hero_nghi_den', p.hero_nghi_den,
      'nc', jsonb_build_object('cong', p.nc_cong, 'thu', p.nc_thu, 'toc', p.nc_toc),
      'diem', p.diem, 'quy_thuan', p.quy_thuan, 'slots', slots),
    'buildings', coalesce((select jsonb_object_agg(kind, level) from public.vkl_phu_building where phu_id = p_phu), '{}'::jsonb),
    'queue', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'loai', loai, 'kind', kind, 'level', level, 'n', n, 'start_at', start_at, 'done_at', done_at) order by done_at)
                       from public.vkl_phu_queue where phu_id = p_phu), '[]'::jsonb),
    'troops', coalesce((select jsonb_object_agg(unit, n) from public.vkl_phu_troop where phu_id = p_phu and chu_phu = p_phu and n > 0), '{}'::jsonb),
    'unread', (select count(*) from public.vkl_report where phu_id = p_phu and not doc)
  );
end $$;

-- ---------- RPC cho trình duyệt ----------
-- Mở động phủ: cần tài khoản đã liên kết (Google hoặc Sổ Luân Hồi) và đã có chân thân. vung: gan | giua | ria
create or replace function public.vkl_phu_found(p_token uuid, p_gioi text, p_vung text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := public.vkl_player(p_token);
  v_ky int := vkl_priv.sm_ky_now();
  pl public.vkl_players;
  t record;
  v_phu bigint;
  cf jsonb := vkl_priv.sm_cfg();
  b record;
begin
  if v_me is null then raise exception 'NOT_LOGGED_IN'; end if;
  if v_ky is null then raise exception 'NO_KY'; end if;
  if p_gioi not in ('thien', 'hong_tran', 'u_minh') then raise exception 'BAD_GIOI'; end if;
  if p_vung not in ('gan', 'giua', 'ria') then raise exception 'BAD_VUNG'; end if;
  select * into pl from public.vkl_players where id = v_me;
  if pl.google_sub is null and pl.recovery_hash is null then raise exception 'NOT_LINKED'; end if;
  if jsonb_typeof(pl.meta->'chanThan') is distinct from 'object' then raise exception 'NO_CHAN_THAN'; end if;
  if exists (select 1 from public.vkl_phu where player_id = v_me and ky_id = v_ky) then raise exception 'ALREADY'; end if;
  -- ô trống ngẫu nhiên trong khu của giới và vòng đã chọn; vòng đó hết chỗ thì lấy vòng khác cùng khu
  select x, y into t from public.vkl_tile
    where ky_id = v_ky and khu = p_gioi and loai = 'trong'
    order by (vong <> p_vung), random() limit 1 for update skip locked;
  if t is null then raise exception 'FULL'; end if;
  insert into public.vkl_phu (player_id, ky_id, x, y, gioi, ls, lt, kt, lk, bao_ho_den)
  values (v_me, v_ky, t.x, t.y, p_gioi,
          (cf #>> '{sm,startRes,ls}')::numeric, (cf #>> '{sm,startRes,lt}')::numeric, (cf #>> '{sm,startRes,kt}')::numeric,
          -- linh khí từ kiếp đã chơi hôm nay (trước khi mở phủ) được mang vào
          coalesce((select sum(amount) from public.vkl_linh_khi_log where player_id = v_me and phu_id is null
                    and ngay = (now() at time zone 'Asia/Ho_Chi_Minh')::date), 0),
          now() + make_interval(days => (cf #>> '{sm,protectDays}')::int))
  returning id into v_phu;
  update public.vkl_linh_khi_log set phu_id = v_phu
    where player_id = v_me and phu_id is null and ngay = (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  update public.vkl_tile set loai = 'phu', phu_id = v_phu where ky_id = v_ky and x = t.x and y = t.y;
  for b in select key, value from jsonb_each_text(cf #> '{b}') loop
    insert into public.vkl_phu_building (phu_id, kind, level)
    values (v_phu, b.key, coalesce((cf #>> array['sm', 'startLevels', b.key])::int, 0));
  end loop;
  update public.vkl_phu set diem = vkl_priv.sm_points(v_phu) where id = v_phu;
  return vkl_priv.sm_state_json(v_phu);
end $$;

-- Đọc động phủ (tính tài nguyên lười). Chưa có động phủ ở Kỷ đang chạy: null.
create or replace function public.vkl_phu_state(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := public.vkl_player(p_token); v_ky int := vkl_priv.sm_ky_now(); v bigint;
begin
  if v_me is null then raise exception 'NOT_LOGGED_IN'; end if;
  if v_ky is null then return null; end if;
  select id into v from public.vkl_phu where player_id = v_me and ky_id = v_ky;
  if v is null then return null; end if;
  perform vkl_priv.sm_settle(v);
  return vkl_priv.sm_state_json(v);
end $$;

-- Xây hoặc nâng một công trình lên cấp kế tiếp
create or replace function public.vkl_phu_build(p_token uuid, p_building text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v bigint := vkl_priv.sm_my_phu(p_token);
  cf jsonb := vkl_priv.sm_cfg();
  cur int; queued int; nxt int; cd int; slots int; busy int; c jsonb; sec int; t0 timestamptz;
begin
  if cf #> array['b', p_building] is null then raise exception 'BAD_BUILDING'; end if;
  perform vkl_priv.sm_settle(v);
  cd := vkl_priv.sm_lv(v, 'chinh_dien');
  if cd < (cf #>> array['b', p_building, 'needCd'])::int then raise exception 'LOCKED'; end if;
  slots := case when cd >= (cf #>> '{sm,queue2At}')::int then 2 else 1 end;
  select count(*) into busy from public.vkl_phu_queue where phu_id = v and loai = 'xay';
  if busy >= slots then raise exception 'QUEUE_FULL'; end if;
  cur := vkl_priv.sm_lv(v, p_building);
  select count(*) into queued from public.vkl_phu_queue where phu_id = v and loai = 'xay' and kind = p_building;
  nxt := cur + queued + 1;
  if nxt > (cf #>> '{sm,maxLevel}')::int then raise exception 'MAX_LEVEL'; end if;
  c := vkl_priv.sm_cost(p_building, nxt);
  perform vkl_priv.sm_pay(v, c);
  sec := vkl_priv.sm_build_sec(p_building, nxt, cd);
  -- cùng công trình đang xây thì cấp kế tiếp bắt đầu khi cấp trước xong
  select coalesce(max(done_at), now()) into t0 from public.vkl_phu_queue where phu_id = v and loai = 'xay' and kind = p_building;
  insert into public.vkl_phu_queue (phu_id, loai, kind, level, start_at, done_at)
  values (v, 'xay', p_building, nxt, t0, t0 + make_interval(secs => sec));
  return vkl_priv.sm_state_json(v);
end $$;

-- Luyện n đệ tử một loại (cả lượt xong cùng lúc)
create or replace function public.vkl_phu_train(p_token uuid, p_unit text, p_n int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v bigint := vkl_priv.sm_my_phu(p_token);
  cf jsonb := vkl_priv.sm_cfg();
  g text; cd int; lv int; tk int; slots int; busy int; sec int;
begin
  if cf #> array['u', p_unit] is null then raise exception 'BAD_UNIT'; end if;
  if p_n is null or p_n < 1 or p_n > (cf #>> '{sm,trainMax}')::int then raise exception 'BAD_N'; end if;
  perform vkl_priv.sm_settle(v);
  select gioi into g from public.vkl_phu where id = v;
  if cf #>> array['u', p_unit, 'gioi'] <> g then raise exception 'BAD_UNIT'; end if;
  lv := vkl_priv.sm_lv(v, 'luyen_vo');
  tk := vkl_priv.sm_lv(v, 'tang_kinh');
  if lv < (cf #>> array['u', p_unit, 'needLv'])::int or tk < (cf #>> array['u', p_unit, 'needTk'])::int then raise exception 'LOCKED'; end if;
  cd := vkl_priv.sm_lv(v, 'chinh_dien');
  slots := case when cd >= (cf #>> '{sm,queue2At}')::int then 2 else 1 end;
  select count(*) into busy from public.vkl_phu_queue where phu_id = v and loai = 'luyen';
  if busy >= slots then raise exception 'QUEUE_FULL'; end if;
  perform vkl_priv.sm_pay(v, cf #> array['u', p_unit, 'cost'], p_n);
  sec := vkl_priv.sm_train_sec(p_unit, lv) * p_n;
  insert into public.vkl_phu_queue (phu_id, loai, kind, n, done_at) values (v, 'luyen', p_unit, p_n, now() + make_interval(secs => sec));
  return vkl_priv.sm_state_json(v);
end $$;

-- ---------- Linh khí từ kiếp ----------
-- Chạy SAU lives_guard (trigger after insert chỉ chạy khi bia thật sự được ghi). Lỗi gì cũng không chặn việc ghi bia.
create or replace function vkl_priv.sm_lives_lk() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  raw int; got int; v_day date := (now() at time zone 'Asia/Ho_Chi_Minh')::date; v_phu bigint; v_ky int;
  cap int;
begin
  begin
    raw := case
      when coalesce(new.look->>'endTag', '') = 'chung_dao' or coalesce(new.realm_no, 0) >= 12 then 120
      when new.ascended then 90
      when coalesce(new.realm_no, 0) >= 6 then 60
      else (array[5, 5, 10, 20, 30, 45])[greatest(0, coalesce(new.realm_no, 0)) + 1] end;
    cap := coalesce(vkl_priv.sm_num('{sm,lkDayCap}'), 300)::int;
    select coalesce(sum(amount), 0) into got from public.vkl_linh_khi_log where player_id = new.player_id and ngay = v_day;
    v_ky := vkl_priv.sm_ky_now();
    if v_ky is not null then
      select id into v_phu from public.vkl_phu where player_id = new.player_id and ky_id = v_ky;
    end if;
    insert into public.vkl_linh_khi_log (player_id, ngay, life_id, raw, amount, phu_id)
    values (new.player_id, v_day, new.id, raw, greatest(0, least(raw, cap - got)), v_phu);
    if v_phu is not null and cap - got > 0 then
      update public.vkl_phu set lk = lk + least(raw, cap - got) where id = v_phu;
    end if;
  exception when others then
    null;
  end;
  return null;
end $$;
drop trigger if exists vkl_lives_zz_linh_khi on public.vkl_lives;
create trigger vkl_lives_zz_linh_khi after insert on public.vkl_lives for each row execute function vkl_priv.sm_lives_lk();

-- ---------- Quyền ----------
revoke all on function vkl_priv.sm_gen_map(int) from public;
revoke all on function vkl_priv.sm_ky_create(text, timestamptz, timestamptz, int) from public;
revoke all on function vkl_priv.sm_lives_lk() from public;
grant execute on function public.vkl_phu_found(uuid, text, text) to anon, authenticated;
grant execute on function public.vkl_phu_state(uuid) to anon, authenticated;
grant execute on function public.vkl_phu_build(uuid, text) to anon, authenticated;
grant execute on function public.vkl_phu_train(uuid, text, int) to anon, authenticated;

-- Tạo Kỷ 1 (Ngày 8, KHÔNG chạy ở bản này):
-- select vkl_priv.sm_ky_create('Kỷ 1', '2026-11-18 05:00+07', '2026-12-01 21:00+07', 31);
