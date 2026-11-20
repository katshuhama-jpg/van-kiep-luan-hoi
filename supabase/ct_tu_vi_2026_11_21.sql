-- 21/11 (Ngày 22, chân thân lát 1a): nền máy chủ tu vi chân thân - Cửu Chuyển, 4 tầng mỗi Chuyển, đột phá / áp cảnh.
-- Luật (docs/viec-dem.md mục "Vòng tu vi chân thân", doc Project claude/vong-cay-chan-than.md):
--  * Thanh tầng (Sơ/Trung/Cao/Viên mãn) theo bảng ct_tv_bar. tang = số tầng đã đạt (0..4). Đầy thanh thì tự lên tầng (phần dư sang thanh sau).
--    Đạt Viên mãn (tang = 4) = ngưỡng đột phá; tu vi vẫn tăng tiếp tới bình cảnh = 2 x thanh Viên mãn rồi dừng.
--    Chuyển 9 không có đột phá: dừng ở ngưỡng.
--  * Offline: 100/giờ giờ 0-12, 50/giờ giờ 12-24, quá 24 giờ thì dừng. Tính khi mở (ct_tv_get) hoặc khi tiêu (ct_tv_dot_pha), không cron.
--  * Kiếp: 25 x căn(năm sống), chết trước 16 tuổi = 0. Trong một ngày (giờ VN): kiếp 1-5 đủ, 6-10 50%, từ 11 20%.
--    Máy chủ tự đọc vkl_lives (id > kiep_cuoi), không nhận số từ client.
--  * Tốc độ tu luyện x1,15 mỗi Chuyển (offline và kiếp).
--  * Đột phá: tỉ lệ theo Chuyển ĐÍCH: vào C2-3 100%, C4-6 85%, C7-9 75% ở ngưỡng, tăng đều tới 100% ở bình cảnh;
--    căn cơ +0% → +20% tăng đều. Trượt: +10% lần sau, lần thứ 3 chắc chắn, mất 50% phần dư trên ngưỡng.
--    Mộng dẫn chân: vào C3 cần từng Kim Đan (realm_no >= 3), C6 cần từng Độ Kiếp (>= 7), C9 cần từng vào Hồng Hoang (>= 12 hoặc cosmos hg).
--  * Lực chiến từ cảnh giới: mỗi Chuyển LC[c] x (1 + căn cơ c) x (0,6 nếu đã vào Chuyển + 0,1 mỗi tầng đã đạt). C1 coi như đã vào.
--  * Tạo hàng lần đầu (người có chân thân): tặng sẵn đủ tu vi lên Sơ tầng ngay.
-- Hàm cũ không sửa. Bảng mới chỉ ghi qua hàm SECURITY DEFINER.

create table if not exists public.vkl_ct_tu_vi (
  player_id uuid primary key references public.vkl_players(id) on delete cascade,
  chuyen smallint not null default 1 check (chuyen between 1 and 9),
  tang smallint not null default 0 check (tang between 0 and 4),
  tu_vi numeric not null default 0 check (tu_vi >= 0),
  can_co jsonb not null default '{}'::jsonb,         -- {"2": 0.1, ...} căn cơ theo Chuyển (0..0.2)
  gio_chot timestamptz not null default now(),
  tong_tu_vi numeric not null default 0,              -- chỉ tăng
  so_lan_truot smallint not null default 0,           -- số lần trượt ở lần đột phá hiện tại
  ngay_kiep date,                                     -- ngày (giờ VN) của bộ đếm kiếp
  so_kiep_ngay int not null default 0,                -- số kiếp (>= 16 tuổi) đã tính trong ngay_kiep
  kiep_cuoi bigint not null default 0,                -- id vkl_lives cuối đã tính
  tao_luc timestamptz not null default now(),
  sua_luc timestamptz not null default now()
);
alter table public.vkl_ct_tu_vi enable row level security;
revoke all on table public.vkl_ct_tu_vi from anon, authenticated;
grant select on table public.vkl_ct_tu_vi to authenticated;
drop policy if exists "ct_tu_vi chi doc cua minh" on public.vkl_ct_tu_vi;
create policy "ct_tu_vi chi doc cua minh" on public.vkl_ct_tu_vi for select to authenticated
  using (player_id = (select auth.uid()));

create index if not exists vkl_lives_player_id_id_idx on public.vkl_lives (player_id, id);

-- Bảng số ---------------------------------------------------------------------------------------------
create or replace function vkl_priv.ct_tv_bar(p_chuyen int, p_tang int)
returns numeric language sql immutable set search_path = '' as $$
  select (array[
    array[1000, 1200, 1300, 1500], array[1700, 2000, 2300, 2700], array[3100, 3500, 4000, 4700],
    array[5400, 6200, 7100, 8100], array[9400, 11000, 12000, 14000], array[16000, 19000, 22000, 25000],
    array[29000, 33000, 38000, 44000], array[50000, 58000, 66000, 76000], array[88000, 100000, 120000, 130000]
  ])[p_chuyen][least(p_tang, 3) + 1]::numeric;
$$;

create or replace function vkl_priv.ct_tv_lc_chuyen(p_chuyen int)
returns numeric language sql immutable set search_path = '' as $$
  select (array[300, 400, 500, 700, 900, 1100, 1400, 1700, 2000])[p_chuyen]::numeric;
$$;

create or replace function vkl_priv.ct_tv_toc(p_chuyen int)
returns numeric language sql immutable set search_path = '' as $$ select power(1.15, p_chuyen - 1)::numeric; $$;

-- trần tu vi ở trạng thái hiện tại (chỉ có nghĩa khi tang >= 3)
create or replace function vkl_priv.ct_tv_tran(p_chuyen int)
returns numeric language sql immutable set search_path = '' as $$
  select vkl_priv.ct_tv_bar(p_chuyen, 3) * case when p_chuyen >= 9 then 1 else 2 end;
$$;

-- tu vi offline có được sau p_gio giờ (chưa nhân tốc độ)
create or replace function vkl_priv.ct_tv_offline(p_gio numeric)
returns numeric language sql immutable set search_path = '' as $$
  select 100 * least(greatest(p_gio, 0), 12) + 50 * least(greatest(p_gio - 12, 0), 12);
$$;

-- Cộng tu vi vào hàng (đã khóa), tràn qua các tầng, chặn ở bình cảnh. Số thực cộng được = chênh tong_tu_vi.
create or replace function vkl_priv.ct_tv_cong(r public.vkl_ct_tu_vi, p_them numeric)
returns public.vkl_ct_tu_vi language plpgsql immutable set search_path = '' as $$
declare v_con numeric := greatest(p_them, 0); v_bar numeric; v_lay numeric; cong numeric;
begin
  cong := 0;
  while v_con > 0 loop
    v_bar := vkl_priv.ct_tv_bar(r.chuyen, r.tang);
    if r.tang < 3 then
      v_lay := least(v_con, v_bar - r.tu_vi);
      r.tu_vi := r.tu_vi + v_lay; v_con := v_con - v_lay; cong := cong + v_lay;
      if r.tu_vi >= v_bar then r.tu_vi := 0; r.tang := r.tang + 1; end if;
    else
      v_lay := least(v_con, greatest(vkl_priv.ct_tv_tran(r.chuyen) - r.tu_vi, 0));
      r.tu_vi := r.tu_vi + v_lay; cong := cong + v_lay; v_con := 0;
      if r.tu_vi >= v_bar then r.tang := 4; end if;
    end if;
  end loop;
  r.tong_tu_vi := r.tong_tu_vi + cong;
  return r;
end;
$$;

-- Chốt offline tới p_now và tính các kiếp mới. Trả hàng mới + phần vừa tu được.
create or replace function vkl_priv.ct_tv_chot(p_player uuid, p_now timestamptz,
  out r public.vkl_ct_tu_vi, out off_cong numeric, out kiep_cong numeric, out kiep_n int, out tang_len int, out qua_dau boolean)
language plpgsql security definer set search_path = '' as $$
declare v_gio numeric; l record; v_ngay date; v_he numeric; v_tang0 int; v_t0 numeric;
begin
  off_cong := 0; kiep_cong := 0; kiep_n := 0; qua_dau := false;
  select * into r from public.vkl_ct_tu_vi where player_id = p_player for update;
  if r.player_id is null then
    insert into public.vkl_ct_tu_vi (player_id, gio_chot, kiep_cuoi, tao_luc)
    values (p_player, p_now, coalesce((select max(id) from public.vkl_lives where player_id = p_player), 0), p_now)
    on conflict (player_id) do nothing;
    select * into r from public.vkl_ct_tu_vi where player_id = p_player for update;
    if r.tong_tu_vi = 0 and r.tang = 0 and r.chuyen = 1 then
      -- quà mở màn: đủ tu vi lên Sơ tầng ngay
      r := vkl_priv.ct_tv_cong(r, vkl_priv.ct_tv_bar(1, 0));
      qua_dau := true;
    end if;
  end if;
  v_tang0 := r.tang;
  -- offline
  v_gio := greatest(extract(epoch from (p_now - r.gio_chot)) / 3600.0, 0);
  if v_gio > 0 then
    v_t0 := r.tong_tu_vi;
    r := vkl_priv.ct_tv_cong(r, vkl_priv.ct_tv_offline(v_gio) * vkl_priv.ct_tv_toc(r.chuyen));
    off_cong := r.tong_tu_vi - v_t0;
    r.gio_chot := greatest(r.gio_chot, p_now);
  end if;
  -- kiếp mới (máy chủ tự đọc năm sống)
  for l in select id, age, created_at from public.vkl_lives
            where player_id = p_player and id > r.kiep_cuoi order by id limit 200 loop
    r.kiep_cuoi := l.id;
    continue when coalesce(l.age, 0) < 16;
    v_ngay := (l.created_at at time zone 'Asia/Ho_Chi_Minh')::date;
    if r.ngay_kiep is distinct from v_ngay then r.ngay_kiep := v_ngay; r.so_kiep_ngay := 0; end if;
    r.so_kiep_ngay := r.so_kiep_ngay + 1;
    v_he := case when r.so_kiep_ngay <= 5 then 1 when r.so_kiep_ngay <= 10 then 0.5 else 0.2 end;
    v_t0 := r.tong_tu_vi;
    r := vkl_priv.ct_tv_cong(r, 25 * sqrt(least(l.age, 100000)::numeric) * v_he * vkl_priv.ct_tv_toc(r.chuyen));
    kiep_cong := kiep_cong + (r.tong_tu_vi - v_t0); kiep_n := kiep_n + 1;
  end loop;
  tang_len := r.tang - v_tang0;
  r.sua_luc := p_now;
  update public.vkl_ct_tu_vi set
    chuyen = r.chuyen, tang = r.tang, tu_vi = r.tu_vi, gio_chot = r.gio_chot, tong_tu_vi = r.tong_tu_vi,
    ngay_kiep = r.ngay_kiep, so_kiep_ngay = r.so_kiep_ngay, kiep_cuoi = r.kiep_cuoi, sua_luc = r.sua_luc
   where player_id = p_player;
end;
$$;

-- Chìa Mộng dẫn chân cho Chuyển đích; null nếu không cần hoặc đã có
create or replace function vkl_priv.ct_tv_chia(p_player uuid, p_dich int)
returns text language sql stable security definer set search_path = '' as $$
  select case
    when p_dich = 3 and not exists (select 1 from public.vkl_lives where player_id = p_player and realm_no >= 3) then 'kim_dan'
    when p_dich = 6 and not exists (select 1 from public.vkl_lives where player_id = p_player and realm_no >= 7) then 'do_kiep'
    when p_dich = 9 and not exists (select 1 from public.vkl_lives where player_id = p_player
                                     and (realm_no >= 12 or look ->> 'cosmos' = 'hg')) then 'hong_hoang'
  end;
$$;

-- tỉ lệ thành và căn cơ nếu bấm lúc này
create or replace function vkl_priv.ct_tv_ti_le(p_chuyen int, p_tu_vi numeric, p_truot int, out ti_le numeric, out can_co numeric)
language plpgsql immutable set search_path = '' as $$
declare v_dich int := p_chuyen + 1; v_goc numeric; v_x numeric;
begin
  v_goc := case when v_dich <= 3 then 1 when v_dich <= 6 then 0.85 else 0.75 end;
  v_x := least(greatest(p_tu_vi / vkl_priv.ct_tv_bar(p_chuyen, 3) - 1, 0), 1);
  ti_le := case when p_truot >= 2 then 1 else least(1, v_goc + (1 - v_goc) * v_x + 0.1 * p_truot) end;
  can_co := round(0.2 * v_x, 4);
end;
$$;

-- Lực chiến từ cảnh giới chân thân
create or replace function vkl_priv.ct_tv_luc_chien(r public.vkl_ct_tu_vi)
returns int language sql immutable set search_path = '' as $$
  select coalesce(round(sum(vkl_priv.ct_tv_lc_chuyen(c) * (1 + coalesce((r.can_co ->> c::text)::numeric, 0))
           * (0.6 + 0.1 * case when c < r.chuyen then 4 else r.tang end))), 0)::int
    from generate_series(1, r.chuyen) c;
$$;

create or replace function vkl_priv.ct_tv_json(r public.vkl_ct_tu_vi)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare t record; v_nguong numeric := vkl_priv.ct_tv_bar(r.chuyen, 3);
begin
  select * into t from vkl_priv.ct_tv_ti_le(r.chuyen, r.tu_vi, r.so_lan_truot);
  return jsonb_build_object(
    'chuyen', r.chuyen, 'tang', r.tang, 'tu_vi', floor(r.tu_vi), 'thanh', vkl_priv.ct_tv_bar(r.chuyen, r.tang),
    'nguong', case when r.tang >= 3 then v_nguong end,
    'binh_canh', case when r.tang >= 3 and r.chuyen < 9 then vkl_priv.ct_tv_tran(r.chuyen) end,
    'cham_binh_canh', r.tang = 4 and r.tu_vi >= vkl_priv.ct_tv_tran(r.chuyen),
    'toc_do_gio', round(100 * vkl_priv.ct_tv_toc(r.chuyen)),
    'gio_chot', r.gio_chot, 'tong_tu_vi', floor(r.tong_tu_vi), 'can_co', r.can_co, 'so_lan_truot', r.so_lan_truot,
    'so_kiep_ngay', r.so_kiep_ngay, 'luc_chien', vkl_priv.ct_tv_luc_chien(r),
    'dot_pha', case when r.tang = 4 and r.chuyen < 9 then jsonb_build_object(
        'ti_le', round(t.ti_le, 4), 'can_co', t.can_co, 'chia', vkl_priv.ct_tv_chia(r.player_id, r.chuyen + 1)) end);
end;
$$;

-- Lõi đột phá (p_roll trong [0,1); hàm public truyền random())
create or replace function vkl_priv.ct_tv_dot_pha_core(p_player uuid, p_now timestamptz, p_roll numeric)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c record; r public.vkl_ct_tu_vi; t record; v_chia text; v_ok boolean; v_nguong numeric; v_lc0 int; v_mat numeric := 0;
begin
  select * into c from vkl_priv.ct_tv_chot(p_player, p_now);
  r := c.r;
  if r.chuyen >= 9 then raise exception 'CT_TV_DINH'; end if;
  if r.tang < 4 then raise exception 'CT_TV_CHUA_DU'; end if;
  v_chia := vkl_priv.ct_tv_chia(p_player, r.chuyen + 1);
  if v_chia is not null then
    return jsonb_build_object('ok', false, 'chia', v_chia, 'trang_thai', vkl_priv.ct_tv_json(r));
  end if;
  v_nguong := vkl_priv.ct_tv_bar(r.chuyen, 3);
  select * into t from vkl_priv.ct_tv_ti_le(r.chuyen, r.tu_vi, r.so_lan_truot);
  v_ok := p_roll < t.ti_le;
  v_lc0 := vkl_priv.ct_tv_luc_chien(r);
  if v_ok then
    r.can_co := r.can_co || jsonb_build_object((r.chuyen + 1)::text, t.can_co);
    r.chuyen := r.chuyen + 1; r.tang := 0; r.tu_vi := 0; r.so_lan_truot := 0;
  else
    v_mat := (r.tu_vi - v_nguong) / 2;
    r.tu_vi := r.tu_vi - v_mat; r.so_lan_truot := r.so_lan_truot + 1;
  end if;
  update public.vkl_ct_tu_vi set chuyen = r.chuyen, tang = r.tang, tu_vi = r.tu_vi, can_co = r.can_co,
         so_lan_truot = r.so_lan_truot, sua_luc = p_now
   where player_id = p_player;
  return jsonb_build_object('ok', v_ok, 'ti_le', round(t.ti_le, 4), 'can_co', t.can_co, 'mat', floor(v_mat),
    'luc_chien_them', vkl_priv.ct_tv_luc_chien(r) - v_lc0, 'trang_thai', vkl_priv.ct_tv_json(r));
end;
$$;

-- Public ------------------------------------------------------------------------------------------------
-- người gọi phải đăng nhập và đã có chân thân (như vkl_priv.sm_me)
create or replace function vkl_priv.ct_tv_me(p_token uuid)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare v uuid := public.vkl_player(p_token);
begin
  if v is null then raise exception 'CT_AUTH'; end if;
  if not exists (select 1 from public.vkl_players where id = v and jsonb_typeof(meta -> 'chanThan') = 'object') then
    raise exception 'CT_NO_CT';
  end if;
  return v;
end;
$$;

create or replace function public.ct_tv_get(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c record;
begin
  select * into c from vkl_priv.ct_tv_chot(vkl_priv.ct_tv_me(p_token), now());
  return vkl_priv.ct_tv_json(c.r) || jsonb_build_object('vua_tu', jsonb_build_object(
    'offline', floor(c.off_cong), 'kiep', floor(c.kiep_cong), 'so_kiep', c.kiep_n, 'tang_len', c.tang_len, 'qua_dau', c.qua_dau));
end;
$$;

-- gọi sau vkl_add_life: không nhận số nào từ client, chỉ đọc vkl_lives
create or replace function public.ct_tv_life(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c record;
begin
  select * into c from vkl_priv.ct_tv_chot(vkl_priv.ct_tv_me(p_token), now());
  return jsonb_build_object('kiep', floor(c.kiep_cong), 'so_kiep', c.kiep_n, 'tang_len', c.tang_len,
    'trang_thai', vkl_priv.ct_tv_json(c.r));
end;
$$;

create or replace function public.ct_tv_dot_pha(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  return vkl_priv.ct_tv_dot_pha_core(vkl_priv.ct_tv_me(p_token), now(), random()::numeric);
end;
$$;

revoke all on function public.ct_tv_get(uuid) from public;
revoke all on function public.ct_tv_life(uuid) from public;
revoke all on function public.ct_tv_dot_pha(uuid) from public;
grant execute on function public.ct_tv_get(uuid) to anon, authenticated;
grant execute on function public.ct_tv_life(uuid) to anon, authenticated;
grant execute on function public.ct_tv_dot_pha(uuid) to anon, authenticated;
