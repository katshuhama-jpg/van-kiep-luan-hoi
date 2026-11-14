-- 4.6.0 Sơn Môn Tranh Bá (bản gọn), Ngày 1 (đêm 14/11/2026, lên bản 15/11, giấu sau cờ SON_MON_ON).
-- Chỉ thêm bảng, hàm, trigger, cron MỚI (tiền tố vkl_sm_ / vkl_priv.sm_). Không sửa hàm cũ.
-- Mọi bảng bật RLS và không có policy: trình duyệt chỉ đọc ghi qua hàm SECURITY DEFINER.
-- Lỗi trả bằng raise exception với mã 'SM_...' (trình duyệt đọc error.message).
-- "Ngày" của Sơn Môn đổi lúc 5:00 giờ Việt Nam: vkl_priv.sm_day(t).
-- Tọa độ ô: lục giác trục (q, r), ô hợp lệ khi |q|, |r|, |q+r| <= bán kính.

create schema if not exists vkl_priv;

-- ---------- Cấu hình (số chốt ở Ngày 2 sau mô phỏng) ----------
create table if not exists public.vkl_sm_cfg (
  k text primary key,
  v jsonb not null
);
alter table public.vkl_sm_cfg enable row level security;
insert into public.vkl_sm_cfg (k, v) values
  ('lap', '{"kiep": 50, "ngay": 5, "kiep_ha": 30, "ngay_ha": 4, "ha": false}'),
  ('tran', '{"tran": 6000, "san_nha": 1.25, "dem": 2.0, "mot_o": 1.15, "moc1": 30, "moc2": 50, "kv30": 0.10, "kv60": 0.20}'),
  ('gio', '{"trinh_phut": 10, "tap_hop_phut": 30, "di_phut": 20, "bao_ho_gio": 6, "bao_ho_mat_het_gio": 12, "nghi_gio": 2, "ky_gio": 24}'),
  ('mon', '{"toi_da": 15, "lao": 3, "ky_can": 2}')
on conflict (k) do nothing;

create or replace function vkl_priv.sm_cfg(p_k text, p_f text)
returns numeric language sql stable security definer set search_path = '' as $$
  select (v ->> p_f)::numeric from public.vkl_sm_cfg where k = p_k;
$$;

-- ngày Sơn Môn: đổi lúc 5:00 giờ VN
create or replace function vkl_priv.sm_day(p_t timestamptz default now())
returns date language sql stable set search_path = '' as $$
  select ((p_t at time zone 'Asia/Ho_Chi_Minh') - interval '5 hour')::date;
$$;

-- Ngày 2 (14/11): mốc Khí vận 30 và 50 (bản phần 1 đã áp trước đó không có hai khóa này)
update public.vkl_sm_cfg set v = v || '{"moc1": 30, "moc2": 50}' where k = 'tran' and not (v ? 'moc2');

-- ---------- Bảng ----------
create table if not exists public.vkl_sm_ky (
  id serial primary key,
  bat_dau timestamptz not null,
  ket_thuc timestamptz not null,
  ban_kinh int not null check (ban_kinh between 3 and 9),
  ket_xong boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.vkl_sm_mon (
  id bigserial primary key,
  ky_lap int not null references public.vkl_sm_ky (id) on delete cascade,
  ten1 text not null,
  ten2 text not null,
  ten3 text not null,
  ten text generated always as (ten1 || ' ' || ten2 || ' ' || ten3) stored,
  huy_hieu int not null check (huy_hieu between 0 and 29),
  chinh_dien_hinh int not null check (chinh_dien_hinh between 0 and 9),
  dk_kiep int not null default 0 check (dk_kiep between 0 and 100000),
  dk_tuoi_dao int not null default 0 check (dk_tuoi_dao between 0 and 3650), -- số ngày chơi khác nhau
  mo_cua boolean not null default true,
  mon_chu uuid references public.vkl_players (id) on delete set null,
  lap_luc timestamptz not null default now(),
  het_han_ky timestamptz not null,           -- hạn đủ chữ ký cùng lập (lập + 24 giờ)
  du_ky boolean not null default false,
  cam_co_luc timestamptz,                    -- lần đầu cắm cờ (từ đó tự rời bị khóa tới hết Kỷ)
  giai_tan_luc timestamptz
);
create unique index if not exists vkl_sm_mon_ten on public.vkl_sm_mon (ky_lap, ten) where giai_tan_luc is null;
create index if not exists vkl_sm_mon_chu on public.vkl_sm_mon (mon_chu);
create index if not exists vkl_sm_mon_cho on public.vkl_sm_mon (het_han_ky) where not du_ky and giai_tan_luc is null;

create table if not exists public.vkl_sm_tile (
  ky_id int not null references public.vkl_sm_ky (id) on delete cascade,
  q int not null,
  r int not null,
  ten text not null,
  coi text not null check (coi in ('thien', 'hong_tran', 'u_minh')),
  mon_id bigint references public.vkl_sm_mon (id) on delete set null,
  chinh_dien boolean not null default false,
  bao_ho_toi timestamptz,
  chiem_luc timestamptz,
  primary key (ky_id, q, r)
);
create index if not exists vkl_sm_tile_mon on public.vkl_sm_tile (mon_id) where mon_id is not null;

create table if not exists public.vkl_sm_mon_ky (
  mon_id bigint not null references public.vkl_sm_mon (id) on delete cascade,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  ky_luc timestamptz not null default now(),
  primary key (mon_id, player_id)
);
create index if not exists vkl_sm_mon_ky_player on public.vkl_sm_mon_ky (player_id);

-- một dòng mỗi người từng dính tới Sơn Môn; mon_id null = chưa có môn
create table if not exists public.vkl_sm_member (
  player_id uuid primary key references public.vkl_players (id) on delete cascade,
  mon_id bigint references public.vkl_sm_mon (id) on delete set null,
  chuc text check (chuc in ('chu', 'lao', 'de')),
  dung_q int,
  dung_r int,
  vao_luc timestamptz,
  khoa_toi timestamptz,                      -- tự rời môn đã cắm cờ: chờ tới lúc này
  nghi_toi timestamptz                       -- thua trận: nghỉ tới lúc này
);
create index if not exists vkl_sm_member_mon on public.vkl_sm_member (mon_id) where mon_id is not null;

create table if not exists public.vkl_sm_don (
  id bigserial primary key,
  mon_id bigint not null references public.vkl_sm_mon (id) on delete cascade,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  luc timestamptz not null default now(),
  trang_thai text not null default 'cho' check (trang_thai in ('cho', 'nhan', 'tu_choi', 'huy'))
);
create unique index if not exists vkl_sm_don_cho on public.vkl_sm_don (mon_id, player_id) where trang_thai = 'cho';
create index if not exists vkl_sm_don_player on public.vkl_sm_don (player_id);

create table if not exists public.vkl_sm_luc_chien (
  player_id uuid primary key references public.vkl_players (id) on delete cascade,
  lc int not null default 0,
  phan jsonb not null default '{}',
  cap_nhat timestamptz not null default now()
);

create table if not exists public.vkl_sm_ngay (
  mon_id bigint not null references public.vkl_sm_mon (id) on delete cascade,
  ngay date not null,
  khi_van int not null default 0,
  primary key (mon_id, ngay)
);

create table if not exists public.vkl_sm_diem_danh (
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  ngay date not null,
  mon_id bigint references public.vkl_sm_mon (id) on delete set null,
  chuoi int not null default 1,
  luc timestamptz not null default now(),
  primary key (player_id, ngay)
);

create table if not exists public.vkl_sm_nv (
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  ngay date not null,
  mon_id bigint references public.vkl_sm_mon (id) on delete set null,
  bac int not null check (bac between 1 and 3),
  kiep int not null default 0,               -- số kiếp xong hôm nay (từ 16 tuổi)
  tuoi int not null default 0,               -- tuổi cao nhất hôm nay
  canh int not null default 0,               -- cảnh giới cao nhất hôm nay (realm_no)
  xong boolean[] not null default '{false,false,false}',
  primary key (player_id, ngay)
);
create index if not exists vkl_sm_nv_mon on public.vkl_sm_nv (mon_id, ngay);

create table if not exists public.vkl_sm_trinh (
  id bigserial primary key,
  ky_id int not null references public.vkl_sm_ky (id) on delete cascade,
  mon_id bigint not null references public.vkl_sm_mon (id) on delete cascade,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  q int not null,
  r int not null,
  luc timestamptz not null default now(),
  xong_luc timestamptz not null,
  ket_qua jsonb                              -- null = đang đi
);
create index if not exists vkl_sm_trinh_cho on public.vkl_sm_trinh (xong_luc) where ket_qua is null;
create index if not exists vkl_sm_trinh_mon on public.vkl_sm_trinh (mon_id, luc desc);
create index if not exists vkl_sm_trinh_player on public.vkl_sm_trinh (player_id);

create table if not exists public.vkl_sm_chinh (
  id bigserial primary key,
  ky_id int not null references public.vkl_sm_ky (id) on delete cascade,
  mon_id bigint not null references public.vkl_sm_mon (id) on delete cascade,
  nguoi_phat uuid references public.vkl_players (id) on delete set null,
  tu_q int not null,
  tu_r int not null,
  toi_q int not null,
  toi_r int not null,
  luc timestamptz not null default now(),
  tap_hop_toi timestamptz not null,
  toi_noi_luc timestamptz not null,
  trang_thai text not null default 'tap_hop' check (trang_thai in ('tap_hop', 'di', 'xong', 'huy')),
  ket_qua jsonb
);
create index if not exists vkl_sm_chinh_chay on public.vkl_sm_chinh (ky_id, toi_q, toi_r) where trang_thai in ('tap_hop', 'di');
create index if not exists vkl_sm_chinh_mon on public.vkl_sm_chinh (mon_id, luc desc);
create index if not exists vkl_sm_chinh_nguoi on public.vkl_sm_chinh (nguoi_phat);

create table if not exists public.vkl_sm_chinh_theo (
  chinh_id bigint not null references public.vkl_sm_chinh (id) on delete cascade,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  luc timestamptz not null default now(),
  primary key (chinh_id, player_id)
);
create index if not exists vkl_sm_chinh_theo_player on public.vkl_sm_chinh_theo (player_id);

create table if not exists public.vkl_sm_bao (
  id bigserial primary key,
  ky_id int not null references public.vkl_sm_ky (id) on delete cascade,
  luc timestamptz not null default now(),
  loai text not null,                        -- tran, cam_co, mat_het, giai_tan, bao_ho
  mon_a bigint references public.vkl_sm_mon (id) on delete set null,
  mon_b bigint references public.vkl_sm_mon (id) on delete set null,
  q int,
  r int,
  noi_dung jsonb not null default '{}'
);
create index if not exists vkl_sm_bao_a on public.vkl_sm_bao (mon_a, luc desc);
create index if not exists vkl_sm_bao_b on public.vkl_sm_bao (mon_b, luc desc);
create index if not exists vkl_sm_bao_ky on public.vkl_sm_bao (ky_id, luc desc);

create table if not exists public.vkl_sm_co (
  id bigserial primary key,
  luc timestamptz not null default now(),
  loai text not null,
  chi_tiet jsonb not null default '{}'
);

create table if not exists public.vkl_sm_thuong (
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  ky_id int not null references public.vkl_sm_ky (id) on delete cascade,
  loai text not null,                        -- chuoi7 (ngoại trang), hang1, hang2_3 (Ngày 6)
  luc timestamptz not null default now(),
  primary key (player_id, ky_id, loai)
);

alter table public.vkl_sm_ky enable row level security;
alter table public.vkl_sm_mon enable row level security;
alter table public.vkl_sm_tile enable row level security;
alter table public.vkl_sm_mon_ky enable row level security;
alter table public.vkl_sm_member enable row level security;
alter table public.vkl_sm_don enable row level security;
alter table public.vkl_sm_luc_chien enable row level security;
alter table public.vkl_sm_ngay enable row level security;
alter table public.vkl_sm_diem_danh enable row level security;
alter table public.vkl_sm_nv enable row level security;
alter table public.vkl_sm_trinh enable row level security;
alter table public.vkl_sm_chinh enable row level security;
alter table public.vkl_sm_chinh_theo enable row level security;
alter table public.vkl_sm_bao enable row level security;
alter table public.vkl_sm_co enable row level security;
alter table public.vkl_sm_thuong enable row level security;

-- ---------- Hàm nội bộ ----------

-- khoảng cách hai ô lục giác
create or replace function vkl_priv.sm_dist(q1 int, r1 int, q2 int, r2 int)
returns int language sql immutable set search_path = '' as $$
  select (abs(q1 - q2) + abs(r1 - r2) + abs((q1 + r1) - (q2 + r2))) / 2;
$$;

-- Kỷ đang chạy (null nếu không có)
create or replace function vkl_priv.sm_ky_now()
returns int language sql stable security definer set search_path = '' as $$
  select id from public.vkl_sm_ky where bat_dau <= now() and ket_thuc > now() and not ket_xong order by id desc limit 1;
$$;

-- số kiếp (từ 16 tuổi) và số ngày chơi khác nhau
create or replace function vkl_priv.sm_kiep_ngay(p_player uuid, out kiep int, out ngay int)
language sql stable security definer set search_path = '' as $$
  select count(*)::int, count(distinct (created_at at time zone 'Asia/Ho_Chi_Minh')::date)::int
  from public.vkl_lives where player_id = p_player and age >= 16;
$$;

-- Lực chiến (bản thật; bản TypeScript trong lib/sonmon/data.ts chỉ để hiện ước tính)
-- (30 x căn tổng năm + 200 x ln(1 + số kiếp) + 80 x cảnh giới cao nhất + 15 x kết cục (tối đa 100) + 50 x ngày chơi (tối đa 30))
--   x (1 + 4% mỗi huyệt + 3% mỗi hành viên mãn). Kiếp chết trước 16 tuổi không tính.
create or replace function vkl_priv.sm_lc(p_player uuid)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_yrs bigint; v_n int; v_rn int; v_d int; v_e int; v_hu int; v_vm int; v_meta jsonb;
  v_base numeric; v_mul numeric; v_lc int;
begin
  select coalesce(sum(age), 0), count(*), coalesce(max(realm_no), 0),
         count(distinct (created_at at time zone 'Asia/Ho_Chi_Minh')::date)
    into v_yrs, v_n, v_rn, v_d
  from public.vkl_lives where player_id = p_player and age >= 16;
  select meta into v_meta from public.vkl_players where id = p_player;
  v_e := case when jsonb_typeof(v_meta -> 'endings') = 'object' then (select count(*) from jsonb_object_keys(v_meta -> 'endings'))
              when jsonb_typeof(v_meta -> 'endings') = 'array' then jsonb_array_length(v_meta -> 'endings') else 0 end;
  v_hu := case when jsonb_typeof(v_meta -> 'huyet') = 'array' and v_meta -> 'chanThan' is not null
               and jsonb_typeof(v_meta -> 'chanThan') = 'object' then jsonb_array_length(v_meta -> 'huyet') else 0 end;
  v_vm := case when jsonb_typeof(v_meta -> 'career' -> 'hanh') = 'object'
               then (select count(*) from jsonb_each(v_meta -> 'career' -> 'hanh') x
                     where jsonb_typeof(x.value) = 'number' and (x.value)::numeric >= 3) else 0 end;
  v_base := 30 * sqrt(v_yrs) + 200 * ln(1 + v_n) + 80 * v_rn + 15 * least(v_e, 100) + 50 * least(v_d, 30);
  v_mul := 1 + 0.04 * least(v_hu, 10) + 0.03 * least(v_vm, 5);
  v_lc := round(v_base * v_mul);
  insert into public.vkl_sm_luc_chien (player_id, lc, phan, cap_nhat)
  values (p_player, v_lc, jsonb_build_object(
    'nam', v_yrs, 'kiep', v_n, 'canh', v_rn, 'ket_cuc', least(v_e, 100), 'ngay', least(v_d, 30),
    'huyet', least(v_hu, 10), 'vien_man', least(v_vm, 5),
    'p_nam', round(30 * sqrt(v_yrs)), 'p_kiep', round(200 * ln(1 + v_n)), 'p_canh', 80 * v_rn,
    'p_ket_cuc', 15 * least(v_e, 100), 'p_ngay', 50 * least(v_d, 30), 'nhan', v_mul), now())
  on conflict (player_id) do update set lc = excluded.lc, phan = excluded.phan, cap_nhat = excluded.cap_nhat;
  return v_lc;
end;
$$;

create or replace function vkl_priv.sm_lc_get(p_player uuid)
returns int language plpgsql security definer set search_path = '' as $$
declare v int;
begin
  select lc into v from public.vkl_sm_luc_chien where player_id = p_player;
  if v is null then v := vkl_priv.sm_lc(p_player); end if;
  return v;
end;
$$;

-- trần đóng góp: tới 6.000 tính đủ, phần trên tính một nửa
create or replace function vkl_priv.sm_cap(p_lc numeric)
returns numeric language sql stable security definer set search_path = '' as $$
  select least(p_lc, t) + greatest(p_lc - t, 0) / 2 from (select vkl_priv.sm_cfg('tran', 'tran') t) x;
$$;

-- hệ số Khí vận của môn cho thời điểm t (theo Khí vận ngày trước đó). Mốc 2 hạ 60 -> 50 sau mô phỏng Ngày 2 (14/11).
create or replace function vkl_priv.sm_kv_bonus(p_mon bigint, p_t timestamptz default now())
returns numeric language sql stable security definer set search_path = '' as $$
  select case when kv >= coalesce(vkl_priv.sm_cfg('tran', 'moc2'), 60) then vkl_priv.sm_cfg('tran', 'kv60')
              when kv >= coalesce(vkl_priv.sm_cfg('tran', 'moc1'), 30) then vkl_priv.sm_cfg('tran', 'kv30') else 0 end
  from (select coalesce((select khi_van from public.vkl_sm_ngay where mon_id = p_mon and ngay = vkl_priv.sm_day(p_t) - 1), 0) kv) x;
$$;

-- nhiệm vụ theo bậc: số kiếp, tuổi, cảnh giới; thưởng 2, 3, 5
create or replace function vkl_priv.sm_nv_muc(p_bac int)
returns int[] language sql immutable set search_path = '' as $$
  select case p_bac when 1 then array[1, 60, 2] when 2 then array[2, 120, 3] else array[3, 300, 4] end;
$$;

create or replace function vkl_priv.sm_bac(p_lc int)
returns int language sql immutable set search_path = '' as $$
  select case when p_lc < 1500 then 1 when p_lc <= 5000 then 2 else 3 end;
$$;

-- bảo đảm có dòng nhiệm vụ hôm nay cho người đang ở môn (bậc chốt lúc tạo dòng)
create or replace function vkl_priv.sm_nv_ensure(p_player uuid, p_mon bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.vkl_sm_nv (player_id, ngay, mon_id, bac)
  values (p_player, vkl_priv.sm_day(), p_mon, vkl_priv.sm_bac(vkl_priv.sm_lc_get(p_player)))
  on conflict (player_id, ngay) do nothing;
end;
$$;

create or replace function vkl_priv.sm_add_kv(p_mon bigint, p_n int)
returns void language sql security definer set search_path = '' as $$
  insert into public.vkl_sm_ngay (mon_id, ngay, khi_van) values (p_mon, vkl_priv.sm_day(), p_n)
  on conflict (mon_id, ngay) do update set khi_van = public.vkl_sm_ngay.khi_van + excluded.khi_van;
$$;

create or replace function vkl_priv.sm_flag(p_loai text, p_ct jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.vkl_sm_co (loai, chi_tiet) values (p_loai, p_ct);
$$;

-- người chơi: phải có chân thân (tài khoản trong vkl_players là tài khoản đã liên kết; khách chơi thử không có ở đây)
create or replace function vkl_priv.sm_me(p_token uuid)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare v uuid := public.vkl_player(p_token);
begin
  if v is null then raise exception 'SM_AUTH'; end if;
  if not exists (select 1 from public.vkl_players where id = v and jsonb_typeof(meta -> 'chanThan') = 'object') then
    raise exception 'SM_NO_CT';
  end if;
  return v;
end;
$$;

-- số người trong môn
create or replace function vkl_priv.sm_mon_n(p_mon bigint)
returns int language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.vkl_sm_member where mon_id = p_mon;
$$;

-- số ô tối đa: 1 + người / 3
create or replace function vkl_priv.sm_o_max(p_mon bigint)
returns int language sql stable security definer set search_path = '' as $$
  select 1 + vkl_priv.sm_mon_n(p_mon) / 3;
$$;

-- ra khỏi môn (không kiểm quyền): dọn đơn, theo xuất chinh đang tập hợp
create or replace function vkl_priv.sm_out(p_player uuid, p_khoa timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.vkl_sm_chinh_theo t using public.vkl_sm_chinh c
   where t.chinh_id = c.id and t.player_id = p_player and c.trang_thai = 'tap_hop';
  update public.vkl_sm_member set mon_id = null, chuc = null, dung_q = null, dung_r = null, vao_luc = null,
    khoa_toi = p_khoa where player_id = p_player;
end;
$$;

-- giải tán môn: ô về trống, mọi người ra (không khóa)
create or replace function vkl_priv.sm_giai_tan(p_mon bigint, p_ly_do text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_ky int;
begin
  update public.vkl_sm_mon set giai_tan_luc = now() where id = p_mon and giai_tan_luc is null returning ky_lap into v_ky;
  if v_ky is null then return; end if;
  update public.vkl_sm_tile set mon_id = null, chinh_dien = false, bao_ho_toi = null where mon_id = p_mon;
  update public.vkl_sm_chinh set trang_thai = 'huy', ket_qua = jsonb_build_object('ly_do', p_ly_do)
   where mon_id = p_mon and trang_thai in ('tap_hop', 'di');
  update public.vkl_sm_member set mon_id = null, chuc = null, dung_q = null, dung_r = null, vao_luc = null where mon_id = p_mon;
  update public.vkl_sm_don set trang_thai = 'huy' where mon_id = p_mon and trang_thai = 'cho';
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, noi_dung) values (v_ky, 'giai_tan', p_mon, jsonb_build_object('ly_do', p_ly_do));
end;
$$;

-- vào môn (không kiểm quyền)
create or replace function vkl_priv.sm_vao(p_player uuid, p_mon bigint, p_cach text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_moi int;
begin
  insert into public.vkl_sm_member (player_id, mon_id, chuc, vao_luc) values (p_player, p_mon, 'de', now())
  on conflict (player_id) do update set mon_id = p_mon, chuc = 'de', dung_q = null, dung_r = null, vao_luc = now(), khoa_toi = null;
  update public.vkl_sm_don set trang_thai = 'huy' where player_id = p_player and trang_thai = 'cho' and mon_id <> p_mon;
  perform vkl_priv.sm_nv_ensure(p_player, p_mon);
  -- đánh dấu: nhiều tài khoản mới (dưới 3 ngày tuổi) vào cùng một môn trong một ngày
  select count(*) into v_moi from public.vkl_sm_member m join public.vkl_players p on p.id = m.player_id
   where m.mon_id = p_mon and m.vao_luc > now() - interval '1 day' and p.created_at > now() - interval '3 day';
  if v_moi in (4, 8) then
    perform vkl_priv.sm_flag('moi_vao_dong', jsonb_build_object('mon', p_mon, 'n', v_moi));
  end if;
end;
$$;

-- kiểm có đủ điều kiện vào môn không
create or replace function vkl_priv.sm_du_dk(p_player uuid, p_mon bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select k.kiep >= m.dk_kiep and k.ngay >= m.dk_tuoi_dao
  from public.vkl_sm_mon m, vkl_priv.sm_kiep_ngay(p_player) k where m.id = p_mon;
$$;

-- người có thể vào môn mới không (chưa có môn, không bị khóa)
create or replace function vkl_priv.sm_ranh(p_player uuid)
returns text language sql stable security definer set search_path = '' as $$
  select case when mon_id is not null then 'SM_DA_CO_MON' when khoa_toi > now() then 'SM_KHOA' else null end
  from public.vkl_sm_member where player_id = p_player;
$$;

-- ---------- Sinh bản đồ Kỷ ----------
create or replace function vkl_priv.sm_ky_create(p_bat_dau timestamptz, p_ket_thuc timestamptz, p_ban_kinh int)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_id int;
  a text[] := array['Vọng Nguyệt','Thanh Phong','Lạc Hà','Bích Thủy','Hàn Sương','Tử Trúc','Kim Ô','Ngọc Hư','Huyền Băng','Xích Diễm',
    'Lưu Vân','Bạch Lộc','Thương Lang','U Lan','Phi Tuyết','Cổ Tùng','Hồng Liên','Thiết Huyết','Lăng Tiêu','Vạn Tượng',
    'Thất Tinh','Cửu Khúc','Long Ngâm','Phượng Minh','Tàng Kiếm','Vô Vọng','Đoạn Hồn','Nghênh Khách'];
  b text[] := array['Phong','Cốc','Nhai','Hồ','Lĩnh','Động','Đài','Nguyên','Xuyên','Lâm','Tuyền','Khâu'];
  v_rows int;
begin
  insert into public.vkl_sm_ky (bat_dau, ket_thuc, ban_kinh) values (p_bat_dau, p_ket_thuc, p_ban_kinh) returning id into v_id;
  insert into public.vkl_sm_tile (ky_id, q, r, ten, coi)
  select v_id, g.q, g.r,
    a[1 + ((g.k / cardinality(b)) % cardinality(a))] || ' ' || b[1 + (g.k % cardinality(b))],
    case when g.q = 0 and g.r = 0 then 'thien'
         else (array['thien', 'hong_tran', 'u_minh'])[1 + floor(((degrees(atan2(g.r * sqrt(3) / 2, g.q + g.r / 2.0)) + 360 + 30.001)::numeric % 360) / 120)::int]
    end
  from (
    select q, r, (row_number() over (order by md5(v_id::text || ':' || q || ':' || r)) - 1)::int k
    from generate_series(-p_ban_kinh, p_ban_kinh) q, generate_series(-p_ban_kinh, p_ban_kinh) r
    where abs(q + r) <= p_ban_kinh
  ) g;
  get diagnostics v_rows = row_count;
  if v_rows > cardinality(a) * cardinality(b) then raise exception 'SM_TEN_O_THIEU'; end if;
  return v_id;
end;
$$;

-- ---------- Trigger sau khi kiếp khép lại ----------
create or replace function vkl_priv.sm_after_life()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_mon bigint; v_nv public.vkl_sm_nv; v_m int[]; v_new boolean[]; v_add int := 0; v_th int[] := array[2, 3, 5]; i int;
begin
  begin
    if new.player_id is null then return null; end if;
    -- chỉ người đã có chân thân mới có Lực chiến
    if not exists (select 1 from public.vkl_players where id = new.player_id and jsonb_typeof(meta -> 'chanThan') = 'object') then
      return null;
    end if;
    perform vkl_priv.sm_lc(new.player_id);
    select mon_id into v_mon from public.vkl_sm_member where player_id = new.player_id;
    if v_mon is null or coalesce(new.age, 0) < 16 then return null; end if;
    perform vkl_priv.sm_nv_ensure(new.player_id, v_mon);
    update public.vkl_sm_nv set kiep = kiep + 1, tuoi = greatest(tuoi, coalesce(new.age, 0)),
      canh = greatest(canh, coalesce(new.realm_no, 0)), mon_id = v_mon
     where player_id = new.player_id and ngay = vkl_priv.sm_day() returning * into v_nv;
    v_m := vkl_priv.sm_nv_muc(v_nv.bac);
    v_new := array[v_nv.kiep >= v_m[1], v_nv.tuoi >= v_m[2], v_nv.canh >= v_m[3]];
    for i in 1..3 loop
      if v_new[i] and not v_nv.xong[i] then v_add := v_add + v_th[i]; end if;
      v_new[i] := v_new[i] or v_nv.xong[i];
    end loop;
    if v_add > 0 then
      update public.vkl_sm_nv set xong = v_new where player_id = new.player_id and ngay = v_nv.ngay;
      perform vkl_priv.sm_add_kv(v_mon, v_add);
    end if;
  exception when others then
    -- không bao giờ chặn việc ghi bia
    null;
  end;
  return null;
end;
$$;

drop trigger if exists vkl_lives_zz_son_mon on public.vkl_lives;
create trigger vkl_lives_zz_son_mon after insert on public.vkl_lives
  for each row execute function vkl_priv.sm_after_life();

-- ---------- Trận ----------
-- Tổng Lực chiến (có trần) của người đứng giữ một ô (offline vẫn tính; chưa chọn thì đứng ở ô chính điện)
create or replace function vkl_priv.sm_giu(p_ky int, p_mon bigint, p_q int, p_r int)
returns table (n int, lc numeric) language sql stable security definer set search_path = '' as $$
  with cd as (select q, r from public.vkl_sm_tile where ky_id = p_ky and mon_id = p_mon and chinh_dien limit 1)
  select count(*)::int, coalesce(sum(vkl_priv.sm_cap(coalesce(l.lc, 0))), 0)
  from public.vkl_sm_member m
  left join public.vkl_sm_luc_chien l on l.player_id = m.player_id
  left join cd on true
  where m.mon_id = p_mon
    and coalesce(m.dung_q, cd.q) = p_q and coalesce(m.dung_r, cd.r) = p_r
    and (m.nghi_toi is null or m.nghi_toi <= now())
    and not exists (select 1 from public.vkl_sm_chinh_theo t join public.vkl_sm_chinh c on c.id = t.chinh_id
                    where t.player_id = m.player_id and c.trang_thai in ('tap_hop', 'di'));
$$;

-- chọn lại chính điện khi mất (ô giữ lâu nhất)
create or replace function vkl_priv.sm_chon_cd(p_ky int, p_mon bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.vkl_sm_tile where ky_id = p_ky and mon_id = p_mon and chinh_dien) then return; end if;
  update public.vkl_sm_tile set chinh_dien = true
   where (ky_id, q, r) = (select ky_id, q, r from public.vkl_sm_tile where ky_id = p_ky and mon_id = p_mon order by chiem_luc nulls first limit 1);
end;
$$;

create or replace function vkl_priv.sm_tran(p_chinh bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  c public.vkl_sm_chinh; t public.vkl_sm_tile;
  v_atk numeric; v_n_atk int; v_def numeric := 0; v_n_def int := 0; v_win boolean; v_kq jsonb;
  v_kv_a numeric; v_kv_b numeric := 0; v_dem boolean; v_mot boolean := false; v_san numeric;
begin
  select * into c from public.vkl_sm_chinh where id = p_chinh for update;
  if c.trang_thai <> 'di' then return null; end if;
  select * into t from public.vkl_sm_tile where ky_id = c.ky_id and q = c.toi_q and r = c.toi_r for update;
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
             * (case when v_mot then vkl_priv.sm_cfg('tran', 'mot_o') else 1 end);
    v_win := v_atk > v_def;
    if v_win then
      update public.vkl_sm_member set dung_q = null, dung_r = null
       where mon_id = t.mon_id and dung_q = t.q and dung_r = t.r;
      update public.vkl_sm_tile set mon_id = c.mon_id, chinh_dien = false, chiem_luc = now(),
        bao_ho_toi = now() + make_interval(hours => vkl_priv.sm_cfg('gio', 'bao_ho_gio')::int)
       where ky_id = t.ky_id and q = t.q and r = t.r;
      perform vkl_priv.sm_chon_cd(c.ky_id, t.mon_id);
      perform vkl_priv.sm_chon_cd(c.ky_id, c.mon_id);
      if not exists (select 1 from public.vkl_sm_tile where ky_id = c.ky_id and mon_id = t.mon_id) then
        insert into public.vkl_sm_bao (ky_id, loai, mon_a, mon_b, q, r) values (c.ky_id, 'mat_het', t.mon_id, c.mon_id, t.q, t.r);
      end if;
    else
      update public.vkl_sm_member m set nghi_toi = now() + make_interval(hours => vkl_priv.sm_cfg('gio', 'nghi_gio')::int)
        from public.vkl_sm_chinh_theo th where th.chinh_id = c.id and th.player_id = m.player_id;
    end if;
    v_kq := jsonb_build_object('kq', case when v_win then 'thang' else 'thua' end,
      'atk', round(v_atk), 'def', round(v_def), 'n_atk', v_n_atk, 'n_def', v_n_def,
      'kv_a', v_kv_a, 'kv_b', v_kv_b, 'dem', v_dem, 'mot_o', v_mot, 'mon_b', t.mon_id);
    -- đánh dấu: một cặp môn đánh nhau một chiều liên tục (từ 6 trận trong 24 giờ, bên kia không đánh lại)
    if (select count(*) from public.vkl_sm_bao where loai = 'tran' and mon_a = c.mon_id and mon_b = t.mon_id and luc > now() - interval '1 day') = 5
       and not exists (select 1 from public.vkl_sm_bao where loai = 'tran' and mon_a = t.mon_id and mon_b = c.mon_id and luc > now() - interval '1 day') then
      perform vkl_priv.sm_flag('mot_chieu', jsonb_build_object('a', c.mon_id, 'b', t.mon_id));
    end if;
  end if;

  update public.vkl_sm_chinh set trang_thai = case when v_kq ->> 'kq' = 'huy' then 'huy' else 'xong' end, ket_qua = v_kq where id = c.id;
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, mon_b, q, r, noi_dung)
  values (c.ky_id, case when v_kq ->> 'kq' = 'cam_co' then 'cam_co' when v_kq ->> 'kq' = 'huy' then 'huy' else 'tran' end,
          c.mon_id, t.mon_id, t.q, t.r, v_kq || jsonb_build_object('ten_o', t.ten, 'chinh', c.id));
  return v_kq;
end;
$$;

-- ---------- Việc chạy mỗi phút ----------
create or replace function vkl_priv.sm_tick()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  r record; v_n_tr int := 0; v_n_ch int := 0; v_n_gt int := 0; v_ky int; v_day date; v_lap jsonb; v_full numeric;
begin
  -- trinh sát xong: số người đứng giữ thật, Lực chiến ước tính sai số ±15%
  for r in select * from public.vkl_sm_trinh where ket_qua is null and xong_luc <= now() order by xong_luc for update skip locked loop
    update public.vkl_sm_trinh s set ket_qua = (
      select case when t.mon_id is null then jsonb_build_object('trong', true, 'ten_o', t.ten)
        else jsonb_build_object('trong', false, 'ten_o', t.ten, 'mon', t.mon_id, 'n', g.n,
          'lc', round(g.lc * vkl_priv.sm_cfg('tran', 'san_nha') * (0.85 + random() * 0.3)), 'bao_ho_toi', t.bao_ho_toi) end
      from public.vkl_sm_tile t left join lateral vkl_priv.sm_giu(t.ky_id, t.mon_id, t.q, t.r) g on t.mon_id is not null
      where t.ky_id = r.ky_id and t.q = r.q and t.r = r.r)
    where s.id = r.id;
    v_n_tr := v_n_tr + 1;
  end loop;

  -- hết giờ tập hợp: lên đường (không ai theo thì hủy)
  for r in select * from public.vkl_sm_chinh where trang_thai = 'tap_hop' and tap_hop_toi <= now() for update skip locked loop
    if exists (select 1 from public.vkl_sm_chinh_theo where chinh_id = r.id) then
      update public.vkl_sm_chinh set trang_thai = 'di' where id = r.id;
    else
      update public.vkl_sm_chinh set trang_thai = 'huy', ket_qua = '{"kq":"huy","ly_do":"khong_nguoi"}' where id = r.id;
    end if;
  end loop;

  -- tới nơi: tính trận
  for r in select id from public.vkl_sm_chinh where trang_thai = 'di' and toi_noi_luc <= now() order by toi_noi_luc, id loop
    perform vkl_priv.sm_tran(r.id);
    v_n_ch := v_n_ch + 1;
  end loop;

  -- môn hết 24 giờ chưa đủ chữ ký: giải tán
  for r in select id from public.vkl_sm_mon where not du_ky and giai_tan_luc is null and het_han_ky <= now() loop
    perform vkl_priv.sm_giai_tan(r.id, 'thieu_ky');
    v_n_gt := v_n_gt + 1;
  end loop;

  -- 5:00 mỗi ngày: van an toàn lập môn (các môn đầy trên 80% chỗ thì hạ điều kiện)
  v_day := vkl_priv.sm_day();
  select v into v_lap from public.vkl_sm_cfg where k = 'lap';
  if coalesce(v_lap ->> 'xet', '') <> v_day::text then
    v_ky := vkl_priv.sm_ky_now();
    select case when count(*) = 0 then 0 else sum(n)::numeric / (count(*) * vkl_priv.sm_cfg('mon', 'toi_da')) end into v_full
      from (select m.id, vkl_priv.sm_mon_n(m.id) n from public.vkl_sm_mon m where m.ky_lap = v_ky and m.giai_tan_luc is null) x;
    update public.vkl_sm_cfg set v = v || jsonb_build_object('xet', v_day::text, 'ha', coalesce(v_full, 0) > 0.8, 'day', round(coalesce(v_full, 0), 3))
     where k = 'lap';
  end if;

  return jsonb_build_object('trinh', v_n_tr, 'chinh', v_n_ch, 'giai_tan', v_n_gt);
end;
$$;

-- ---------- RPC ----------

-- trạng thái của ta
create or replace function public.vkl_sm_state(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := vkl_priv.sm_me(p_token);
  v_ky int := vkl_priv.sm_ky_now();
  m public.vkl_sm_member; v_mon public.vkl_sm_mon; v_kn record; v_lap jsonb; v_out jsonb; v_day date := vkl_priv.sm_day();
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  select * into v_kn from vkl_priv.sm_kiep_ngay(v_me);
  select v into v_lap from public.vkl_sm_cfg where k = 'lap';
  v_out := jsonb_build_object(
    'ky', (select to_jsonb(k) from public.vkl_sm_ky k where id = coalesce(v_ky, (select max(id) from public.vkl_sm_ky))),
    'ky_chay', v_ky is not null,
    'lc', vkl_priv.sm_lc_get(v_me),
    'lc_phan', (select phan from public.vkl_sm_luc_chien where player_id = v_me),
    'kiep', v_kn.kiep, 'ngay', v_kn.ngay,
    'lap_can', jsonb_build_object(
      'kiep', case when (v_lap ->> 'ha')::boolean then (v_lap ->> 'kiep_ha')::int else (v_lap ->> 'kiep')::int end,
      'ngay', case when (v_lap ->> 'ha')::boolean then (v_lap ->> 'ngay_ha')::int else (v_lap ->> 'ngay')::int end,
      'ha', (v_lap ->> 'ha')::boolean),
    'khoa_toi', case when m.khoa_toi > now() then m.khoa_toi end,
    'nghi_toi', case when m.nghi_toi > now() then m.nghi_toi end,
    'ky_cung', (select coalesce(jsonb_agg(mon_id), '[]') from public.vkl_sm_mon_ky where player_id = v_me),
    'don', (select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'mon', d.mon_id, 'ten', mo.ten)), '[]')
            from public.vkl_sm_don d join public.vkl_sm_mon mo on mo.id = d.mon_id where d.player_id = v_me and d.trang_thai = 'cho'),
    'mon', null);
  if m.mon_id is null then return v_out; end if;

  perform vkl_priv.sm_nv_ensure(v_me, m.mon_id);
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id;
  return v_out || jsonb_build_object(
    'mon', jsonb_build_object(
      'id', v_mon.id, 'ten', v_mon.ten, 'ten1', v_mon.ten1, 'ten2', v_mon.ten2, 'ten3', v_mon.ten3,
      'huy_hieu', v_mon.huy_hieu, 'chinh_dien_hinh', v_mon.chinh_dien_hinh,
      'dk_kiep', v_mon.dk_kiep, 'dk_tuoi_dao', v_mon.dk_tuoi_dao, 'mo_cua', v_mon.mo_cua,
      'du_ky', v_mon.du_ky, 'het_han_ky', v_mon.het_han_ky, 'cam_co', v_mon.cam_co_luc is not null,
      'so_ky', (select count(*) from public.vkl_sm_mon_ky where mon_id = v_mon.id),
      'n', vkl_priv.sm_mon_n(v_mon.id), 'o', (select count(*) from public.vkl_sm_tile where mon_id = v_mon.id), 'o_max', vkl_priv.sm_o_max(v_mon.id),
      'kv_hom_nay', coalesce((select khi_van from public.vkl_sm_ngay where mon_id = v_mon.id and ngay = v_day), 0),
      'kv_hom_qua', coalesce((select khi_van from public.vkl_sm_ngay where mon_id = v_mon.id and ngay = v_day - 1), 0),
      'kv_bonus', vkl_priv.sm_kv_bonus(v_mon.id),
      'chuc', m.chuc, 'dung', case when m.dung_q is not null then jsonb_build_array(m.dung_q, m.dung_r) end,
      'tiles', (select coalesce(jsonb_agg(jsonb_build_object('q', q, 'r', r, 'ten', ten, 'cd', chinh_dien, 'bao_ho_toi', bao_ho_toi)), '[]')
                from public.vkl_sm_tile where mon_id = v_mon.id),
      'don_cho', case when m.chuc in ('chu', 'lao') then (select count(*) from public.vkl_sm_don where mon_id = v_mon.id and trang_thai = 'cho') end),
    'diem_danh', jsonb_build_object(
      'hom_nay', exists (select 1 from public.vkl_sm_diem_danh where player_id = v_me and ngay = v_day),
      'chuoi', coalesce((select chuoi from public.vkl_sm_diem_danh where player_id = v_me and ngay in (v_day, v_day - 1) order by ngay desc limit 1), 0),
      'da_thuong', exists (select 1 from public.vkl_sm_thuong where player_id = v_me and ky_id = v_ky and loai = 'chuoi7')),
    'nv', (select jsonb_build_object('bac', bac, 'kiep', kiep, 'tuoi', tuoi, 'canh', canh, 'xong', to_jsonb(xong),
             'muc', to_jsonb(vkl_priv.sm_nv_muc(bac)), 'thuong', '[2,3,5]'::jsonb)
           from public.vkl_sm_nv where player_id = v_me and ngay = v_day),
    'chinh', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'toi', jsonb_build_array(c.toi_q, c.toi_r),
               'ten_o', t.ten, 'tap_hop_toi', c.tap_hop_toi, 'toi_noi_luc', c.toi_noi_luc, 'trang_thai', c.trang_thai,
               'n', (select count(*) from public.vkl_sm_chinh_theo th where th.chinh_id = c.id),
               'ta_theo', exists (select 1 from public.vkl_sm_chinh_theo th where th.chinh_id = c.id and th.player_id = v_me))
               order by c.id), '[]')
              from public.vkl_sm_chinh c join public.vkl_sm_tile t on t.ky_id = c.ky_id and t.q = c.toi_q and t.r = c.toi_r
              where c.mon_id = v_mon.id and c.trang_thai in ('tap_hop', 'di')),
    'bi_danh', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'o', jsonb_build_array(c.toi_q, c.toi_r), 'ten_o', t.ten,
               'tu_mon', mo.ten, 'huy_hieu', mo.huy_hieu, 'toi_noi_luc', c.toi_noi_luc, 'trang_thai', c.trang_thai) order by c.toi_noi_luc), '[]')
              from public.vkl_sm_chinh c join public.vkl_sm_tile t on t.ky_id = c.ky_id and t.q = c.toi_q and t.r = c.toi_r
              join public.vkl_sm_mon mo on mo.id = c.mon_id
              where t.mon_id = v_mon.id and c.trang_thai in ('tap_hop', 'di')),
    'trinh', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'o', jsonb_build_array(s.q, s.r), 'xong_luc', s.xong_luc, 'ket_qua', s.ket_qua) order by s.id desc), '[]')
              from (select * from public.vkl_sm_trinh where mon_id = v_mon.id order by id desc limit 10) s),
    'bao', (select coalesce(jsonb_agg(jsonb_build_object('id', b.id, 'luc', b.luc, 'loai', b.loai, 'a', b.mon_a, 'b', b.mon_b,
              'ten_a', ma.ten, 'ten_b', mb.ten, 'o', jsonb_build_array(b.q, b.r), 'nd', b.noi_dung) order by b.id desc), '[]')
            from (select * from public.vkl_sm_bao where mon_a = v_mon.id or mon_b = v_mon.id order by id desc limit 15) b
            left join public.vkl_sm_mon ma on ma.id = b.mon_a left join public.vkl_sm_mon mb on mb.id = b.mon_b));
end;
$$;

-- danh sách môn của Kỷ đang chạy (cả môn đang chờ chữ ký)
create or replace function public.vkl_sm_list(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_ky int := vkl_priv.sm_ky_now(); v_kn record;
begin
  select * into v_kn from vkl_priv.sm_kiep_ngay(v_me);
  return (select coalesce(jsonb_agg(x order by (x ->> 'du_ky')::boolean desc, (x ->> 'n')::int desc), '[]') from (
    select jsonb_build_object('id', m.id, 'ten', m.ten, 'huy_hieu', m.huy_hieu, 'chinh_dien_hinh', m.chinh_dien_hinh,
      'n', vkl_priv.sm_mon_n(m.id), 'toi_da', vkl_priv.sm_cfg('mon', 'toi_da'), 'mo_cua', m.mo_cua,
      'dk_kiep', m.dk_kiep, 'dk_tuoi_dao', m.dk_tuoi_dao, 'du_dk', v_kn.kiep >= m.dk_kiep and v_kn.ngay >= m.dk_tuoi_dao,
      'o', (select count(*) from public.vkl_sm_tile t where t.mon_id = m.id),
      'du_ky', m.du_ky, 'so_ky', (select count(*) from public.vkl_sm_mon_ky k where k.mon_id = m.id), 'het_han_ky', m.het_han_ky,
      'ta_ky', exists (select 1 from public.vkl_sm_mon_ky k where k.mon_id = m.id and k.player_id = v_me),
      'mon_chu', (select coalesce(p.meta -> 'chanThan' ->> 'name', p.username) from public.vkl_players p where p.id = m.mon_chu),
      'lc', (select coalesce(sum(l.lc), 0) from public.vkl_sm_member mm join public.vkl_sm_luc_chien l on l.player_id = mm.player_id where mm.mon_id = m.id)) x
    from public.vkl_sm_mon m where m.ky_lap = v_ky and m.giai_tan_luc is null) y);
end;
$$;

-- lập môn
create or replace function public.vkl_sm_found(p_token uuid, p_ten1 text, p_ten2 text, p_ten3 text,
  p_huy_hieu int, p_chinh_dien int, p_dk_kiep int default 0, p_dk_tuoi_dao int default 0, p_mo_cua boolean default true)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := vkl_priv.sm_me(p_token); v_ky int := vkl_priv.sm_ky_now(); v_kn record; v_lap jsonb; v_id bigint; v_err text; v_can_k int; v_can_n int;
  t1 text[] := array['Thanh','Huyền','Tử','Bích','Kim','Ngọc','Thiên','Vân','Lăng','Hàn','Liệt','Bạch','Xích','U','Thái','Vô','Cửu','Lạc','Thương','Phi'];
  t2 text[] := array['Hư','Tiêu','Dương','Nguyệt','Phong','Lôi','Kiếm','Hà','Sơn','Hải','Linh','Đỉnh','Vân','Tinh','Hỏa','Thủy','Mộc','Long','Phượng','Hạc'];
  t3 text[] := array['Tông','Môn','Phái','Cung','Các','Cốc','Điện','Sơn Trang','Đạo Viện','Kiếm Phái'];
begin
  if v_ky is null then raise exception 'SM_CHUA_MO'; end if;
  if not (p_ten1 = any (t1) and p_ten2 = any (t2) and p_ten3 = any (t3)) then raise exception 'SM_TEN'; end if;
  if p_huy_hieu not between 0 and 29 or p_chinh_dien not between 0 and 9 then raise exception 'SM_HINH'; end if;
  if coalesce(p_dk_kiep, 0) not between 0 and 1000 or coalesce(p_dk_tuoi_dao, 0) not between 0 and 30 then raise exception 'SM_DK'; end if;
  perform pg_advisory_xact_lock(hashtext('vkl_sm_player'), hashtext(v_me::text));
  v_err := vkl_priv.sm_ranh(v_me);
  if v_err is not null then raise exception '%', v_err; end if;
  select * into v_kn from vkl_priv.sm_kiep_ngay(v_me);
  select v into v_lap from public.vkl_sm_cfg where k = 'lap';
  v_can_k := (v_lap ->> (case when (v_lap ->> 'ha')::boolean then 'kiep_ha' else 'kiep' end))::int;
  v_can_n := (v_lap ->> (case when (v_lap ->> 'ha')::boolean then 'ngay_ha' else 'ngay' end))::int;
  if v_kn.kiep < v_can_k or v_kn.ngay < v_can_n then
    raise exception 'SM_CHUA_DU_LAP';
  end if;
  if exists (select 1 from public.vkl_sm_mon where ky_lap = v_ky and giai_tan_luc is null and ten = p_ten1 || ' ' || p_ten2 || ' ' || p_ten3) then
    raise exception 'SM_TRUNG_TEN';
  end if;
  insert into public.vkl_sm_mon (ky_lap, ten1, ten2, ten3, huy_hieu, chinh_dien_hinh, dk_kiep, dk_tuoi_dao, mo_cua, mon_chu, het_han_ky)
  values (v_ky, p_ten1, p_ten2, p_ten3, p_huy_hieu, p_chinh_dien, coalesce(p_dk_kiep, 0), coalesce(p_dk_tuoi_dao, 0), coalesce(p_mo_cua, true), v_me,
          now() + make_interval(hours => vkl_priv.sm_cfg('gio', 'ky_gio')::int))
  returning id into v_id;
  perform vkl_priv.sm_vao(v_me, v_id, 'lap');
  update public.vkl_sm_member set chuc = 'chu' where player_id = v_me;
  return jsonb_build_object('id', v_id);
end;
$$;

-- ký cùng lập (mỗi người ký tối đa 2 môn mỗi Kỷ; không ký môn của chính mình)
create or replace function public.vkl_sm_cosign(p_token uuid, p_mon bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_mon public.vkl_sm_mon; v_n int;
begin
  select * into v_mon from public.vkl_sm_mon where id = p_mon for update;
  if v_mon.id is null or v_mon.giai_tan_luc is not null then raise exception 'SM_KHONG_CO_MON'; end if;
  if v_mon.du_ky then raise exception 'SM_DA_DU_KY'; end if;
  if v_mon.mon_chu = v_me or exists (select 1 from public.vkl_sm_member where player_id = v_me and mon_id = p_mon and chuc = 'chu') then
    raise exception 'SM_TU_KY';
  end if;
  if exists (select 1 from public.vkl_sm_mon_ky where mon_id = p_mon and player_id = v_me) then raise exception 'SM_DA_KY'; end if;
  if (select count(*) from public.vkl_sm_mon_ky k join public.vkl_sm_mon m on m.id = k.mon_id
      where k.player_id = v_me and m.ky_lap = v_mon.ky_lap) >= 2 then raise exception 'SM_KY_NHIEU'; end if;
  insert into public.vkl_sm_mon_ky (mon_id, player_id) values (p_mon, v_me);
  select count(*) into v_n from public.vkl_sm_mon_ky where mon_id = p_mon;
  if v_n >= vkl_priv.sm_cfg('mon', 'ky_can') then update public.vkl_sm_mon set du_ky = true where id = p_mon; end if;
  if exists (select 1 from public.vkl_players where id = v_me and created_at > now() - interval '3 day') then
    perform vkl_priv.sm_flag('ky_moi', jsonb_build_object('mon', p_mon, 'player', v_me));
  end if;
  return jsonb_build_object('so_ky', v_n, 'du_ky', v_n >= vkl_priv.sm_cfg('mon', 'ky_can'));
end;
$$;

-- cắm cờ ô đầu tiên (hoặc lại từ đầu khi mất hết ô: ô trống bất kỳ, bảo hộ 12 giờ)
create or replace function public.vkl_sm_pick_tile(p_token uuid, p_q int, p_r int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_mon public.vkl_sm_mon; t public.vkl_sm_tile; v_bh timestamptz;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  if m.chuc not in ('chu', 'lao') then raise exception 'SM_QUYEN'; end if;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id for update;
  if exists (select 1 from public.vkl_sm_tile where mon_id = v_mon.id) then raise exception 'SM_DA_CO_O'; end if;
  select * into t from public.vkl_sm_tile where ky_id = v_mon.ky_lap and q = p_q and r = p_r for update;
  if t.ky_id is null then raise exception 'SM_O'; end if;
  if t.mon_id is not null then raise exception 'SM_O_CO_CHU'; end if;
  if exists (select 1 from public.vkl_sm_chinh where ky_id = t.ky_id and toi_q = p_q and toi_r = p_r and trang_thai in ('tap_hop', 'di')) then
    raise exception 'SM_O_DANG_BI_TOI';
  end if;
  v_bh := case when v_mon.cam_co_luc is not null then now() + make_interval(hours => vkl_priv.sm_cfg('gio', 'bao_ho_mat_het_gio')::int) end;
  update public.vkl_sm_tile set mon_id = v_mon.id, chinh_dien = true, bao_ho_toi = v_bh, chiem_luc = now()
   where ky_id = t.ky_id and q = p_q and r = p_r;
  update public.vkl_sm_mon set cam_co_luc = coalesce(cam_co_luc, now()) where id = v_mon.id;
  update public.vkl_sm_member set dung_q = null, dung_r = null where mon_id = v_mon.id;
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, q, r, noi_dung)
  values (t.ky_id, 'cam_co', v_mon.id, p_q, p_r, jsonb_build_object('kq', 'cam_co', 'ten_o', t.ten, 'dau', true, 'bao_ho_toi', v_bh));
  return jsonb_build_object('ok', true, 'bao_ho_toi', v_bh);
end;
$$;

-- vào môn mở cửa
create or replace function public.vkl_sm_join(p_token uuid, p_mon bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_mon public.vkl_sm_mon; v_err text;
begin
  perform pg_advisory_xact_lock(hashtext('vkl_sm_player'), hashtext(v_me::text));
  select * into v_mon from public.vkl_sm_mon where id = p_mon for update;
  if v_mon.id is null or v_mon.giai_tan_luc is not null or v_mon.ky_lap is distinct from vkl_priv.sm_ky_now() then raise exception 'SM_KHONG_CO_MON'; end if;
  v_err := vkl_priv.sm_ranh(v_me);
  if v_err is not null then raise exception '%', v_err; end if;
  if not v_mon.mo_cua then raise exception 'SM_CAN_DON'; end if;
  if not vkl_priv.sm_du_dk(v_me, p_mon) then raise exception 'SM_CHUA_DU_DK'; end if;
  if vkl_priv.sm_mon_n(p_mon) >= vkl_priv.sm_cfg('mon', 'toi_da') then raise exception 'SM_DAY'; end if;
  perform vkl_priv.sm_vao(v_me, p_mon, 'mo_cua');
  return jsonb_build_object('ok', true);
end;
$$;

-- xin vào môn duyệt đơn
create or replace function public.vkl_sm_apply(p_token uuid, p_mon bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_mon public.vkl_sm_mon; v_err text;
begin
  select * into v_mon from public.vkl_sm_mon where id = p_mon;
  if v_mon.id is null or v_mon.giai_tan_luc is not null or v_mon.ky_lap is distinct from vkl_priv.sm_ky_now() then raise exception 'SM_KHONG_CO_MON'; end if;
  v_err := vkl_priv.sm_ranh(v_me);
  if v_err is not null then raise exception '%', v_err; end if;
  if v_mon.mo_cua then raise exception 'SM_MO_CUA'; end if;
  if not vkl_priv.sm_du_dk(v_me, p_mon) then raise exception 'SM_CHUA_DU_DK'; end if;
  if (select count(*) from public.vkl_sm_don where player_id = v_me and trang_thai = 'cho') >= 3 then raise exception 'SM_DON_NHIEU'; end if;
  insert into public.vkl_sm_don (mon_id, player_id) values (p_mon, v_me) on conflict do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

-- danh sách đơn và thành viên (cho màn Thành viên, Ngày 5)
create or replace function public.vkl_sm_members(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_day date := vkl_priv.sm_day();
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  return jsonb_build_object(
    'ds', (select coalesce(jsonb_agg(jsonb_build_object('ten', coalesce(p.meta -> 'chanThan' ->> 'name', p.username), 'tk', p.username,
            'chuc', x.chuc, 'lc', coalesce(l.lc, 0), 'dung', case when x.dung_q is not null then jsonb_build_array(x.dung_q, x.dung_r) end,
            'nghi', x.nghi_toi > now(),
            'kv', coalesce((select (case when n.xong[1] then 2 else 0 end) + (case when n.xong[2] then 3 else 0 end) + (case when n.xong[3] then 5 else 0 end)
                            from public.vkl_sm_nv n where n.player_id = x.player_id and n.ngay = v_day), 0)
                  + case when exists (select 1 from public.vkl_sm_diem_danh d where d.player_id = x.player_id and d.ngay = v_day) then 1 else 0 end)
            order by case x.chuc when 'chu' then 0 when 'lao' then 1 else 2 end, l.lc desc nulls last), '[]')
           from public.vkl_sm_member x join public.vkl_players p on p.id = x.player_id
           left join public.vkl_sm_luc_chien l on l.player_id = x.player_id where x.mon_id = m.mon_id),
    'don', case when m.chuc in ('chu', 'lao') then (select coalesce(jsonb_agg(jsonb_build_object('id', d.id,
             'ten', coalesce(p.meta -> 'chanThan' ->> 'name', p.username), 'lc', vkl_priv.sm_lc_get(d.player_id), 'luc', d.luc) order by d.id), '[]')
           from public.vkl_sm_don d join public.vkl_players p on p.id = d.player_id where d.mon_id = m.mon_id and d.trang_thai = 'cho') end);
end;
$$;

-- nhận hoặc từ chối đơn
create or replace function public.vkl_sm_accept(p_token uuid, p_don bigint, p_nhan boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; d public.vkl_sm_don; v_err text;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  select * into d from public.vkl_sm_don where id = p_don and trang_thai = 'cho' for update;
  if d.id is null then raise exception 'SM_DON'; end if;
  if m.mon_id is distinct from d.mon_id or m.chuc not in ('chu', 'lao') then raise exception 'SM_QUYEN'; end if;
  if not p_nhan then
    update public.vkl_sm_don set trang_thai = 'tu_choi' where id = d.id;
    return jsonb_build_object('ok', true);
  end if;
  perform pg_advisory_xact_lock(hashtext('vkl_sm_player'), hashtext(d.player_id::text));
  perform 1 from public.vkl_sm_mon where id = d.mon_id for update;
  v_err := vkl_priv.sm_ranh(d.player_id);
  if v_err is not null then update public.vkl_sm_don set trang_thai = 'huy' where id = d.id; raise exception '%', v_err; end if;
  if vkl_priv.sm_mon_n(d.mon_id) >= vkl_priv.sm_cfg('mon', 'toi_da') then raise exception 'SM_DAY'; end if;
  update public.vkl_sm_don set trang_thai = 'nhan' where id = d.id;
  perform vkl_priv.sm_vao(d.player_id, d.mon_id, 'don');
  return jsonb_build_object('ok', true);
end;
$$;

-- đuổi (môn chủ đuổi ai cũng được trừ chính mình; trưởng lão chỉ đuổi đệ tử). Bị đuổi thì vào môn khác ngay.
create or replace function public.vkl_sm_kick(p_token uuid, p_username text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; x public.vkl_sm_member;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  select mb.* into x from public.vkl_sm_member mb join public.vkl_players p on p.id = mb.player_id where p.username = p_username;
  if x.mon_id is null or x.mon_id is distinct from m.mon_id or x.player_id = v_me then raise exception 'SM_QUYEN'; end if;
  if not (m.chuc = 'chu' or (m.chuc = 'lao' and x.chuc = 'de')) then raise exception 'SM_QUYEN'; end if;
  perform vkl_priv.sm_out(x.player_id, null);
  return jsonb_build_object('ok', true);
end;
$$;

-- đặt chức (môn chủ): lao (tối đa 3) hoặc de
create or replace function public.vkl_sm_role(p_token uuid, p_username text, p_chuc text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; x public.vkl_sm_member;
begin
  if p_chuc not in ('lao', 'de') then raise exception 'SM_CHUC'; end if;
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.chuc is distinct from 'chu' then raise exception 'SM_QUYEN'; end if;
  perform 1 from public.vkl_sm_mon where id = m.mon_id for update;
  select mb.* into x from public.vkl_sm_member mb join public.vkl_players p on p.id = mb.player_id where p.username = p_username;
  if x.mon_id is distinct from m.mon_id or x.player_id = v_me then raise exception 'SM_QUYEN'; end if;
  if p_chuc = 'lao' and x.chuc <> 'lao' and (select count(*) from public.vkl_sm_member where mon_id = m.mon_id and chuc = 'lao') >= vkl_priv.sm_cfg('mon', 'lao') then
    raise exception 'SM_LAO_DU';
  end if;
  update public.vkl_sm_member set chuc = p_chuc where player_id = x.player_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- sửa điều kiện vào (môn chủ)
create or replace function public.vkl_sm_set_dk(p_token uuid, p_dk_kiep int, p_dk_tuoi_dao int, p_mo_cua boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.chuc is distinct from 'chu' then raise exception 'SM_QUYEN'; end if;
  if coalesce(p_dk_kiep, 0) not between 0 and 1000 or coalesce(p_dk_tuoi_dao, 0) not between 0 and 30 then raise exception 'SM_DK'; end if;
  update public.vkl_sm_mon set dk_kiep = coalesce(p_dk_kiep, 0), dk_tuoi_dao = coalesce(p_dk_tuoi_dao, 0), mo_cua = coalesce(p_mo_cua, mo_cua)
   where id = m.mon_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- rời môn. Môn đã cắm cờ thì phải chờ hết Kỷ mới vào môn khác. Môn chủ rời: trưởng lão Lực chiến cao nhất lên thay
-- (không có trưởng lão thì đệ tử cao nhất; không còn ai thì môn giải tán).
create or replace function public.vkl_sm_leave(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_mon public.vkl_sm_mon; v_khoa timestamptz; v_moi uuid;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id for update;
  v_khoa := case when v_mon.cam_co_luc is not null then (select ket_thuc from public.vkl_sm_ky where id = v_mon.ky_lap) end;
  perform vkl_priv.sm_out(v_me, v_khoa);
  if m.chuc = 'chu' then
    select x.player_id into v_moi from public.vkl_sm_member x left join public.vkl_sm_luc_chien l on l.player_id = x.player_id
     where x.mon_id = v_mon.id order by (x.chuc = 'lao') desc, l.lc desc nulls last limit 1;
    if v_moi is null then
      perform vkl_priv.sm_giai_tan(v_mon.id, 'het_nguoi');
    else
      update public.vkl_sm_member set chuc = 'chu' where player_id = v_moi;
      update public.vkl_sm_mon set mon_chu = v_moi where id = v_mon.id;
    end if;
  end if;
  return jsonb_build_object('ok', true, 'khoa_toi', v_khoa);
end;
$$;

-- điểm danh: +1 Khí vận cho môn; chuỗi 7 ngày liền tặng ngoại trang (mỗi Kỷ một lần)
create or replace function public.vkl_sm_checkin(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_day date := vkl_priv.sm_day(); v_chuoi int; v_ky int := vkl_priv.sm_ky_now(); v_thuong boolean := false;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  if exists (select 1 from public.vkl_sm_diem_danh where player_id = v_me and ngay = v_day) then raise exception 'SM_DA_DIEM_DANH'; end if;
  v_chuoi := coalesce((select chuoi from public.vkl_sm_diem_danh where player_id = v_me and ngay = v_day - 1), 0) + 1;
  insert into public.vkl_sm_diem_danh (player_id, ngay, mon_id, chuoi) values (v_me, v_day, m.mon_id, v_chuoi) on conflict do nothing;
  if not found then raise exception 'SM_DA_DIEM_DANH'; end if;
  perform vkl_priv.sm_add_kv(m.mon_id, 1);
  perform vkl_priv.sm_nv_ensure(v_me, m.mon_id);
  if v_chuoi >= 7 and v_ky is not null then
    insert into public.vkl_sm_thuong (player_id, ky_id, loai) values (v_me, v_ky, 'chuoi7') on conflict do nothing;
    v_thuong := found;
  end if;
  return jsonb_build_object('chuoi', v_chuoi, 'thuong', v_thuong);
end;
$$;

-- chọn ô đứng giữ (ô của môn ta)
create or replace function public.vkl_sm_guard(p_token uuid, p_q int, p_r int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  if m.nghi_toi > now() then raise exception 'SM_NGHI'; end if;
  if not exists (select 1 from public.vkl_sm_tile where mon_id = m.mon_id and q = p_q and r = p_r) then raise exception 'SM_O_KHONG_CUA_TA'; end if;
  if exists (select 1 from public.vkl_sm_chinh_theo t join public.vkl_sm_chinh c on c.id = t.chinh_id
             where t.player_id = v_me and c.trang_thai = 'di') then raise exception 'SM_DANG_DI'; end if;
  -- đang theo một lệnh đang tập hợp thì rút ra để sang giữ
  delete from public.vkl_sm_chinh_theo t using public.vkl_sm_chinh c
   where t.chinh_id = c.id and t.player_id = v_me and c.trang_thai = 'tap_hop';
  update public.vkl_sm_member set dung_q = p_q, dung_r = p_r where player_id = v_me;
  return jsonb_build_object('ok', true);
end;
$$;

-- trinh sát: 10 phút mỗi ô (tính từ ô gần nhất của môn), mỗi người một chuyến một lúc
create or replace function public.vkl_sm_scout(p_token uuid, p_q int, p_r int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_ky int; v_d int; v_xong timestamptz;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select ky_lap into v_ky from public.vkl_sm_mon where id = m.mon_id;
  if not exists (select 1 from public.vkl_sm_tile where ky_id = v_ky and q = p_q and r = p_r) then raise exception 'SM_O'; end if;
  if exists (select 1 from public.vkl_sm_trinh where player_id = v_me and ket_qua is null) then raise exception 'SM_DANG_TRINH'; end if;
  select min(vkl_priv.sm_dist(q, r, p_q, p_r)) into v_d from public.vkl_sm_tile where mon_id = m.mon_id;
  if v_d is null then raise exception 'SM_CHUA_CO_O'; end if;
  v_xong := now() + make_interval(mins => (greatest(v_d, 1) * vkl_priv.sm_cfg('gio', 'trinh_phut'))::int);
  insert into public.vkl_sm_trinh (ky_id, mon_id, player_id, q, r, xong_luc) values (v_ky, m.mon_id, v_me, p_q, p_r, v_xong);
  return jsonb_build_object('xong_luc', v_xong);
end;
$$;

-- xuất chinh: môn chủ hoặc trưởng lão, ô kề lãnh thổ, mỗi môn một lệnh một lúc. Người phát tự theo.
create or replace function public.vkl_sm_march(p_token uuid, p_q int, p_r int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_mon public.vkl_sm_mon; t public.vkl_sm_tile;
  v_tu record; v_th timestamptz; v_toi timestamptz; v_id bigint;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  if m.chuc not in ('chu', 'lao') then raise exception 'SM_QUYEN'; end if;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id for update;
  select * into t from public.vkl_sm_tile where ky_id = v_mon.ky_lap and q = p_q and r = p_r;
  if t.ky_id is null then raise exception 'SM_O'; end if;
  if t.mon_id = v_mon.id then raise exception 'SM_O_CUA_TA'; end if;
  if (select count(*) from public.vkl_sm_tile where mon_id = v_mon.id) >= vkl_priv.sm_o_max(v_mon.id) then raise exception 'SM_DU_O'; end if;
  if exists (select 1 from public.vkl_sm_chinh where mon_id = v_mon.id and trang_thai in ('tap_hop', 'di')) then raise exception 'SM_DANG_CHINH'; end if;
  if t.bao_ho_toi > now() and t.mon_id is not null then raise exception 'SM_BAO_HO'; end if;
  select q, r into v_tu from public.vkl_sm_tile where mon_id = v_mon.id and vkl_priv.sm_dist(q, r, p_q, p_r) = 1 limit 1;
  if v_tu is null then raise exception 'SM_KHONG_KE'; end if;
  if m.nghi_toi > now() then raise exception 'SM_NGHI'; end if;
  v_th := now() + make_interval(mins => vkl_priv.sm_cfg('gio', 'tap_hop_phut')::int);
  v_toi := v_th + make_interval(mins => vkl_priv.sm_cfg('gio', 'di_phut')::int);
  insert into public.vkl_sm_chinh (ky_id, mon_id, nguoi_phat, tu_q, tu_r, toi_q, toi_r, tap_hop_toi, toi_noi_luc)
  values (v_mon.ky_lap, v_mon.id, v_me, v_tu.q, v_tu.r, p_q, p_r, v_th, v_toi) returning id into v_id;
  insert into public.vkl_sm_chinh_theo (chinh_id, player_id) values (v_id, v_me);
  return jsonb_build_object('id', v_id, 'tap_hop_toi', v_th, 'toi_noi_luc', v_toi);
end;
$$;

-- theo xuất chinh (trước khi hết giờ tập hợp)
create or replace function public.vkl_sm_follow(p_token uuid, p_chinh bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; c public.vkl_sm_chinh;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  select * into c from public.vkl_sm_chinh where id = p_chinh;
  if c.id is null or c.mon_id is distinct from m.mon_id then raise exception 'SM_QUYEN'; end if;
  if c.trang_thai <> 'tap_hop' or c.tap_hop_toi <= now() then raise exception 'SM_HET_TAP_HOP'; end if;
  if m.nghi_toi > now() then raise exception 'SM_NGHI'; end if;
  insert into public.vkl_sm_chinh_theo (chinh_id, player_id) values (p_chinh, v_me) on conflict do nothing;
  return jsonb_build_object('n', (select count(*) from public.vkl_sm_chinh_theo where chinh_id = p_chinh));
end;
$$;

create or replace function public.vkl_sm_unfollow(p_token uuid, p_chinh bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); c public.vkl_sm_chinh;
begin
  select * into c from public.vkl_sm_chinh where id = p_chinh;
  if c.id is null or c.trang_thai <> 'tap_hop' or c.tap_hop_toi <= now() then raise exception 'SM_HET_TAP_HOP'; end if;
  delete from public.vkl_sm_chinh_theo where chinh_id = p_chinh and player_id = v_me;
  return jsonb_build_object('n', (select count(*) from public.vkl_sm_chinh_theo where chinh_id = p_chinh));
end;
$$;

-- bản đồ công khai (đọc qua bộ đệm Vercel 30 giây)
create or replace function public.vkl_sm_map(p_ky int default null)
returns jsonb language sql stable security definer set search_path = '' as $$
  with k as (select id, ban_kinh, bat_dau, ket_thuc from public.vkl_sm_ky
             where id = coalesce(p_ky, vkl_priv.sm_ky_now(), (select max(id) from public.vkl_sm_ky)))
  select jsonb_build_object(
    'ky', (select to_jsonb(k) from k),
    'o', (select coalesce(jsonb_agg(jsonb_build_array(t.q, t.r, t.ten, t.coi, t.mon_id, t.chinh_dien,
            case when t.bao_ho_toi > now() then t.bao_ho_toi end) order by t.r, t.q), '[]')
          from public.vkl_sm_tile t join k on k.id = t.ky_id),
    'mon', (select coalesce(jsonb_object_agg(m.id, jsonb_build_object('ten', m.ten, 'huy_hieu', m.huy_hieu)), '{}')
            from public.vkl_sm_mon m join k on k.id = m.ky_lap where m.giai_tan_luc is null),
    'di', (select coalesce(jsonb_agg(jsonb_build_object('mon', c.mon_id, 'tu', jsonb_build_array(c.tu_q, c.tu_r),
             'toi', jsonb_build_array(c.toi_q, c.toi_r), 'toi_noi_luc', c.toi_noi_luc, 'trang_thai', c.trang_thai)), '[]')
           from public.vkl_sm_chinh c join k on k.id = c.ky_id where c.trang_thai in ('tap_hop', 'di')));
$$;

-- bảng xếp hạng Kỷ: số ô, rồi tổng Khí vận cả Kỷ
create or replace function public.vkl_sm_rank(p_ky int default null)
returns jsonb language sql stable security definer set search_path = '' as $$
  with k as (select id, bat_dau, ket_thuc from public.vkl_sm_ky
             where id = coalesce(p_ky, vkl_priv.sm_ky_now(), (select max(id) from public.vkl_sm_ky))),
  x as (select m.id, m.ten, m.huy_hieu,
          (select count(*) from public.vkl_sm_tile t where t.mon_id = m.id and t.ky_id = k.id) o,
          (select coalesce(sum(n.khi_van), 0) from public.vkl_sm_ngay n where n.mon_id = m.id
             and n.ngay between vkl_priv.sm_day(k.bat_dau) and vkl_priv.sm_day(k.ket_thuc)) kv,
          vkl_priv.sm_mon_n(m.id) n
        from public.vkl_sm_mon m join k on k.id = m.ky_lap where m.giai_tan_luc is null)
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'ten', ten, 'huy_hieu', huy_hieu, 'o', o, 'kv', kv, 'n', n) order by o desc, kv desc, id), '[]') from x;
$$;

-- ---------- Quyền ----------
-- hàm nội bộ sm_*: chỉ chủ sở hữu gọi (không đụng quyền các hàm vkl_priv cũ)
do $$ declare f record; begin
  for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'vkl_priv' and p.proname like 'sm\_%' loop
    execute format('revoke all on function %s from public', f.sig);
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on function %s from anon, authenticated', f.sig);
    end if;
  end loop;
end $$;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant execute on function public.vkl_sm_state(uuid), public.vkl_sm_list(uuid), public.vkl_sm_found(uuid, text, text, text, int, int, int, int, boolean),
      public.vkl_sm_cosign(uuid, bigint), public.vkl_sm_pick_tile(uuid, int, int), public.vkl_sm_join(uuid, bigint), public.vkl_sm_apply(uuid, bigint),
      public.vkl_sm_members(uuid), public.vkl_sm_accept(uuid, bigint, boolean), public.vkl_sm_kick(uuid, text), public.vkl_sm_role(uuid, text, text),
      public.vkl_sm_set_dk(uuid, int, int, boolean), public.vkl_sm_leave(uuid), public.vkl_sm_checkin(uuid), public.vkl_sm_guard(uuid, int, int),
      public.vkl_sm_scout(uuid, int, int), public.vkl_sm_march(uuid, int, int), public.vkl_sm_follow(uuid, bigint), public.vkl_sm_unfollow(uuid, bigint),
      public.vkl_sm_map(int), public.vkl_sm_rank(int) to anon, authenticated';
  end if;
end $$;

-- ---------- pg_cron mỗi phút ----------
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('vkl_sm_tick', '* * * * *', 'select vkl_priv.sm_tick()');
  end if;
end $$;
