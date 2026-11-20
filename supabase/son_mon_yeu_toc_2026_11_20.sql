-- 20/11 (góp ý Chí Triệu Kiên qua Fanpage, Tyler duyệt "làm luôn"): Linh Mạch có trữ lượng, yêu thú thành thế lực tự đánh ô, thú triều.
-- Không sửa hàm cũ; thêm 1 cột, 1 bảng, hàm và cron mới.
--  * Linh Mạch: mỗi mạch có trữ lượng 120 điểm. Mỗi giờ môn giữ mạch nhận +3 điểm như cũ và mạch hao đi 3.
--    Cạn thì ô thành ô thường (môn vẫn giữ ô), mạch dời tới một ô trống ngẫu nhiên vòng 2-5, cách mọi chính điện từ 2 ô.
--  * Yêu tộc: theo đợt ban ngày (ngày thường 9, 12, 15, 18, 21 giờ; thú triều thứ Tư và thứ Bảy 8-22 giờ, 2 giờ một đợt).
--    Trước mỗi đợt 1 giờ, yêu thú báo trước ô sẽ đánh (cách ô yêu thú tối đa 2 ô). Tới giờ: lực yêu thú so với sức giữ của ô
--    (người đứng giữ, sân nhà, Khí vận như trận thường). Thắng: ô thành ô yêu thú (lực 60% lực đánh, tối thiểu 8.000).
--    Thua: yêu thú về ổ yếu đi còn 75%, mỗi người đứng giữ +5 phúc duyên. Diệt ổ yêu thú trước giờ đánh thì đợt đó tan.
--  * Không bắt nạt (Tyler): yêu thú chỉ đánh môn có từ 4 ô VÀ tổng Lực chiến từ một nửa môn mạnh nhất. Không đánh chính điện,
--    Linh Mạch, Thiên Trì, ô đang bảo hộ. Mỗi môn cách 6 giờ mới bị đánh lại (thú triều 3 giờ). Ưu tiên môn nhiều Điểm Kỷ.
--  * Yêu thú lan: đợt nào ổ yêu không có mục tiêu thì có thể chiếm 1 ô trống kề bên (lực 80%), tổng ô yêu tối đa 16 (thú triều 24).
--    5:00 sáng hàm cũ sm_dat_5h vẫn dọn hết ô yêu thú về trống và thả yêu thú mới.

alter table public.vkl_sm_dat add column if not exists tru_luong int;

create table if not exists public.vkl_sm_yeu_cong (
  id bigserial primary key,
  ky_id int not null references public.vkl_sm_ky (id) on delete cascade,
  tu_q int not null, tu_r int not null,
  q int not null, r int not null,
  mon_id bigint not null references public.vkl_sm_mon (id) on delete cascade,
  luc int not null,
  trieu boolean not null default false,
  bao_luc timestamptz not null default now(),
  toi_luc timestamptz not null,
  trang_thai text not null default 'cho' check (trang_thai in ('cho', 'xong', 'huy')),
  ket_qua jsonb
);
create index if not exists vkl_sm_yeu_cong_cho on public.vkl_sm_yeu_cong (ky_id, trang_thai, toi_luc);
create index if not exists vkl_sm_yeu_cong_mon on public.vkl_sm_yeu_cong (mon_id, bao_luc);
alter table public.vkl_sm_yeu_cong enable row level security;

update public.vkl_sm_cfg set v = v || jsonb_build_object(
  'lm_tru', 120, 'trieu_ngay', jsonb_build_array(3, 6), 'yeu_gio', jsonb_build_array(9, 12, 15, 18, 21),
  'yeu_gio_trieu', jsonb_build_array(8, 10, 12, 14, 16, 18, 20, 22), 'trieu_he', 1.3, 'yeu_max', 16, 'yeu_max_trieu', 24,
  'yeu_nguong', 0.5, 'yeu_o_min', 4, 'yeu_cach_gio', 6, 'yeu_cach_gio_trieu', 3, 'yeu_giu_phuc', 5,
  'yeu_luot', 2, 'yeu_luot_trieu', 5, 'yeu_lan', 2, 'yeu_lan_trieu', 4)
where k = 'dat';

update public.vkl_sm_dat set tru_luong = 120 where loai = 'linh_mach' and tru_luong is null;

create or replace function vkl_priv.sm_r500(p numeric, p_min int)
returns int language sql immutable set search_path = '' as $$
  select greatest(p_min, (round(p / 500) * 500)::int);
$$;

-- hôm nay (giờ VN) có phải thú triều không
create or replace function vkl_priv.sm_trieu(p_at timestamptz default now())
returns boolean language sql stable security definer set search_path = '' as $$
  select extract(isodow from p_at at time zone 'Asia/Ho_Chi_Minh')::int
         in (select jsonb_array_elements_text(v -> 'trieu_ngay')::int from public.vkl_sm_cfg where k = 'dat');
$$;

-- Mỗi giờ (phút 2, sau sm_diem_gio): Linh Mạch hao trữ lượng; cạn thì dời.
create or replace function vkl_priv.sm_lm_gio()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_ky int := vkl_priv.sm_ky_now(); c jsonb; v_gio text := to_char(date_trunc('hour', now()), 'YYYY-MM-DD"T"HH24');
  v_yeu bigint := vkl_priv.sm_yeu_mon(); x record; m record; v_can int := 0;
begin
  if v_ky is null or not vkl_priv.sm_dat_on() then return jsonb_build_object('bo_qua', true); end if;
  select v into c from public.vkl_sm_cfg where k = 'dat' for update;
  if c ->> 'gio_lm' = v_gio then return jsonb_build_object('da_chay', v_gio); end if;
  update public.vkl_sm_dat d set tru_luong = coalesce(d.tru_luong, (c ->> 'lm_tru')::int) - (c ->> 'diem_lm')::int
    from public.vkl_sm_tile t join public.vkl_sm_mon mo on mo.id = t.mon_id and mo.giai_tan_luc is null
   where d.ky_id = v_ky and d.loai = 'linh_mach' and t.ky_id = d.ky_id and t.q = d.q and t.r = d.r and t.mon_id is distinct from v_yeu;
  for x in select d.q, d.r, d.ten_rieng, t.ten ten_o, t.mon_id from public.vkl_sm_dat d
             join public.vkl_sm_tile t on t.ky_id = d.ky_id and t.q = d.q and t.r = d.r
            where d.ky_id = v_ky and d.loai = 'linh_mach' and d.tru_luong <= 0 loop
    delete from public.vkl_sm_dat where ky_id = v_ky and q = x.q and r = x.r;
    select t.q, t.r, t.ten into m from public.vkl_sm_tile t
     where t.ky_id = v_ky and t.mon_id is null and vkl_priv.sm_dist(0, 0, t.q, t.r) between 2 and 5
       and not exists (select 1 from public.vkl_sm_dat d where d.ky_id = t.ky_id and d.q = t.q and d.r = t.r)
       and not exists (select 1 from public.vkl_sm_tile cd where cd.ky_id = t.ky_id and cd.chinh_dien and vkl_priv.sm_dist(cd.q, cd.r, t.q, t.r) < 2)
       and not exists (select 1 from public.vkl_sm_chinh h where h.ky_id = t.ky_id and h.toi_q = t.q and h.toi_r = t.r and h.trang_thai in ('tap_hop', 'di'))
     order by random() limit 1;
    if m.q is null then
      select t.q, t.r, t.ten into m from public.vkl_sm_tile t
       where t.ky_id = v_ky and t.mon_id is null and vkl_priv.sm_dist(0, 0, t.q, t.r) between 1 and 6
         and not exists (select 1 from public.vkl_sm_dat d where d.ky_id = t.ky_id and d.q = t.q and d.r = t.r)
       order by random() limit 1;
    end if;
    if m.q is not null then
      insert into public.vkl_sm_dat (ky_id, q, r, loai, ten_rieng, tru_luong) values (v_ky, m.q, m.r, 'linh_mach', x.ten_rieng, (c ->> 'lm_tru')::int);
    end if;
    insert into public.vkl_sm_bao (ky_id, loai, mon_a, q, r, noi_dung)
    values (v_ky, 'lm_doi', x.mon_id, x.q, x.r, jsonb_build_object('lm', x.ten_rieng, 'ten_o', x.ten_o, 'moi_o', m.ten, 'moi_q', m.q, 'moi_r', m.r));
    v_can := v_can + 1;
  end loop;
  update public.vkl_sm_cfg set v = v || jsonb_build_object('gio_lm', v_gio) where k = 'dat';
  return jsonb_build_object('can', v_can);
end;
$$;

-- Tính một đợt yêu thú đã tới giờ
create or replace function vkl_priv.sm_yeu_danh(p_id bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.vkl_sm_yeu_cong; t public.vkl_sm_tile; s public.vkl_sm_dat; cf jsonb; v_yeu bigint := vkl_priv.sm_yeu_mon();
  v_def numeric; v_n int; v_kv numeric; v_mot boolean; v_win boolean; v_kq jsonb;
begin
  select v into cf from public.vkl_sm_cfg where k = 'dat';
  select * into a from public.vkl_sm_yeu_cong where id = p_id for update;
  if a.trang_thai <> 'cho' then return null; end if;
  select * into t from public.vkl_sm_tile where ky_id = a.ky_id and q = a.q and r = a.r for update;
  select * into s from public.vkl_sm_dat where ky_id = a.ky_id and q = a.tu_q and r = a.tu_r and loai = 'yeu_thu';
  if s.q is null or not exists (select 1 from public.vkl_sm_tile where ky_id = a.ky_id and q = a.tu_q and r = a.tu_r and mon_id = v_yeu) then
    v_kq := jsonb_build_object('kq', 'huy', 'ly_do', 'o_yeu_mat');
  elsif t.mon_id is distinct from a.mon_id then
    v_kq := jsonb_build_object('kq', 'huy', 'ly_do', 'doi_chu');
  elsif t.chinh_dien or exists (select 1 from public.vkl_sm_dat where ky_id = a.ky_id and q = a.q and r = a.r) then
    v_kq := jsonb_build_object('kq', 'huy', 'ly_do', 'o_dac_biet');
  elsif exists (select 1 from public.vkl_sm_mon where id = a.mon_id and giai_tan_luc is not null) then
    v_kq := jsonb_build_object('kq', 'huy', 'ly_do', 'giai_tan');
  else
    select g.n, g.lc into v_n, v_def from vkl_priv.sm_giu(a.ky_id, a.mon_id, a.q, a.r) g;
    v_kv := vkl_priv.sm_kv_bonus(a.mon_id, now());
    v_mot := (select count(*) from public.vkl_sm_tile where ky_id = a.ky_id and mon_id = a.mon_id) = 1;
    v_def := v_def * vkl_priv.sm_cfg('tran', 'san_nha') * (1 + v_kv) * (case when v_mot then vkl_priv.sm_cfg('tran', 'mot_o') else 1 end);
    v_win := a.luc > v_def;
    if v_win then
      update public.vkl_sm_member set dung_q = null, dung_r = null where mon_id = a.mon_id and dung_q = a.q and dung_r = a.r;
      update public.vkl_sm_tile set mon_id = v_yeu, chinh_dien = false, chiem_luc = now(), bao_ho_toi = now() + interval '100 years'
       where ky_id = a.ky_id and q = a.q and r = a.r;
      insert into public.vkl_sm_dat (ky_id, q, r, loai, yeu_luc, yeu_luc_dat)
      values (a.ky_id, a.q, a.r, 'yeu_thu', vkl_priv.sm_r500(a.luc * 0.6, 8000), now());
      perform vkl_priv.sm_chon_cd(a.ky_id, a.mon_id);
    else
      insert into public.vkl_gift (to_player, from_player, kind, amount, note)
      select p.username, 'son_mon', 'phuc', (cf ->> 'yeu_giu_phuc')::int, 'Giữ ' || t.ten || ' trước yêu thú'
        from public.vkl_sm_member m join public.vkl_players p on p.id = m.player_id
       where m.mon_id = a.mon_id and m.dung_q = a.q and m.dung_r = a.r and (m.nghi_toi is null or m.nghi_toi <= now());
      update public.vkl_sm_dat set yeu_luc = vkl_priv.sm_r500(yeu_luc * 0.75, 5000)
       where ky_id = a.ky_id and q = a.tu_q and r = a.tu_r and loai = 'yeu_thu';
    end if;
    v_kq := jsonb_build_object('kq', case when v_win then 'thang' else 'thua' end, 'yeu_cong', true, 'trieu', a.trieu,
      'atk', a.luc, 'def', round(v_def), 'n_def', v_n, 'kv_b', v_kv, 'mot_o', v_mot, 'mon_b', a.mon_id);
    insert into public.vkl_sm_bao (ky_id, loai, mon_a, mon_b, q, r, noi_dung)
    values (a.ky_id, 'tran', v_yeu, a.mon_id, a.q, a.r, v_kq || jsonb_build_object('ten_o', t.ten, 'yeu_cong_id', a.id));
  end if;
  update public.vkl_sm_yeu_cong set trang_thai = case when v_kq ->> 'kq' = 'huy' then 'huy' else 'xong' end, ket_qua = v_kq where id = a.id;
  return v_kq;
end;
$$;

-- Mỗi 5 phút: tính các đợt đã tới giờ; đầu giờ trước mỗi đợt thì yêu thú báo mục tiêu và lan ra ô trống.
create or replace function vkl_priv.sm_yeu_tick()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_ky int := vkl_priv.sm_ky_now(); c jsonb; v_yeu bigint := vkl_priv.sm_yeu_mon(); x record; v_tinh int := 0; v_bao int := 0; v_lan int := 0;
  v_vn timestamp := now() at time zone 'Asia/Ho_Chi_Minh'; v_trieu boolean; v_gio int; v_dot text; v_toi timestamptz;
  v_top numeric; v_luot int; v_lan_max int; v_max int; v_cach int; v_dung_tu text[] := '{}'; v_dung_mon bigint[] := '{}';
begin
  if v_ky is null or not vkl_priv.sm_dat_on() or v_yeu is null then return jsonb_build_object('bo_qua', true); end if;
  for x in select id from public.vkl_sm_yeu_cong where ky_id = v_ky and trang_thai = 'cho' and toi_luc <= now() order by toi_luc, id loop
    perform vkl_priv.sm_yeu_danh(x.id);
    v_tinh := v_tinh + 1;
  end loop;

  select v into c from public.vkl_sm_cfg where k = 'dat' for update;
  v_trieu := vkl_priv.sm_trieu(now());
  v_gio := extract(hour from v_vn)::int + 1;  -- đợt tới lúc v_gio giờ (VN)
  if not (v_gio in (select jsonb_array_elements_text(c -> case when v_trieu then 'yeu_gio_trieu' else 'yeu_gio' end)::int)) then
    return jsonb_build_object('tinh', v_tinh);
  end if;
  v_dot := to_char(v_vn, 'YYYY-MM-DD') || 'T' || v_gio;
  if c ->> 'yeu_dot' = v_dot then return jsonb_build_object('tinh', v_tinh); end if;
  update public.vkl_sm_cfg set v = v || jsonb_build_object('yeu_dot', v_dot) where k = 'dat';
  v_toi := date_trunc('hour', now()) + interval '1 hour';
  v_luot := (c ->> case when v_trieu then 'yeu_luot_trieu' else 'yeu_luot' end)::int;
  v_lan_max := (c ->> case when v_trieu then 'yeu_lan_trieu' else 'yeu_lan' end)::int;
  v_max := (c ->> case when v_trieu then 'yeu_max_trieu' else 'yeu_max' end)::int;
  v_cach := (c ->> case when v_trieu then 'yeu_cach_gio_trieu' else 'yeu_cach_gio' end)::int;
  select max(vkl_priv.sm_mon_lc(m.id)) into v_top from public.vkl_sm_mon m
   where m.giai_tan_luc is null and m.id <> v_yeu and exists (select 1 from public.vkl_sm_tile t where t.ky_id = v_ky and t.mon_id = m.id);

  -- chọn mục tiêu: môn đủ mạnh, nhiều điểm trước; mỗi ổ yêu và mỗi môn tối đa một lần mỗi đợt
  for x in
    with mon as (
      select m.id, coalesce(dm.diem, 0) diem from public.vkl_sm_mon m
        left join public.vkl_sm_diem dm on dm.ky_id = v_ky and dm.mon_id = m.id
       where m.giai_tan_luc is null and m.id <> v_yeu
         and (select count(*) from public.vkl_sm_tile t where t.ky_id = v_ky and t.mon_id = m.id) >= (c ->> 'yeu_o_min')::int
         and vkl_priv.sm_mon_lc(m.id) >= coalesce(v_top, 0) * (c ->> 'yeu_nguong')::numeric
         and not exists (select 1 from public.vkl_sm_yeu_cong y where y.mon_id = m.id and y.trang_thai <> 'huy'
                           and y.toi_luc > v_toi - make_interval(hours => v_cach))),
    nguon as (
      select d.q, d.r, d.yeu_luc from public.vkl_sm_dat d join public.vkl_sm_tile t on t.ky_id = d.ky_id and t.q = d.q and t.r = d.r and t.mon_id = v_yeu
       where d.ky_id = v_ky and d.loai = 'yeu_thu')
    select n.q tu_q, n.r tu_r, n.yeu_luc, t.q, t.r, t.mon_id, mon.diem
      from nguon n
      join public.vkl_sm_tile t on t.ky_id = v_ky and vkl_priv.sm_dist(n.q, n.r, t.q, t.r) <= 2
      join mon on mon.id = t.mon_id
     where not t.chinh_dien
       and (t.bao_ho_toi is null or t.bao_ho_toi <= v_toi)
       and not exists (select 1 from public.vkl_sm_dat d where d.ky_id = v_ky and d.q = t.q and d.r = t.r)
       and not exists (select 1 from public.vkl_sm_yeu_cong y where y.ky_id = v_ky and y.q = t.q and y.r = t.r and y.trang_thai = 'cho')
     order by mon.diem desc, vkl_priv.sm_dist(n.q, n.r, t.q, t.r), random()
  loop
    exit when v_bao >= v_luot;
    continue when (x.tu_q || ',' || x.tu_r) = any (v_dung_tu) or x.mon_id = any (v_dung_mon);
    insert into public.vkl_sm_yeu_cong (ky_id, tu_q, tu_r, q, r, mon_id, luc, trieu, toi_luc)
    values (v_ky, x.tu_q, x.tu_r, x.q, x.r, x.mon_id, vkl_priv.sm_r500(x.yeu_luc * (case when v_trieu then (c ->> 'trieu_he')::numeric else 1 end), 5000), v_trieu, v_toi);
    v_dung_tu := v_dung_tu || (x.tu_q || ',' || x.tu_r);
    v_dung_mon := v_dung_mon || x.mon_id;
    v_bao := v_bao + 1;
  end loop;

  -- ổ yêu chưa có việc thì lan ra một ô trống kề bên
  for x in
    select distinct on (d.q, d.r) d.q tu_q, d.r tu_r, d.yeu_luc, e.q, e.r
      from public.vkl_sm_dat d
      join public.vkl_sm_tile s on s.ky_id = d.ky_id and s.q = d.q and s.r = d.r and s.mon_id = v_yeu
      join public.vkl_sm_tile e on e.ky_id = d.ky_id and e.mon_id is null and vkl_priv.sm_dist(d.q, d.r, e.q, e.r) = 1
     where d.ky_id = v_ky and d.loai = 'yeu_thu'
       and not exists (select 1 from public.vkl_sm_dat z where z.ky_id = v_ky and z.q = e.q and z.r = e.r)
       and not exists (select 1 from public.vkl_sm_chinh h where h.ky_id = v_ky and h.toi_q = e.q and h.toi_r = e.r and h.trang_thai in ('tap_hop', 'di'))
     order by d.q, d.r, random()
  loop
    exit when v_lan >= v_lan_max
      or (select count(*) from public.vkl_sm_tile where ky_id = v_ky and mon_id = v_yeu) >= v_max;
    continue when (x.tu_q || ',' || x.tu_r) = any (v_dung_tu) or random() < 0.5;
    continue when exists (select 1 from public.vkl_sm_dat z where z.ky_id = v_ky and z.q = x.q and z.r = x.r);
    update public.vkl_sm_tile set mon_id = v_yeu, chinh_dien = false, chiem_luc = now(), bao_ho_toi = now() + interval '100 years'
     where ky_id = v_ky and q = x.q and r = x.r and mon_id is null;
    if found then
      insert into public.vkl_sm_dat (ky_id, q, r, loai, yeu_luc, yeu_luc_dat) values (v_ky, x.q, x.r, 'yeu_thu', vkl_priv.sm_r500(x.yeu_luc * 0.8, 8000), now());
      v_dung_tu := v_dung_tu || (x.tu_q || ',' || x.tu_r);
      v_lan := v_lan + 1;
    end if;
  end loop;
  return jsonb_build_object('tinh', v_tinh, 'dot', v_dot, 'bao', v_bao, 'lan', v_lan, 'trieu', v_trieu);
end;
$$;

-- Bản đồ Kỷ 2 kèm trữ lượng Linh Mạch, các đợt yêu thú đang tới, thú triều.
create or replace function public.vkl_sm_map3(p_ky integer)
returns jsonb language sql stable security definer set search_path = '' as $$
  with k as (select coalesce(p_ky, vkl_priv.sm_ky_now(), (select max(id) from public.vkl_sm_ky)) id),
  c as (select v from public.vkl_sm_cfg where k = 'dat')
  select public.vkl_sm_map(p_ky) || jsonb_build_object(
    'dat', (select coalesce(jsonb_agg(jsonb_build_array(d.q, d.r, d.loai, d.ten_rieng, d.yeu_luc, d.tru_luong)), '[]')
              from public.vkl_sm_dat d, k where d.ky_id = k.id),
    'yeu_mon', vkl_priv.sm_yeu_mon(),
    'dat_tu', (select v ->> 'bat_dau' from c),
    'yeu_cong', (select coalesce(jsonb_agg(jsonb_build_object('id', y.id, 'tu', jsonb_build_array(y.tu_q, y.tu_r), 'o', jsonb_build_array(y.q, y.r),
                    'mon', y.mon_id, 'luc', y.luc, 'toi', y.toi_luc, 'trieu', y.trieu) order by y.toi_luc), '[]')
                   from public.vkl_sm_yeu_cong y, k where y.ky_id = k.id and y.trang_thai = 'cho'),
    'trieu', jsonb_build_object('hom_nay', vkl_priv.sm_trieu(now()), 'mai', vkl_priv.sm_trieu(now() + interval '1 day'),
               'he', (select (v ->> 'trieu_he')::numeric from c)),
    'lm_tru', (select (v ->> 'lm_tru')::int from c));
$$;
revoke all on function public.vkl_sm_map3(integer) from public;
grant execute on function public.vkl_sm_map3(integer) to anon, authenticated;

-- Bảng tin trang chủ: như vkl_sm_tin_live, thêm yêu thú đánh ô, môn giữ được ô, Linh Mạch dời chỗ.
create or replace function public.vkl_sm_tin_live2()
returns jsonb language sql stable security definer set search_path = '' as $$
  with k as (select vkl_priv.sm_ky_now() id),
  yeu as (select vkl_priv.sm_yeu_mon() id),
  mon as (select m.id, m.ten from public.vkl_sm_mon m),
  bao as (
    select b.loai, b.luc, b.mon_a, b.mon_b, b.noi_dung nd, d.loai dat
      from public.vkl_sm_bao b join k on b.ky_id = k.id
      left join public.vkl_sm_dat d on d.ky_id = b.ky_id and d.q = b.q and d.r = b.r and d.loai in ('linh_mach', 'thien_tri')
     where b.luc > now() - interval '6 hours' and b.loai in ('cam_co', 'tran', 'mat_het', 'lm_doi')
     order by b.luc desc limit 16),
  x as (
    select jsonb_build_object('k', 'sm',
             't', case when b.loai = 'cam_co' then 'mo'
                       when b.loai = 'mat_het' then 'mat'
                       when b.loai = 'lm_doi' then 'lm_doi'
                       when b.mon_a = (select id from yeu) then case when b.nd ->> 'kq' = 'thang' then 'yeu_chiem' else 'yeu_giu' end
                       when b.mon_b = (select id from yeu) then case when b.nd ->> 'kq' = 'thang' then 'diet' else 'yeu_thua' end
                       when b.nd ->> 'kq' = 'thang' then 'chiem' else 'thua' end,
             'a', case when b.mon_a = (select id from yeu) then mb.ten else ma.ten end,
             'b', case when b.mon_b = (select id from yeu) or b.mon_a = (select id from yeu) then null else mb.ten end,
             'o', coalesce(b.nd ->> 'ten_o', ''), 'dat', b.dat, 'bo', coalesce(b.nd ->> 'bo_o', b.nd ->> 'lm'), 'moi', b.nd ->> 'moi_o', 'at', b.luc) j, b.luc at
      from bao b left join mon ma on ma.id = b.mon_a left join mon mb on mb.id = b.mon_b
     where (b.loai = 'lm_doi' or ma.ten is not null) and (b.mon_a is distinct from (select id from yeu) or mb.ten is not null)
    union all
    select jsonb_build_object('k', 'sm', 't', 'lap', 'a', m.ten, 'at', m.lap_luc), m.lap_luc
      from public.vkl_sm_mon m, k
     where m.ky_lap = k.id and m.giai_tan_luc is null and m.du_ky and m.lap_luc > now() - interval '24 hours'
       and m.id is distinct from (select id from yeu)
    union all
    select jsonb_build_object('k', 'sm', 't', 'yeu', 'n', count(*), 'at', max(d.yeu_luc_dat)), max(d.yeu_luc_dat)
      from public.vkl_sm_dat d, k
     where d.ky_id = k.id and d.loai = 'yeu_thu' and d.yeu_luc_dat > now() - interval '12 hours'
    having count(*) > 0)
  select coalesce(jsonb_agg(j order by at desc), '[]'::jsonb) from (select j, at from x order by at desc limit 14) y;
$$;
revoke all on function public.vkl_sm_tin_live2() from public;
grant execute on function public.vkl_sm_tin_live2() to anon, authenticated;

revoke all on function vkl_priv.sm_lm_gio() from public;
revoke all on function vkl_priv.sm_yeu_danh(bigint) from public;
revoke all on function vkl_priv.sm_yeu_tick() from public;

select cron.schedule('vkl_sm_lm_gio', '2 * * * *', 'select vkl_priv.sm_lm_gio()');
select cron.schedule('vkl_sm_yeu_tick', '*/5 * * * *', 'select vkl_priv.sm_yeu_tick()');
