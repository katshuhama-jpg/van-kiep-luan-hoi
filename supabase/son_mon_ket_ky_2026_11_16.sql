-- 4.6.0 Sơn Môn, Ngày 6 (đêm 15/11/2026, lên bản 16/11, giấu sau cờ SON_MON_ON): kết Kỷ + trang quản trị.
-- Áp SAU supabase/son_mon_gon_2026_11_15.sql. Chạy lại nhiều lần không hỏng.
-- Chỉ thêm bảng, cột, hàm, job MỚI. Không sửa hay thay hàm cũ nào.
-- Không dùng "drop ... if exists": job pg_cron tạo trong khối DO có kiểm tồn tại.

-- ---------- Bảng mới ----------
-- Kết quả các Kỷ đã kết: đây là "tên môn ghi vào Sổ Sinh Tử" (giữ tên và huy hiệu lúc kết, môn có đổi về sau cũng không đổi sổ).
create table if not exists public.vkl_sm_ky_kq (
  ky_id int not null references public.vkl_sm_ky (id) on delete cascade,
  mon_id bigint not null references public.vkl_sm_mon (id) on delete cascade,
  hang int not null,
  so_o int not null default 0,
  khi_van int not null default 0,
  so_nguoi int not null default 0,
  ten text not null,
  huy_hieu int not null,
  khac_ten boolean not null default false,   -- hạng 1: tên khắc ở Sổ Sinh Tử
  khung_vang boolean not null default false, -- hạng 2-3: khung tên môn vàng
  luc timestamptz not null default now(),
  primary key (ky_id, mon_id)
);
create index if not exists vkl_sm_ky_kq_mon on public.vkl_sm_ky_kq (mon_id);
create index if not exists vkl_sm_ky_kq_hang on public.vkl_sm_ky_kq (ky_id, hang);
alter table public.vkl_sm_ky_kq enable row level security;

-- Danh sách quản trị viên Sơn Môn (theo tên đăng nhập). Thêm người: insert into public.vkl_sm_admin_user (username) values ('ten');
create table if not exists public.vkl_sm_admin_user (
  username text primary key,
  them_luc timestamptz not null default now()
);
alter table public.vkl_sm_admin_user enable row level security;
insert into public.vkl_sm_admin_user (username) values ('tudang') on conflict (username) do nothing;

-- Đánh dấu Kỷ đã kết: cột ket_xong có sẵn từ Ngày 1; thêm lúc kết và tóm tắt.
alter table public.vkl_sm_ky add column if not exists ket_luc timestamptz;
alter table public.vkl_sm_ky add column if not exists ket_tom jsonb;
create index if not exists vkl_sm_ky_cho_ket on public.vkl_sm_ky (ket_thuc) where not ket_xong;

-- ---------- Kết một Kỷ ----------
-- 1. Lệnh đã tới nơi trước giờ kết thì tính trận cho xong (cron kết Kỷ có thể chạy trước cron tick trong cùng phút).
-- 2. Xếp hạng theo số ô giữ lúc hết Kỷ, bằng nhau xét tổng Khí vận cả Kỷ, rồi môn lập trước.
-- 3. Ghi vkl_sm_ky_kq. Thưởng (chỉ trang trí, vkl_sm_thuong): hạng 1 'hang1' (hào quang chân thân) cho mọi thành viên,
--    hạng 2-3 'hang2_3' (khung tên môn vàng); hạng chỉ có thưởng khi môn còn giữ ít nhất 1 ô.
--    Ai đủ 7 ngày điểm danh trong Kỷ nhận 'chuoi7' (ngoại trang); đã nhận từ chuỗi 7 ngày thì không phát trùng.
-- 4. Mọi ô về trống, hủy lệnh xuất chinh và trinh sát đang chạy, mở khóa thành viên, xóa nghỉ, xóa ô đứng giữ.
--    Tên, huy hiệu, người trong môn giữ nguyên. cam_co_luc về null (Kỷ sau cắm cờ đầu lại không có bảo hộ, rời môn chưa bị khóa).
create or replace function vkl_priv.sm_ket_ky(p_ky int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  k public.vkl_sm_ky; r record; v_n_tran int := 0; v_tom jsonb; v_d0 date; v_d1 date;
begin
  select * into k from public.vkl_sm_ky where id = p_ky for update;
  if k.id is null then raise exception 'SM_KY'; end if;
  if k.ket_xong then return coalesce(k.ket_tom, '{}'::jsonb) || jsonb_build_object('da_ket', true); end if;

  -- 1. trận đã tới nơi trước giờ kết
  for r in select * from public.vkl_sm_chinh where ky_id = p_ky and trang_thai in ('tap_hop', 'di')
             and toi_noi_luc <= k.ket_thuc order by toi_noi_luc, id for update loop
    if r.trang_thai = 'tap_hop' then
      if exists (select 1 from public.vkl_sm_chinh_theo where chinh_id = r.id) then
        update public.vkl_sm_chinh set trang_thai = 'di' where id = r.id;
      else
        update public.vkl_sm_chinh set trang_thai = 'huy', ket_qua = '{"kq":"huy","ly_do":"khong_nguoi"}' where id = r.id;
        continue;
      end if;
    end if;
    perform vkl_priv.sm_tran(r.id);
    v_n_tran := v_n_tran + 1;
  end loop;

  -- 2 + 3. xếp hạng, ghi Sổ Sinh Tử
  v_d0 := vkl_priv.sm_day(k.bat_dau);
  v_d1 := vkl_priv.sm_day(k.ket_thuc);
  insert into public.vkl_sm_ky_kq (ky_id, mon_id, hang, so_o, khi_van, so_nguoi, ten, huy_hieu, khac_ten, khung_vang)
  select p_ky, x.id, x.hang, x.o, x.kv, x.n, x.ten, x.huy_hieu, x.hang = 1 and x.o > 0, x.hang in (2, 3) and x.o > 0
  from (
    select y.*, row_number() over (order by y.o desc, y.kv desc, y.lap_luc, y.id)::int hang
    from (
      select m.id, m.ten, m.huy_hieu, m.lap_luc,
        (select count(*) from public.vkl_sm_tile t where t.ky_id = p_ky and t.mon_id = m.id)::int o,
        (select coalesce(sum(n.khi_van), 0) from public.vkl_sm_ngay n where n.mon_id = m.id and n.ngay between v_d0 and v_d1)::int kv,
        vkl_priv.sm_mon_n(m.id) n
      from public.vkl_sm_mon m where m.ky_lap = p_ky and m.giai_tan_luc is null
    ) y
  ) x
  on conflict (ky_id, mon_id) do nothing;

  insert into public.vkl_sm_thuong (player_id, ky_id, loai)
  select mb.player_id, p_ky, case when q.hang = 1 then 'hang1' else 'hang2_3' end
  from public.vkl_sm_ky_kq q join public.vkl_sm_member mb on mb.mon_id = q.mon_id
  where q.ky_id = p_ky and (q.khac_ten or q.khung_vang)
  on conflict do nothing;

  insert into public.vkl_sm_thuong (player_id, ky_id, loai)
  select d.player_id, p_ky, 'chuoi7' from public.vkl_sm_diem_danh d
  where d.ngay between v_d0 and v_d1 group by d.player_id having count(distinct d.ngay) >= 7
  on conflict do nothing;

  -- 4. dọn bản đồ và lệnh
  update public.vkl_sm_chinh set trang_thai = 'huy', ket_qua = coalesce(ket_qua, '{}'::jsonb) || '{"kq":"huy","ly_do":"het_ky"}'
   where ky_id = p_ky and trang_thai in ('tap_hop', 'di');
  update public.vkl_sm_trinh set ket_qua = '{"het_ky":true}' where ky_id = p_ky and ket_qua is null;
  update public.vkl_sm_tile set mon_id = null, chinh_dien = false, bao_ho_toi = null, chiem_luc = null
   where ky_id = p_ky and (mon_id is not null or bao_ho_toi is not null or chinh_dien);
  update public.vkl_sm_member mb set dung_q = null, dung_r = null, nghi_toi = null
    from public.vkl_sm_mon m where m.id = mb.mon_id and m.ky_lap = p_ky;
  -- khóa thành viên (tự rời môn đã cắm cờ) chỉ kéo tới hết Kỷ, mỗi lúc chỉ một Kỷ chạy: mở hết
  -- (kể cả khi giờ kết thúc Kỷ bị dời sớm hơn khóa đã đặt)
  update public.vkl_sm_member set khoa_toi = null where khoa_toi is not null;
  update public.vkl_sm_mon set cam_co_luc = null where ky_lap = p_ky and cam_co_luc is not null;

  v_tom := jsonb_build_object('tran', v_n_tran,
    'mon', (select count(*) from public.vkl_sm_ky_kq where ky_id = p_ky),
    'hang1', (select mon_id from public.vkl_sm_ky_kq where ky_id = p_ky and khac_ten),
    'thuong', (select jsonb_object_agg(loai, n) from (select loai, count(*) n from public.vkl_sm_thuong where ky_id = p_ky group by loai) z));
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, noi_dung)
  values (p_ky, 'ket_ky', (select mon_id from public.vkl_sm_ky_kq where ky_id = p_ky and hang = 1), v_tom);
  update public.vkl_sm_ky set ket_xong = true, ket_luc = now(), ket_tom = v_tom where id = p_ky;
  return v_tom;
end;
$$;

-- Việc của job vkl_sm_ket_ky: chỉ làm khi có Kỷ đã quá giờ kết thúc mà chưa kết.
create or replace function vkl_priv.sm_ket_ky_tick()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r record; v_out jsonb := '[]';
begin
  for r in select id from public.vkl_sm_ky where not ket_xong and ket_thuc <= now() order by id loop
    v_out := v_out || jsonb_build_array(jsonb_build_object('ky', r.id, 'kq', vkl_priv.sm_ket_ky(r.id)));
  end loop;
  return v_out;
end;
$$;

-- Mở Kỷ mới và mang các môn còn sống của Kỷ vừa kết sang (giữ tên, huy hiệu, người). Dùng thay sm_ky_create từ Kỷ 2.
-- Các RPC cũ chỉ thấy môn có ky_lap = Kỷ đang chạy, nên không mang sang thì môn cũ không cắm cờ, không hiện trong danh sách.
create or replace function vkl_priv.sm_ky_moi(p_bat_dau timestamptz, p_ket_thuc timestamptz, p_ban_kinh int)
returns int language plpgsql security definer set search_path = '' as $$
declare v_cu int; v_id int;
begin
  if exists (select 1 from public.vkl_sm_ky where not ket_xong) then raise exception 'SM_KY_CHUA_KET'; end if;
  select max(id) into v_cu from public.vkl_sm_ky;
  v_id := vkl_priv.sm_ky_create(p_bat_dau, p_ket_thuc, p_ban_kinh);
  if v_cu is not null then
    update public.vkl_sm_mon set ky_lap = v_id, cam_co_luc = null where ky_lap = v_cu and giai_tan_luc is null;
  end if;
  return v_id;
end;
$$;

-- ---------- RPC công khai: kết quả các Kỷ đã kết (Sổ Sinh Tử) ----------
create or replace function public.vkl_sm_ky_kq()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('ky', k.id, 'bat_dau', k.bat_dau, 'ket_thuc', k.ket_thuc,
    'mon', (select coalesce(jsonb_agg(jsonb_build_object('hang', q.hang, 'ten', q.ten, 'huy_hieu', q.huy_hieu,
              'o', q.so_o, 'kv', q.khi_van, 'n', q.so_nguoi, 'khac', q.khac_ten, 'vang', q.khung_vang) order by q.hang), '[]')
            from public.vkl_sm_ky_kq q where q.ky_id = k.id and q.hang <= 10)) order by k.id desc), '[]')
  from public.vkl_sm_ky k where k.ket_xong;
$$;

-- ---------- RPC quản trị: chỉ trả dữ liệu khi tên đăng nhập của token nằm trong vkl_sm_admin_user ----------
create or replace function public.vkl_sm_admin(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := public.vkl_player(p_token); v_ky int; v_day date := vkl_priv.sm_day();
begin
  if v_me is null then raise exception 'SM_AUTH'; end if;
  if not exists (select 1 from public.vkl_players p join public.vkl_sm_admin_user a on a.username = p.username where p.id = v_me) then
    raise exception 'SM_QUYEN';
  end if;
  v_ky := coalesce(vkl_priv.sm_ky_now(), (select max(id) from public.vkl_sm_ky));
  return jsonb_build_object(
    'luc', now(),
    'ky', (select to_jsonb(k) - 'ket_tom' from public.vkl_sm_ky k where k.id = v_ky),
    'ky_chay', vkl_priv.sm_ky_now() is not null,
    'mon', (select jsonb_build_object(
              'dung', count(*) filter (where giai_tan_luc is null),
              'du_ky', count(*) filter (where giai_tan_luc is null and du_ky),
              'cho_ky', count(*) filter (where giai_tan_luc is null and not du_ky),
              'giai_tan', count(*) filter (where giai_tan_luc is not null))
            from public.vkl_sm_mon where ky_lap = v_ky),
    'nguoi', (select count(*) from public.vkl_sm_member mb join public.vkl_sm_mon m on m.id = mb.mon_id
              where m.ky_lap = v_ky and m.giai_tan_luc is null),
    'diem_danh_hom_nay', (select count(*) from public.vkl_sm_diem_danh where ngay = v_day),
    'o', (select jsonb_build_object('tong', count(*), 'co_chu', count(mon_id)) from public.vkl_sm_tile where ky_id = v_ky),
    'tran_ngay', (select coalesce(jsonb_agg(jsonb_build_object('ngay', d, 'tran', tran, 'giu_thang', giu, 'cam_co', cam) order by d desc), '[]')
                  from (select vkl_priv.sm_day(luc) d,
                          count(*) filter (where loai = 'tran') tran,
                          count(*) filter (where loai = 'tran' and noi_dung ->> 'kq' = 'thua') giu,
                          count(*) filter (where loai = 'cam_co') cam
                        from public.vkl_sm_bao where ky_id = v_ky and luc > now() - interval '14 day'
                        group by 1) z),
    'top', (select coalesce(jsonb_agg(x order by (x ->> 'o')::int desc, (x ->> 'n')::int desc), '[]') from (
              select jsonb_build_object('id', m.id, 'ten', m.ten, 'n', vkl_priv.sm_mon_n(m.id),
                'o', (select count(*) from public.vkl_sm_tile t where t.ky_id = v_ky and t.mon_id = m.id),
                'du_ky', m.du_ky) x
              from public.vkl_sm_mon m where m.ky_lap = v_ky and m.giai_tan_luc is null limit 60) y),
    'co', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'luc', c.luc, 'loai', c.loai, 'ct', c.chi_tiet,
              'mon', (select m.ten from public.vkl_sm_mon m where m.id = coalesce((c.chi_tiet ->> 'mon')::bigint, (c.chi_tiet ->> 'a')::bigint)),
              'mon_b', (select m.ten from public.vkl_sm_mon m where m.id = (c.chi_tiet ->> 'b')::bigint),
              'nguoi', (select p.username from public.vkl_players p where p.id::text = c.chi_tiet ->> 'player')) order by c.id desc), '[]')
           from (select * from public.vkl_sm_co order by id desc limit 100) c));
end;
$$;

-- ---------- Quyền ----------
do $$ begin
  revoke all on function vkl_priv.sm_ket_ky(int) from public;
  revoke all on function vkl_priv.sm_ket_ky_tick() from public;
  revoke all on function vkl_priv.sm_ky_moi(timestamptz, timestamptz, int) from public;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function vkl_priv.sm_ket_ky(int), vkl_priv.sm_ket_ky_tick(), vkl_priv.sm_ky_moi(timestamptz, timestamptz, int) from anon, authenticated';
    execute 'grant execute on function public.vkl_sm_ky_kq(), public.vkl_sm_admin(uuid) to anon, authenticated';
  end if;
end $$;

-- ---------- pg_cron: kết Kỷ, mỗi phút (hàm không làm gì nếu không có Kỷ quá giờ) ----------
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'vkl_sm_ket_ky') then
      perform cron.schedule('vkl_sm_ket_ky', '* * * * *', 'select vkl_priv.sm_ket_ky_tick()');
    end if;
  end if;
end $$;
