-- Đã áp hết 19/11 tối (phần bảng qua MCP, phần hàm Tyler chạy trong SQL Editor). Sửa sau: sm_dat_5h không ghi cột ten (cột sinh tự động); sm_dat_dat và sm_dat_5h đổi biến vòng lặp r thành x (trùng tên cột r).
-- Ngày 9 (19/11): "Đất có giá" làm sớm cho Kỷ 1, tính từ 5:00 21/11 (giờ VN). Bảng, hàm, cron MỚI; không sửa hàm cũ.
-- Giao diện giấu sau cờ SM_DAT_ON tới Ngày 10. Trước 5:00 21/11 mọi hàm mới đều không làm gì (trừ đặt loại ô, chỉ là dữ liệu).
--  * Điểm giữ đất mỗi giờ: ô thường 1, Linh Mạch 3, Thiên Trì (0,0) 5. Xếp hạng Kỷ theo điểm, bằng điểm xét ô rồi Khí vận.
--  * Linh Mạch: 12 ô (4 mỗi cõi, vòng 3-4). Giữ lúc 5:00: +2 Khí vận mỗi ô cho môn hôm đó.
--  * Thiên Trì: người đứng giữ +10% lực giữ.
--  * Yêu thú: mỗi 5:00 tối đa 8 ô trống ở vòng 5-6 bị chiếm, lực giữ cố định theo cfg (sau mô phỏng 19/11: vòng 5 10.000-18.000, vòng 6 18.000-30.000).
--    Ô yêu thú do một "môn" hệ thống (đã giải tán, không hiện ở danh sách, xếp hạng) giữ, bảo hộ rất xa: hàm cũ không khai hoang
--    hay xuất chinh được vào ô này; chỉ vkl_sm_march2 mới đánh được. Thắng: ô về môn, mỗi người đi theo +10 phúc. Hết ngày: ô về trống.
--  * Dải sức mạnh: chỉ đánh ô của môn có tổng Lực chiến (có trần) từ 1/3 môn mình. Linh Mạch, Thiên Trì, yêu thú ai cũng đánh.
--  * Thù 12 giờ: vừa chiếm ô của môn nào thì 12 giờ sau mới đánh tiếp môn đó.
--  * Môn bỏ hoang: 72 giờ không ai chơi kiếp hay mở Sơn Môn thì mọi ô trừ chính điện về trống.
--  * Tính trận: vkl_priv.sm_tick2 (mỗi phút) tính trước các đoàn sắp tới nơi (trong 70 giây) bằng sm_tran2 = sm_tran + yêu thú
--    + Thiên Trì + ghi thù. Đoàn đã tính xong thì tick cũ bỏ qua (nó chỉ tính trang_thai 'di').

create table if not exists public.vkl_sm_dat (
  ky_id int not null references public.vkl_sm_ky (id) on delete cascade,
  q int not null,
  r int not null,
  loai text not null check (loai in ('linh_mach', 'thien_tri', 'yeu_thu')),
  ten_rieng text,
  yeu_luc int,
  yeu_luc_dat timestamptz,
  primary key (ky_id, q, r)
);
alter table public.vkl_sm_dat enable row level security;

create table if not exists public.vkl_sm_diem (
  ky_id int not null references public.vkl_sm_ky (id) on delete cascade,
  mon_id bigint not null references public.vkl_sm_mon (id) on delete cascade,
  diem numeric not null default 0,
  cap_nhat timestamptz,
  primary key (ky_id, mon_id)
);
alter table public.vkl_sm_diem enable row level security;

create table if not exists public.vkl_sm_thu (
  mon_a bigint not null references public.vkl_sm_mon (id) on delete cascade,
  mon_b bigint not null references public.vkl_sm_mon (id) on delete cascade,
  toi timestamptz not null,
  primary key (mon_a, mon_b)
);
alter table public.vkl_sm_thu enable row level security;

-- cấu hình: giờ bắt đầu và môn hệ thống giữ ô yêu thú
insert into public.vkl_sm_cfg (k, v) values ('dat', jsonb_build_object('bat_dau', '2026-11-20T22:00:00Z', 'diem_thuong', 1, 'diem_lm', 3, 'diem_tt', 5,
  'lm_kv', 2, 'tt_giu', 1.1, 'yeu_n', 8, 'yeu_phuc', 10, 'dai', 0.3333, 'thu_gio', 12, 'bo_hoang_gio', 72))
on conflict (k) do nothing;

create or replace function vkl_priv.sm_dat_on()
returns boolean language sql stable security definer set search_path = '' as $$
  select now() >= coalesce(((select v ->> 'bat_dau' from public.vkl_sm_cfg where k = 'dat'))::timestamptz, 'infinity'::timestamptz);
$$;

create or replace function vkl_priv.sm_yeu_mon()
returns bigint language sql stable security definer set search_path = '' as $$
  select nullif(v ->> 'yeu_mon', '')::bigint from public.vkl_sm_cfg where k = 'dat';
$$;

-- tổng Lực chiến (có trần) của môn, dùng cho dải sức mạnh
create or replace function vkl_priv.sm_mon_lc(p_mon bigint)
returns numeric language sql stable security definer set search_path = '' as $$
  select coalesce(sum(vkl_priv.sm_cap(coalesce(l.lc, 0))), 0)
    from public.vkl_sm_member m left join public.vkl_sm_luc_chien l on l.player_id = m.player_id where m.mon_id = p_mon;
$$;

-- Đặt 12 Linh Mạch + Thiên Trì cho một Kỷ (gọi một lần; ô có chủ giữ nguyên chủ, chỉ đổi loại)
create or replace function vkl_priv.sm_dat_dat(p_ky int)
returns int language plpgsql security definer set search_path = '' as $$
declare v_ten text[] := array['Thanh Ngọc Mạch', 'Bích Lạc Mạch', 'Tử Vân Mạch', 'Kim Tuyền Mạch', 'Hồng Liên Mạch', 'Xích Hà Mạch',
  'Lưu Ly Mạch', 'Thúy Trúc Mạch', 'U Tuyền Mạch', 'Huyền Âm Mạch', 'Minh Hà Mạch', 'Hắc Thủy Mạch']; v_i int := 0; x record;
begin
  insert into public.vkl_sm_dat (ky_id, q, r, loai, ten_rieng) values (p_ky, 0, 0, 'thien_tri', 'Thiên Trì')
  on conflict (ky_id, q, r) do update set loai = 'thien_tri', ten_rieng = 'Thiên Trì';
  for x in
    with t as (
      select t.q, t.r, t.coi, vkl_priv.sm_dist(0, 0, t.q, t.r) vong,
             row_number() over (partition by t.coi, vkl_priv.sm_dist(0, 0, t.q, t.r) order by atan2(t.r + t.q / 2.0, t.q * 0.866), t.q, t.r) k,
             count(*) over (partition by t.coi, vkl_priv.sm_dist(0, 0, t.q, t.r)) n
        from public.vkl_sm_tile t where t.ky_id = p_ky and vkl_priv.sm_dist(0, 0, t.q, t.r) in (3, 4))
    select q, r from t where k in (2, n - 1) order by coi, vong, k
  loop
    v_i := v_i + 1;
    exit when v_i > 12;
    insert into public.vkl_sm_dat (ky_id, q, r, loai, ten_rieng) values (p_ky, x.q, x.r, 'linh_mach', v_ten[v_i])
    on conflict (ky_id, q, r) do update set loai = 'linh_mach', ten_rieng = excluded.ten_rieng, yeu_luc = null;
  end loop;
  return v_i;
end;
$$;

-- Mỗi giờ (phút 0): cộng điểm giữ đất. Chạy lại trong cùng giờ thì bỏ qua.
create or replace function vkl_priv.sm_diem_gio()
returns int language plpgsql security definer set search_path = '' as $$
declare v_ky int := vkl_priv.sm_ky_now(); v_gio text := to_char(date_trunc('hour', now()), 'YYYY-MM-DD"T"HH24'); v_n int; c jsonb;
begin
  if v_ky is null or not vkl_priv.sm_dat_on() then return 0; end if;
  select v into c from public.vkl_sm_cfg where k = 'dat' for update;
  if c ->> 'gio_cuoi' = v_gio then return 0; end if;
  insert into public.vkl_sm_diem (ky_id, mon_id, diem, cap_nhat)
  select v_ky, t.mon_id, sum(case d.loai when 'thien_tri' then (c ->> 'diem_tt')::numeric when 'linh_mach' then (c ->> 'diem_lm')::numeric
                                 else (c ->> 'diem_thuong')::numeric end), now()
    from public.vkl_sm_tile t
    join public.vkl_sm_mon m on m.id = t.mon_id and m.giai_tan_luc is null
    left join public.vkl_sm_dat d on d.ky_id = t.ky_id and d.q = t.q and d.r = t.r
   where t.ky_id = v_ky and t.mon_id is not null
   group by t.mon_id
  on conflict (ky_id, mon_id) do update set diem = public.vkl_sm_diem.diem + excluded.diem, cap_nhat = now();
  get diagnostics v_n = row_count;
  update public.vkl_sm_cfg set v = v || jsonb_build_object('gio_cuoi', v_gio) where k = 'dat';
  return v_n;
end;
$$;

-- 5:00 mỗi ngày: Khí vận Linh Mạch, yêu thú cũ về trống, yêu thú mới, môn bỏ hoang.
create or replace function vkl_priv.sm_dat_5h()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_ky int := vkl_priv.sm_ky_now(); c jsonb; v_yeu bigint; v_day text := vkl_priv.sm_day()::text; x record; v_n_yeu int := 0; v_n_bh int := 0; v_lm int := 0;
begin
  if v_ky is null or not vkl_priv.sm_dat_on() then return jsonb_build_object('bo_qua', true); end if;
  select v into c from public.vkl_sm_cfg where k = 'dat' for update;
  if c ->> 'ngay_cuoi' = v_day then return jsonb_build_object('da_chay', v_day); end if;
  -- môn hệ thống giữ ô yêu thú (đã giải tán nên không hiện ở danh sách, xếp hạng)
  v_yeu := vkl_priv.sm_yeu_mon();
  if v_yeu is null or not exists (select 1 from public.vkl_sm_mon where id = v_yeu) then
    insert into public.vkl_sm_mon (ky_lap, ten1, ten2, ten3, huy_hieu, chinh_dien_hinh, het_han_ky, du_ky, giai_tan_luc)
    values (v_ky, 'Yêu', 'Thú', '', 0, 0, now(), true, now()) returning id into v_yeu;
    update public.vkl_sm_cfg set v = v || jsonb_build_object('yeu_mon', v_yeu) where k = 'dat';
  end if;
  if not exists (select 1 from public.vkl_sm_dat where ky_id = v_ky and loai = 'linh_mach') then perform vkl_priv.sm_dat_dat(v_ky); end if;
  -- Linh Mạch: +2 Khí vận mỗi ô cho môn đang giữ
  for x in select t.mon_id, count(*) n from public.vkl_sm_dat d join public.vkl_sm_tile t on t.ky_id = d.ky_id and t.q = d.q and t.r = d.r
            join public.vkl_sm_mon m on m.id = t.mon_id and m.giai_tan_luc is null
           where d.ky_id = v_ky and d.loai = 'linh_mach' group by t.mon_id loop
    perform vkl_priv.sm_add_kv(x.mon_id, (c ->> 'lm_kv')::int * x.n::int);
    v_lm := v_lm + x.n::int;
  end loop;
  -- yêu thú hôm qua chưa ai đánh: ô về trống
  update public.vkl_sm_tile t set mon_id = null, chinh_dien = false, bao_ho_toi = null, chiem_luc = null
    from public.vkl_sm_dat d where d.ky_id = t.ky_id and d.q = t.q and d.r = t.r and d.loai = 'yeu_thu' and t.ky_id = v_ky and t.mon_id = v_yeu;
  delete from public.vkl_sm_dat where ky_id = v_ky and loai = 'yeu_thu';
  -- yêu thú mới: ô trống vòng 5-6, không có đoàn nào đang tới
  for x in
    select t.q, t.r, vkl_priv.sm_dist(0, 0, t.q, t.r) vong from public.vkl_sm_tile t
     where t.ky_id = v_ky and t.mon_id is null and vkl_priv.sm_dist(0, 0, t.q, t.r) in (5, 6)
       and not exists (select 1 from public.vkl_sm_dat d where d.ky_id = t.ky_id and d.q = t.q and d.r = t.r)
       and not exists (select 1 from public.vkl_sm_chinh h where h.ky_id = t.ky_id and h.toi_q = t.q and h.toi_r = t.r and h.trang_thai in ('tap_hop', 'di'))
     order by random() limit (c ->> 'yeu_n')::int
  loop
    insert into public.vkl_sm_dat (ky_id, q, r, loai, yeu_luc, yeu_luc_dat)
    values (v_ky, x.q, x.r, 'yeu_thu', case when x.vong = 5 then (c ->> 'y5_lo')::int + floor(random() * (((c ->> 'y5_hi')::int - (c ->> 'y5_lo')::int) / 500 + 1)) * 500
                                    else (c ->> 'y6_lo')::int + floor(random() * (((c ->> 'y6_hi')::int - (c ->> 'y6_lo')::int) / 500 + 1)) * 500 end, now());
    update public.vkl_sm_tile set mon_id = v_yeu, chinh_dien = false, chiem_luc = now(), bao_ho_toi = now() + interval '100 years'
     where ky_id = v_ky and q = x.q and r = x.r;
    v_n_yeu := v_n_yeu + 1;
  end loop;
  -- môn bỏ hoang 72 giờ
  for x in
    select m.id from public.vkl_sm_mon m
     where m.ky_lap = v_ky and m.giai_tan_luc is null and m.cam_co_luc is not null
       and exists (select 1 from public.vkl_sm_tile t where t.ky_id = v_ky and t.mon_id = m.id and not t.chinh_dien)
       and coalesce((select max(greatest(coalesce(mb.hoat_dong, '-infinity'), coalesce(mb.vao_luc, '-infinity'),
                       coalesce((select max(l.created_at) from public.vkl_lives l where l.player_id = mb.player_id and l.created_at > now() - interval '4 days'), '-infinity')))
                       from public.vkl_sm_member mb where mb.mon_id = m.id), '-infinity') < now() - make_interval(hours => (c ->> 'bo_hoang_gio')::int)
  loop
    update public.vkl_sm_member set dung_q = null, dung_r = null where mon_id = x.id;
    update public.vkl_sm_tile set mon_id = null, bao_ho_toi = null, chiem_luc = null where ky_id = v_ky and mon_id = x.id and not chinh_dien;
    insert into public.vkl_sm_bao (ky_id, loai, mon_a, noi_dung) values (v_ky, 'bo_hoang', x.id, jsonb_build_object('gio', (c ->> 'bo_hoang_gio')::int));
    v_n_bh := v_n_bh + 1;
  end loop;
  update public.vkl_sm_cfg set v = v || jsonb_build_object('ngay_cuoi', v_day) where k = 'dat';
  return jsonb_build_object('linh_mach', v_lm, 'yeu_thu', v_n_yeu, 'bo_hoang', v_n_bh);
end;
$$;

-- Xuất chinh mới: dải sức mạnh, thù 12 giờ, đánh được ô yêu thú. Ô thường vẫn đi qua vkl_sm_march cũ.
create or replace function public.vkl_sm_march2(p_token uuid, p_q integer, p_r integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_mon public.vkl_sm_mon; t public.vkl_sm_tile; d public.vkl_sm_dat;
  v_tu record; v_th timestamptz; v_toi timestamptz; v_id bigint; v_yeu bigint := vkl_priv.sm_yeu_mon(); c jsonb; v_thu timestamptz;
begin
  if not vkl_priv.sm_dat_on() then return public.vkl_sm_march(p_token, p_q, p_r); end if;
  select v into c from public.vkl_sm_cfg where k = 'dat';
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id;
  select * into t from public.vkl_sm_tile where ky_id = v_mon.ky_lap and q = p_q and r = p_r;
  if t.ky_id is null then raise exception 'SM_O'; end if;
  select * into d from public.vkl_sm_dat where ky_id = t.ky_id and q = p_q and r = p_r;
  if t.mon_id is not null and t.mon_id <> v_mon.id and t.mon_id is distinct from v_yeu then
    select toi into v_thu from public.vkl_sm_thu where mon_a = v_mon.id and mon_b = t.mon_id and toi > now();
    if v_thu is not null then raise exception 'SM_THU'; end if;
    if d.loai is null and vkl_priv.sm_mon_lc(t.mon_id) < vkl_priv.sm_mon_lc(v_mon.id) * (c ->> 'dai')::numeric then raise exception 'SM_NGOAI_DAI'; end if;
  end if;
  if t.mon_id is distinct from v_yeu or v_yeu is null then return public.vkl_sm_march(p_token, p_q, p_r); end if;
  -- ô yêu thú: như vkl_sm_march nhưng bỏ qua bảo hộ của yêu thú
  if m.chuc not in ('chu', 'lao') then raise exception 'SM_QUYEN'; end if;
  perform 1 from public.vkl_sm_mon where id = m.mon_id for update;
  if (select count(*) from public.vkl_sm_tile where mon_id = v_mon.id) >= vkl_priv.sm_o_max(v_mon.id) then raise exception 'SM_DU_O'; end if;
  if exists (select 1 from public.vkl_sm_chinh where mon_id = v_mon.id and trang_thai in ('tap_hop', 'di')) then raise exception 'SM_DANG_CHINH'; end if;
  select q, r into v_tu from public.vkl_sm_tile where mon_id = v_mon.id and vkl_priv.sm_dist(q, r, p_q, p_r) = 1 limit 1;
  if v_tu is null then raise exception 'SM_KHONG_KE'; end if;
  if m.nghi_toi > now() then raise exception 'SM_NGHI'; end if;
  v_th := now() + make_interval(mins => vkl_priv.sm_cfg('gio', 'tap_hop_phut')::int);
  v_toi := v_th + make_interval(mins => vkl_priv.sm_cfg('gio', 'di_phut')::int);
  insert into public.vkl_sm_chinh (ky_id, mon_id, nguoi_phat, tu_q, tu_r, toi_q, toi_r, tap_hop_toi, toi_noi_luc)
  values (v_mon.ky_lap, v_mon.id, v_me, v_tu.q, v_tu.r, p_q, p_r, v_th, v_toi) returning id into v_id;
  insert into public.vkl_sm_chinh_theo (chinh_id, player_id) values (v_id, v_me);
  return jsonb_build_object('id', v_id, 'tap_hop_toi', v_th, 'toi_noi_luc', v_toi, 'yeu', true);
end;
$$;

-- Tính trận mới: như sm_tran, thêm yêu thú, Thiên Trì, thù 12 giờ.
create or replace function vkl_priv.sm_tran2(p_chinh bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  c public.vkl_sm_chinh; t public.vkl_sm_tile; d public.vkl_sm_dat; cf jsonb; v_yeu bigint := vkl_priv.sm_yeu_mon();
  v_atk numeric; v_n_atk int; v_def numeric := 0; v_n_def int := 0; v_win boolean; v_kq jsonb;
  v_kv_a numeric; v_kv_b numeric := 0; v_dem boolean; v_mot boolean := false; v_san numeric;
begin
  select v into cf from public.vkl_sm_cfg where k = 'dat';
  select * into c from public.vkl_sm_chinh where id = p_chinh for update;
  if c.trang_thai <> 'di' then return null; end if;
  select * into t from public.vkl_sm_tile where ky_id = c.ky_id and q = c.toi_q and r = c.toi_r for update;
  select * into d from public.vkl_sm_dat where ky_id = c.ky_id and q = c.toi_q and r = c.toi_r;
  select count(*)::int, coalesce(sum(vkl_priv.sm_cap(coalesce(l.lc, 0))), 0) into v_n_atk, v_atk
    from public.vkl_sm_chinh_theo th
    join public.vkl_sm_member m on m.player_id = th.player_id and m.mon_id = c.mon_id
    left join public.vkl_sm_luc_chien l on l.player_id = th.player_id
   where th.chinh_id = c.id;
  v_kv_a := vkl_priv.sm_kv_bonus(c.mon_id, c.toi_noi_luc);
  v_atk := v_atk * (1 + v_kv_a);
  v_dem := extract(hour from c.toi_noi_luc at time zone 'Asia/Ho_Chi_Minh') < 7;

  if exists (select 1 from public.vkl_sm_mon where id = c.mon_id and giai_tan_luc is not null) or v_n_atk = 0 then
    v_kq := jsonb_build_object('kq', 'huy', 'ly_do', 'khong_nguoi');
  elsif t.mon_id = c.mon_id then
    v_kq := jsonb_build_object('kq', 'huy', 'ly_do', 'da_cua_ta');
  elsif (select count(*) from public.vkl_sm_tile where ky_id = c.ky_id and mon_id = c.mon_id) >= vkl_priv.sm_o_max(c.mon_id) then
    v_kq := jsonb_build_object('kq', 'huy', 'ly_do', 'du_o');
  elsif v_yeu is not null and t.mon_id = v_yeu then
    -- yêu thú: lực giữ cố định, không sân nhà, không đêm
    v_def := coalesce(d.yeu_luc, 0);
    v_win := v_atk > v_def;
    if v_win then
      update public.vkl_sm_tile set mon_id = c.mon_id, chinh_dien = false, chiem_luc = now(),
        bao_ho_toi = now() + make_interval(hours => vkl_priv.sm_cfg('gio', 'bao_ho_gio')::int)
       where ky_id = t.ky_id and q = t.q and r = t.r;
      delete from public.vkl_sm_dat where ky_id = t.ky_id and q = t.q and r = t.r and loai = 'yeu_thu';
      perform vkl_priv.sm_chon_cd(c.ky_id, c.mon_id);
      insert into public.vkl_gift (to_player, from_player, kind, amount, note)
      select p.username, 'son_mon', 'phuc', (cf ->> 'yeu_phuc')::int, 'Trừ yêu thú ở ' || t.ten
        from public.vkl_sm_chinh_theo th join public.vkl_players p on p.id = th.player_id where th.chinh_id = c.id;
    else
      update public.vkl_sm_member m set nghi_toi = now() + make_interval(hours => vkl_priv.sm_cfg('gio', 'nghi_gio')::int)
        from public.vkl_sm_chinh_theo th where th.chinh_id = c.id and th.player_id = m.player_id;
    end if;
    v_kq := jsonb_build_object('kq', case when v_win then 'thang' else 'thua' end, 'yeu', true,
      'atk', round(v_atk), 'def', round(v_def), 'n_atk', v_n_atk, 'n_def', 0, 'kv_a', v_kv_a, 'mon_b', null);
  elsif t.bao_ho_toi is not null and t.bao_ho_toi > c.toi_noi_luc and t.mon_id is not null then
    v_kq := jsonb_build_object('kq', 'huy', 'ly_do', 'bao_ho', 'toi', t.bao_ho_toi);
  elsif t.mon_id is null then
    update public.vkl_sm_tile set mon_id = c.mon_id, chinh_dien = false, bao_ho_toi = null, chiem_luc = now()
     where ky_id = t.ky_id and q = t.q and r = t.r;
    perform vkl_priv.sm_chon_cd(c.ky_id, c.mon_id);
    v_kq := jsonb_build_object('kq', 'cam_co', 'n_atk', v_n_atk);
  else
    select g.n, g.lc into v_n_def, v_def from vkl_priv.sm_giu(c.ky_id, t.mon_id, t.q, t.r) g;
    v_kv_b := vkl_priv.sm_kv_bonus(t.mon_id, c.toi_noi_luc);
    v_mot := (select count(*) from public.vkl_sm_tile where ky_id = c.ky_id and mon_id = t.mon_id) = 1;
    v_san := vkl_priv.sm_cfg('tran', 'san_nha');
    v_def := v_def * v_san * (1 + v_kv_b) * (case when v_dem then vkl_priv.sm_cfg('tran', 'dem') else 1 end)
             * (case when v_mot then vkl_priv.sm_cfg('tran', 'mot_o') else 1 end)
             * (case when d.loai = 'thien_tri' then (cf ->> 'tt_giu')::numeric else 1 end);
    v_win := v_atk > v_def;
    if v_win then
      update public.vkl_sm_member set dung_q = null, dung_r = null
       where mon_id = t.mon_id and dung_q = t.q and dung_r = t.r;
      update public.vkl_sm_tile set mon_id = c.mon_id, chinh_dien = false, chiem_luc = now(),
        bao_ho_toi = now() + make_interval(hours => vkl_priv.sm_cfg('gio', 'bao_ho_gio')::int)
       where ky_id = t.ky_id and q = t.q and r = t.r;
      perform vkl_priv.sm_chon_cd(c.ky_id, t.mon_id);
      perform vkl_priv.sm_chon_cd(c.ky_id, c.mon_id);
      insert into public.vkl_sm_thu (mon_a, mon_b, toi) values (c.mon_id, t.mon_id, now() + make_interval(hours => (cf ->> 'thu_gio')::int))
      on conflict (mon_a, mon_b) do update set toi = excluded.toi;
      if not exists (select 1 from public.vkl_sm_tile where ky_id = c.ky_id and mon_id = t.mon_id) then
        insert into public.vkl_sm_bao (ky_id, loai, mon_a, mon_b, q, r) values (c.ky_id, 'mat_het', t.mon_id, c.mon_id, t.q, t.r);
      end if;
    else
      update public.vkl_sm_member m set nghi_toi = now() + make_interval(hours => vkl_priv.sm_cfg('gio', 'nghi_gio')::int)
        from public.vkl_sm_chinh_theo th where th.chinh_id = c.id and th.player_id = m.player_id;
    end if;
    v_kq := jsonb_build_object('kq', case when v_win then 'thang' else 'thua' end,
      'atk', round(v_atk), 'def', round(v_def), 'n_atk', v_n_atk, 'n_def', v_n_def,
      'kv_a', v_kv_a, 'kv_b', v_kv_b, 'dem', v_dem, 'mot_o', v_mot, 'mon_b', t.mon_id, 'thien_tri', d.loai = 'thien_tri');
    if (select count(*) from public.vkl_sm_bao where loai = 'tran' and mon_a = c.mon_id and mon_b = t.mon_id and luc > now() - interval '1 day') = 5
       and not exists (select 1 from public.vkl_sm_bao where loai = 'tran' and mon_a = t.mon_id and mon_b = c.mon_id and luc > now() - interval '1 day') then
      perform vkl_priv.sm_flag('mot_chieu', jsonb_build_object('a', c.mon_id, 'b', t.mon_id));
    end if;
  end if;

  update public.vkl_sm_chinh set trang_thai = case when v_kq ->> 'kq' = 'huy' then 'huy' else 'xong' end, ket_qua = v_kq where id = c.id;
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, mon_b, q, r, noi_dung)
  values (c.ky_id, case when v_kq ->> 'kq' = 'cam_co' then 'cam_co' when v_kq ->> 'kq' = 'huy' then 'huy' else 'tran' end,
          c.mon_id, case when v_yeu is not null and t.mon_id = v_yeu then null else t.mon_id end, t.q, t.r, v_kq || jsonb_build_object('ten_o', t.ten, 'chinh', c.id));
  return v_kq;
end;
$$;

-- Mỗi phút: tính trước các đoàn sắp tới nơi (trong 70 giây) bằng sm_tran2, để tick cũ không cắm cờ thẳng vào ô yêu thú.
-- Chỉ tính đoàn đã ở trạng thái 'di' (tick cũ đã chuyển từ tập hợp sang đi).
create or replace function vkl_priv.sm_tick2()
returns int language plpgsql security definer set search_path = '' as $$
declare r record; v_n int := 0;
begin
  if not vkl_priv.sm_dat_on() then return 0; end if;
  for r in select id from public.vkl_sm_chinh where trang_thai = 'di' and toi_noi_luc <= now() + interval '70 seconds'
            order by toi_noi_luc, id for update skip locked loop
    perform vkl_priv.sm_tran2(r.id);
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

-- Xếp hạng Kỷ theo Điểm giữ đất (bằng điểm xét số ô rồi Khí vận), kèm điểm mỗi giờ hiện tại.
create or replace function public.vkl_sm_rank2(p_ky integer)
returns jsonb language sql stable security definer set search_path = '' as $$
  with k as (select id, bat_dau, ket_thuc from public.vkl_sm_ky
             where id = coalesce(p_ky, vkl_priv.sm_ky_now(), (select max(id) from public.vkl_sm_ky))),
  cf as (select v from public.vkl_sm_cfg where k = 'dat'),
  x as (select m.id, m.ten, m.huy_hieu,
          (select count(*) from public.vkl_sm_tile t where t.mon_id = m.id and t.ky_id = k.id) o,
          (select coalesce(sum(n.khi_van), 0) from public.vkl_sm_ngay n where n.mon_id = m.id
             and n.ngay between vkl_priv.sm_day(k.bat_dau) and vkl_priv.sm_day(k.ket_thuc)) kv,
          vkl_priv.sm_mon_n(m.id) n,
          coalesce((select round(dm.diem) from public.vkl_sm_diem dm where dm.ky_id = k.id and dm.mon_id = m.id), 0) diem,
          (select coalesce(sum(case d.loai when 'thien_tri' then (cf.v ->> 'diem_tt')::int when 'linh_mach' then (cf.v ->> 'diem_lm')::int
                    else (cf.v ->> 'diem_thuong')::int end), 0)
             from public.vkl_sm_tile t cross join cf left join public.vkl_sm_dat d on d.ky_id = t.ky_id and d.q = t.q and d.r = t.r
            where t.mon_id = m.id and t.ky_id = k.id) gio
        from public.vkl_sm_mon m join k on k.id = m.ky_lap where m.giai_tan_luc is null)
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'ten', ten, 'huy_hieu', huy_hieu, 'o', o, 'kv', kv, 'n', n, 'diem', diem, 'gio', gio)
         order by diem desc, o desc, kv desc, id), '[]') from x;
$$;

-- Bản đồ kèm loại ô (Linh Mạch, Thiên Trì, yêu thú và lực giữ), mã môn yêu thú, giờ bắt đầu tính điểm.
create or replace function public.vkl_sm_map2(p_ky integer)
returns jsonb language sql stable security definer set search_path = '' as $$
  select public.vkl_sm_map(p_ky) || jsonb_build_object(
    'dat', (select coalesce(jsonb_agg(jsonb_build_array(d.q, d.r, d.loai, d.ten_rieng, d.yeu_luc)), '[]')
              from public.vkl_sm_dat d where d.ky_id = coalesce(p_ky, vkl_priv.sm_ky_now(), (select max(id) from public.vkl_sm_ky))),
    'yeu_mon', vkl_priv.sm_yeu_mon(),
    'dat_tu', (select v ->> 'bat_dau' from public.vkl_sm_cfg where k = 'dat'));
$$;

-- Thù và dải sức mạnh của môn ta với từng môn khác (giao diện ghi lý do ngay trên ô)
create or replace function public.vkl_sm_dai(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_mon bigint; v_lc numeric; c jsonb;
begin
  select mon_id into v_mon from public.vkl_sm_member where player_id = v_me;
  if v_mon is null then return '{}'::jsonb; end if;
  select v into c from public.vkl_sm_cfg where k = 'dat';
  v_lc := vkl_priv.sm_mon_lc(v_mon);
  return jsonb_build_object('lc', round(v_lc), 'dai', (c ->> 'dai')::numeric,
    'ngoai', coalesce((select jsonb_agg(m.id) from public.vkl_sm_mon m
                        where m.ky_lap = vkl_priv.sm_ky_now() and m.giai_tan_luc is null and m.id <> v_mon
                          and vkl_priv.sm_mon_lc(m.id) < v_lc * (c ->> 'dai')::numeric), '[]'),
    'thu', coalesce((select jsonb_object_agg(t.mon_b, t.toi) from public.vkl_sm_thu t where t.mon_a = v_mon and t.toi > now()), '{}'));
end;
$$;

revoke all on function public.vkl_sm_march2(uuid, integer, integer) from public;
revoke all on function public.vkl_sm_rank2(integer) from public;
revoke all on function public.vkl_sm_map2(integer) from public;
revoke all on function public.vkl_sm_dai(uuid) from public;
grant execute on function public.vkl_sm_march2(uuid, integer, integer) to anon, authenticated;
grant execute on function public.vkl_sm_rank2(integer) to anon, authenticated;
grant execute on function public.vkl_sm_map2(integer) to anon, authenticated;
grant execute on function public.vkl_sm_dai(uuid) to anon, authenticated;
revoke all on function vkl_priv.sm_dat_on() from public;
revoke all on function vkl_priv.sm_yeu_mon() from public;
revoke all on function vkl_priv.sm_mon_lc(bigint) from public;
revoke all on function vkl_priv.sm_dat_dat(int) from public;
revoke all on function vkl_priv.sm_diem_gio() from public;
revoke all on function vkl_priv.sm_dat_5h() from public;
revoke all on function vkl_priv.sm_tran2(bigint) from public;
revoke all on function vkl_priv.sm_tick2() from public;

select cron.schedule('vkl_sm_diem_gio', '0 * * * *', 'select vkl_priv.sm_diem_gio()');
select cron.schedule('vkl_sm_dat_5h', '0 22 * * *', 'select vkl_priv.sm_dat_5h()');
select cron.schedule('vkl_sm_tick2', '* * * * *', 'select vkl_priv.sm_tick2()');

-- Chỉnh sau mô phỏng 19/11 (người trong môn trung vị 6.357 Lực chiến có trần, mỗi đoàn trước giờ chỉ 1 người theo):
-- lực yêu thú 1.500-6.000 thì một người cũng thắng. Đổi sang cần 2-5 người.
update public.vkl_sm_cfg set v = v || '{"y5_lo":10000,"y5_hi":18000,"y6_lo":18000,"y6_hi":30000}' where k = 'dat';
