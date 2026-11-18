-- Ngày 8a (lên bản 19/11): Phần thưởng Kỷ - Công đóng góp và Pháp bảo Sơn Môn.
-- Luật (Tyler chốt 18/11, Claude chốt chi tiết trong docs/plan-4.6.0.md khối Ngày 8a):
--   * Công tính theo người, trong môn đang ở lúc kết Kỷ: điểm danh +1; nhiệm vụ ngày +2/+3/+5; khai hoang +3;
--     theo xuất chinh +3 (thắng hoặc cắm cờ thêm +3); đứng giữ ô của môn +1 mỗi 6 giờ. Trần 20 Công mỗi ngày.
--   * Môn đủ điều kiện: còn lúc kết Kỷ, đủ chữ ký, từ 3 người. Phẩm theo hạng giữa các môn đủ điều kiện:
--     1 Thần, 2 Tiên, 3 Linh, 4-10 Bảo, còn lại Phàm.
--   * Người nhận: vào môn trước lúc kết Kỷ ít nhất 3 ngày, tài khoản từ 7 ngày tuổi, Công từ 10, không bị ẩn khỏi bảng
--     xếp hạng vì gian lận. Top 7 Công trong môn nhận vũ khí, mỗi hạng một loại. Môn chủ (hoặc trưởng lão Công cao nhất
--     nếu môn chủ không đủ điều kiện) nhận thêm Chưởng Môn Ấn; ngoài top 7 thì nhận Trấn Môn Kiếm và top 7 còn 6 suất.
--   * Sức mạnh (chỉ Lực chiến Sơn Môn, chỉ ở Kỷ kế tiếp): Thần 12%, Tiên 9%, Linh 7%, Bảo 4%, Phàm 2%;
--     Công hạng 1 thêm 3%, hạng 2-3 thêm 2%. Tổng tối đa 25%, cộng SAU trần. Kỷ 1 không đổi trận.
-- Chỉ tạo bảng/hàm/cron MỚI, không sửa hàm cũ. Chạy lại nhiều lần không hỏng.

-- ---------- Bảng ----------
create table if not exists public.vkl_sm_cong_giu (
  ky_id int not null,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  mon_id bigint not null,
  ngay date not null,
  gio int not null default 0,
  gio_cuoi timestamptz not null,
  primary key (ky_id, player_id, mon_id, ngay)
);
alter table public.vkl_sm_cong_giu enable row level security;

create table if not exists public.vkl_sm_bao_vat (
  id bigserial primary key,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  ky_id int not null,
  mon_id bigint,
  o text not null check (o in ('vu_khi', 'phu_kien')),
  loai text not null check (loai in ('kiem', 'dao', 'thuong', 'quat', 'phat_tran', 'cung', 'song_chuy', 'tran_mon_kiem', 'an')),
  pham text not null check (pham in ('than', 'tien', 'linh', 'bao', 'pham')),
  hang_mon int,
  hang_cong int,
  them_pct int not null,
  ten text not null,
  khac text,
  mac boolean not null default false,
  luc timestamptz not null default now(),
  unique (player_id, ky_id, o)
);
create index if not exists vkl_sm_bao_vat_player on public.vkl_sm_bao_vat (player_id);
alter table public.vkl_sm_bao_vat enable row level security;

create table if not exists public.vkl_sm_bv_phat (
  ky_id int primary key,
  luc timestamptz not null default now(),
  n int not null default 0
);
alter table public.vkl_sm_bv_phat enable row level security;

-- ---------- Công ----------
-- Công của mọi người trong một Kỷ, theo (người, môn). Tính lại từ dữ liệu có sẵn + bảng đứng giữ.
create or replace function vkl_priv.sm_cong_ds(p_ky int)
returns table (player_id uuid, mon_id bigint, cong int, dd int, nv int, kh int, xc int, giu int)
language sql stable security definer set search_path = '' as $$
  with k as (
    select vkl_priv.sm_day(bat_dau) d0, vkl_priv.sm_day(ket_thuc) d1 from public.vkl_sm_ky where id = p_ky
  ), ev as (
    select d.player_id, d.mon_id, d.ngay, 1 n, 'dd' l from public.vkl_sm_diem_danh d, k where d.ngay between k.d0 and k.d1
    union all
    select v.player_id, v.mon_id, v.ngay,
      (case when v.xong[1] then 2 else 0 end) + (case when v.xong[2] then 3 else 0 end) + (case when v.xong[3] then 5 else 0 end), 'nv'
    from public.vkl_sm_nv v, k where v.ngay between k.d0 and k.d1
    union all
    select p.id, b.mon_a, vkl_priv.sm_day(b.luc), 3, 'kh'
    from public.vkl_sm_bao b join public.vkl_players p on p.username = b.noi_dung ->> 'nguoi'
    where b.ky_id = p_ky and b.loai = 'cam_co' and coalesce((b.noi_dung ->> 'khai_hoang')::boolean, false)
    union all
    select t.player_id, c.mon_id, vkl_priv.sm_day(coalesce(c.toi_noi_luc, c.luc)),
      3 + case when c.ket_qua ->> 'kq' in ('thang', 'cam_co') then 3 else 0 end, 'xc'
    from public.vkl_sm_chinh c join public.vkl_sm_chinh_theo t on t.chinh_id = c.id
    where c.ky_id = p_ky and c.trang_thai = 'xong'
    union all
    select g.player_id, g.mon_id, g.ngay, g.gio / 6, 'giu' from public.vkl_sm_cong_giu g where g.ky_id = p_ky
  ), ngay as (
    select e.player_id, e.mon_id, e.ngay, least(sum(e.n), 20)::int c,
      sum(e.n) filter (where e.l = 'dd')::int dd, sum(e.n) filter (where e.l = 'nv')::int nv,
      sum(e.n) filter (where e.l = 'kh')::int kh, sum(e.n) filter (where e.l = 'xc')::int xc,
      sum(e.n) filter (where e.l = 'giu')::int giu
    from ev e where e.mon_id is not null group by 1, 2, 3
  )
  select n.player_id, n.mon_id, sum(n.c)::int, coalesce(sum(n.dd), 0)::int, coalesce(sum(n.nv), 0)::int,
    coalesce(sum(n.kh), 0)::int, coalesce(sum(n.xc), 0)::int, coalesce(sum(n.giu), 0)::int
  from ngay n group by 1, 2;
$$;

-- Mỗi giờ: ai đang đứng giữ ô của môn mình (đã tới nơi, không nghỉ) thì +1 giờ. Mỗi 6 giờ trong ngày = +1 Công.
-- Chạy hai lần trong cùng một giờ không đếm trùng (gio_cuoi).
create or replace function vkl_priv.sm_cong_giu_tick()
returns int language plpgsql security definer set search_path = '' as $$
declare v_ky int := vkl_priv.sm_ky_now(); v_h timestamptz := date_trunc('hour', now()); v_n int;
begin
  if v_ky is null then return 0; end if;
  insert into public.vkl_sm_cong_giu as g (ky_id, player_id, mon_id, ngay, gio, gio_cuoi)
  select v_ky, mb.player_id, mb.mon_id, vkl_priv.sm_day(now()), 1, v_h
  from public.vkl_sm_member mb
  join public.vkl_sm_tile t on t.ky_id = v_ky and t.q = mb.dung_q and t.r = mb.dung_r and t.mon_id = mb.mon_id
  where mb.dung_q is not null
    and (mb.nghi_toi is null or mb.nghi_toi <= now())
    and (mb.di_toi is null or mb.di_toi <= now())
  on conflict (ky_id, player_id, mon_id, ngay) do update set gio = g.gio + 1, gio_cuoi = excluded.gio_cuoi
    where g.gio_cuoi < excluded.gio_cuoi;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- ---------- Ai nhận gì ----------
create or replace function vkl_priv.sm_bv_pct(p_pham text)
returns int language sql immutable set search_path = '' as $$
  select case p_pham when 'than' then 12 when 'tien' then 9 when 'linh' then 7 when 'bao' then 4 else 2 end;
$$;

-- Tính phần thưởng của một Kỷ theo dữ liệu hiện tại (trước lúc kết thì là "nếu Kỷ kết thúc bây giờ").
-- Hạng môn: theo vkl_sm_ky_kq nếu đã kết, chưa kết thì theo số ô, Khí vận như sm_ket_ky.
create or replace function vkl_priv.sm_thuong_tinh(p_ky int)
returns table (player_id uuid, mon_id bigint, o text, loai text, pham text, hang_mon int, hang_cong int, them_pct int, ten text, khac text)
language sql stable security definer set search_path = '' as $$
  with k as (
    select id, ket_thuc, vkl_priv.sm_day(bat_dau) d0, vkl_priv.sm_day(ket_thuc) d1 from public.vkl_sm_ky where id = p_ky
  ), mon0 as (
    select m.id, m.ten, m.ten1, m.ten2, m.mon_chu, m.lap_luc, q.hang,
      (select count(*) from public.vkl_sm_tile t where t.ky_id = p_ky and t.mon_id = m.id) so_o,
      (select coalesce(sum(n.khi_van), 0) from public.vkl_sm_ngay n, k where n.mon_id = m.id and n.ngay between k.d0 and k.d1) kv
    from public.vkl_sm_mon m
    left join public.vkl_sm_ky_kq q on q.ky_id = p_ky and q.mon_id = m.id
    where m.ky_lap = p_ky and m.giai_tan_luc is null and m.du_ky and vkl_priv.sm_mon_n(m.id) >= 3
  ), mon as (
    select m.*, row_number() over (order by m.hang nulls last, m.so_o desc, m.kv desc, m.lap_luc, m.id)::int hm from mon0 m
  ), cong as (
    select c.player_id, c.mon_id, c.cong from vkl_priv.sm_cong_ds(p_ky) c
  ), nguoi as (
    select mb.player_id, mb.mon_id, mb.chuc, mb.vao_luc, c.cong
    from public.vkl_sm_member mb
    join mon on mon.id = mb.mon_id
    join public.vkl_players p on p.id = mb.player_id
    join cong c on c.player_id = mb.player_id and c.mon_id = mb.mon_id
    cross join k
    where mb.vao_luc <= k.ket_thuc - interval '3 days'
      and p.created_at <= k.ket_thuc - interval '7 days'
      and c.cong >= 10
      and not exists (select 1 from vkl_priv.lb_hidden h where h.username = p.username)
  ), rk as (
    select n.*, row_number() over (partition by n.mon_id order by n.cong desc, n.vao_luc, n.player_id)::int rk from nguoi n
  ), lead as (
    select distinct on (r.mon_id) r.mon_id, r.player_id, r.rk
    from rk r join mon on mon.id = r.mon_id
    where r.player_id = mon.mon_chu or r.chuc = 'lao'
    order by r.mon_id, (r.player_id = mon.mon_chu) desc, r.cong desc, r.rk
  ), vk as (
    select r.player_id, r.mon_id, r.rk,
      case when l.player_id = r.player_id and r.rk > 7 then 'tran_mon_kiem'
           else (array['kiem', 'dao', 'thuong', 'quat', 'phat_tran', 'cung', 'song_chuy'])[r.rk] end loai
    from rk r left join lead l on l.mon_id = r.mon_id
    where r.player_id = l.player_id
       or r.rk <= case when l.player_id is not null and l.rk > 7 then 6 else 7 end
  ), items as (
    select v.player_id, v.mon_id, 'vu_khi' o, v.loai, v.rk from vk v
    union all
    select l.player_id, l.mon_id, 'phu_kien', 'an', l.rk from lead l
  )
  select i.player_id, i.mon_id, i.o, i.loai, ph.pham, mon.hm, i.rk,
    least(25, vkl_priv.sm_bv_pct(ph.pham)
      + case when i.o = 'vu_khi' and i.loai <> 'tran_mon_kiem' then case when i.rk = 1 then 3 when i.rk <= 3 then 2 else 0 end else 0 end),
    (case ph.pham when 'than' then 'Thần phẩm ' when 'tien' then 'Tiên phẩm ' when 'linh' then 'Linh phẩm ' when 'bao' then 'Bảo phẩm ' else 'Phàm phẩm ' end)
      || case i.loai
           when 'tran_mon_kiem' then 'Trấn Môn Kiếm'
           when 'an' then mon.ten1 || ' ' || mon.ten2 || ' Chưởng Môn Ấn'
           else mon.ten1 || ' ' || mon.ten2 || ' ' || case i.loai when 'kiem' then 'Kiếm' when 'dao' then 'Đao' when 'thuong' then 'Thương'
             when 'quat' then 'Quạt' when 'phat_tran' then 'Phất Trần' when 'cung' then 'Cung' else 'Song Chùy' end
         end,
    mon.ten || ' - Kỷ ' || p_ky
  from items i
  join mon on mon.id = i.mon_id
  cross join lateral (select case when mon.hm = 1 then 'than' when mon.hm = 2 then 'tien' when mon.hm = 3 then 'linh'
                                  when mon.hm <= 10 then 'bao' else 'pham' end pham) ph;
$$;

-- Phát thưởng một Kỷ đã kết. Chạy lại không phát trùng (unique player, ky, o). Gửi thư cho người mới nhận.
create or replace function vkl_priv.sm_phat_thuong(p_ky int)
returns int language plpgsql security definer set search_path = '' as $$
declare v_n int;
begin
  if not exists (select 1 from public.vkl_sm_ky where id = p_ky and ket_xong) then raise exception 'SM_KY_CHUA_KET'; end if;
  with ins as (
    insert into public.vkl_sm_bao_vat (player_id, ky_id, mon_id, o, loai, pham, hang_mon, hang_cong, them_pct, ten, khac)
    select t.player_id, p_ky, t.mon_id, t.o, t.loai, t.pham, t.hang_mon, t.hang_cong, t.them_pct, t.ten, t.khac
    from vkl_priv.sm_thuong_tinh(p_ky) t
    on conflict (player_id, ky_id, o) do nothing
    returning player_id, ten
  ), thu as (
    insert into public.vkl_mail (to_player, from_player, kind, body)
    select p.username, null, 'thien_dao',
      'Kỷ ' || p_ky || ' đã khép lại. Sơn Môn ghi công đạo hữu, ban: ' || string_agg(i.ten, ', ') ||
      '. Vào trang Chân thân, mục Pháp bảo Sơn Môn để mặc. Pháp bảo cộng Lực chiến Sơn Môn trong Kỷ ' || (p_ky + 1) || '.'
    from ins i join public.vkl_players p on p.id = i.player_id group by p.username
    returning 1
  )
  select count(*) into v_n from ins;
  insert into public.vkl_sm_bv_phat (ky_id, n) values (p_ky, v_n)
  on conflict (ky_id) do update set n = public.vkl_sm_bv_phat.n + excluded.n, luc = now();
  return v_n;
end;
$$;

-- Cron: Kỷ nào đã kết mà chưa phát thì phát (sm_ket_ky chạy mỗi phút ở cron vkl_sm_ket_ky).
create or replace function vkl_priv.sm_phat_tick()
returns int language plpgsql security definer set search_path = '' as $$
declare r record; v int := 0;
begin
  for r in select k.id from public.vkl_sm_ky k where k.ket_xong and not exists (select 1 from public.vkl_sm_bv_phat p where p.ky_id = k.id) loop
    v := v + vkl_priv.sm_phat_thuong(r.id);
  end loop;
  return v;
end;
$$;

-- Lực chiến Sơn Môn có pháp bảo (CHỈ nối vào trận từ Kỷ 2, khối Ngày 11). Pháp bảo của Kỷ trước, đang mặc.
create or replace function vkl_priv.sm_lc_bv(p_player uuid, p_ky int)
returns int language sql stable security definer set search_path = '' as $$
  select round(vkl_priv.sm_cap(vkl_priv.sm_lc_get(p_player))
    * (1 + least(25, coalesce((select sum(b.them_pct) from public.vkl_sm_bao_vat b
                               where b.player_id = p_player and b.mac and b.ky_id = p_ky - 1), 0)) / 100.0))::int;
$$;

-- ---------- RPC cho người chơi ----------
-- Bảng Công của môn mình + "nếu Kỷ kết thúc bây giờ, ngươi nhận gì". Một lệnh cho cả màn Phần thưởng.
create or replace function public.vkl_sm_cong_bang(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_ky int; v_mon bigint; k public.vkl_sm_ky; v jsonb;
begin
  select id into v_ky from public.vkl_sm_ky where bat_dau <= now() order by id desc limit 1;
  select * into k from public.vkl_sm_ky where id = v_ky;
  select mon_id into v_mon from public.vkl_sm_member where player_id = v_me;
  if v_ky is null then return jsonb_build_object('ky', null); end if;
  with c as (
    select * from vkl_priv.sm_cong_ds(v_ky) where mon_id = v_mon
  ), t as (
    select * from vkl_priv.sm_thuong_tinh(v_ky)
  ), ds as (
    select mb.player_id, p.username, coalesce(p.meta -> 'chanThan' ->> 'name', p.username) ten, mb.chuc, mb.vao_luc,
      coalesce(c.cong, 0) cong, c.dd, c.nv, c.kh, c.xc, c.giu,
      row_number() over (order by coalesce(c.cong, 0) desc, mb.vao_luc, mb.player_id)::int hang
    from public.vkl_sm_member mb join public.vkl_players p on p.id = mb.player_id
    left join c on c.player_id = mb.player_id
    where mb.mon_id = v_mon
  )
  select jsonb_build_object(
    'ky', jsonb_build_object('id', k.id, 'ket_thuc', k.ket_thuc, 'ket_xong', k.ket_xong,
                             'khoa', k.ket_thuc - interval '3 days'),
    'ds', coalesce((select jsonb_agg(jsonb_build_object('ten', d.ten, 'tk', d.username, 'chuc', d.chuc, 'cong', d.cong,
                       'hang', d.hang, 'ta', d.player_id = v_me,
                       'nhan', (select jsonb_agg(jsonb_build_object('o', t.o, 'loai', t.loai, 'pham', t.pham)) from t where t.player_id = d.player_id))
                     order by d.hang) from ds d), '[]'::jsonb),
    'ta', (select jsonb_build_object('hang', d.hang, 'cong', d.cong, 'dd', coalesce(d.dd, 0), 'nv', coalesce(d.nv, 0), 'kh', coalesce(d.kh, 0),
                    'xc', coalesce(d.xc, 0), 'giu', coalesce(d.giu, 0), 'vao_som', d.vao_luc <= k.ket_thuc - interval '3 days')
           from ds d where d.player_id = v_me),
    'nhan', coalesce((select jsonb_agg(jsonb_build_object('o', t.o, 'loai', t.loai, 'pham', t.pham, 'pct', t.them_pct, 'ten', t.ten, 'hang_cong', t.hang_cong))
                      from t where t.player_id = v_me), '[]'::jsonb),
    'mon_hang', (select min(t.hang_mon) from t where t.mon_id = v_mon),
    'mon_du', exists (select 1 from public.vkl_sm_mon m where m.id = v_mon and m.du_ky and m.giai_tan_luc is null and vkl_priv.sm_mon_n(m.id) >= 3),
    'tk_du', (select p.created_at <= k.ket_thuc - interval '7 days' from public.vkl_players p where p.id = v_me),
    'can', 10
  ) into v;
  return v;
end;
$$;

create or replace function public.vkl_sm_bao_vat_ds(p_token uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', b.id, 'ky', b.ky_id, 'o', b.o, 'loai', b.loai, 'pham', b.pham, 'pct', b.them_pct,
           'ten', b.ten, 'khac', b.khac, 'mac', b.mac, 'hang_cong', b.hang_cong, 'hang_mon', b.hang_mon) order by b.ky_id desc, b.o), '[]'::jsonb)
  from public.vkl_sm_bao_vat b where b.player_id = public.vkl_player(p_token);
$$;

-- Mặc (hoặc tháo nếu đang mặc). Mỗi ô một món.
create or replace function public.vkl_sm_bao_vat_mac(p_token uuid, p_id bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := public.vkl_player(p_token); b public.vkl_sm_bao_vat;
begin
  if v_me is null then raise exception 'SM_AUTH'; end if;
  select * into b from public.vkl_sm_bao_vat where id = p_id and player_id = v_me for update;
  if b.id is null then raise exception 'SM_BV'; end if;
  if b.mac then
    update public.vkl_sm_bao_vat set mac = false where id = b.id;
  else
    update public.vkl_sm_bao_vat set mac = false where player_id = v_me and o = b.o and mac;
    update public.vkl_sm_bao_vat set mac = true where id = b.id;
  end if;
  return public.vkl_sm_bao_vat_ds(p_token);
end;
$$;

-- ---------- Quyền ----------
do $$
declare f text;
begin
  foreach f in array array['vkl_priv.sm_cong_ds(int)', 'vkl_priv.sm_cong_giu_tick()', 'vkl_priv.sm_bv_pct(text)',
                           'vkl_priv.sm_thuong_tinh(int)', 'vkl_priv.sm_phat_thuong(int)', 'vkl_priv.sm_phat_tick()',
                           'vkl_priv.sm_lc_bv(uuid, int)'] loop
    execute format('revoke all on function %s from public', f);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('revoke all on function %s from anon, authenticated', f); end if;
  end loop;
  foreach f in array array['public.vkl_sm_cong_bang(uuid)', 'public.vkl_sm_bao_vat_ds(uuid)', 'public.vkl_sm_bao_vat_mac(uuid, bigint)'] loop
    execute format('revoke all on function %s from public', f);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('grant execute on function %s to anon, authenticated', f); end if;
  end loop;
end $$;

-- ---------- Cron ----------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname in ('vkl_sm_cong_giu', 'vkl_sm_phat_thuong');
    perform cron.schedule('vkl_sm_cong_giu', '2 * * * *', 'select vkl_priv.sm_cong_giu_tick()');
    perform cron.schedule('vkl_sm_phat_thuong', '*/10 * * * *', 'select vkl_priv.sm_phat_tick()');
  end if;
end $$;
