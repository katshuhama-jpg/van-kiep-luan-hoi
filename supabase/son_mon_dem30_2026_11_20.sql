-- TRẠNG THÁI 20/11 tối: CHƯA ÁP. apply_migration bị treo chờ người duyệt (hết 180 giây). Áp nguyên file này (một migration). Giao diện tự quay về hàm cũ khi chưa áp.
-- Ngày 30 (Tyler giao 20/11 17:32): phạt đánh thua, bỏ ô, đất liền, Linh Mạch / Thiên Trì có yêu thú giữ ngẫu nhiên, Linh Mạch ẩn.
-- Không sửa hàm cũ. Thêm bảng, cột, trigger, hàm và cron MỚI; cron vkl_sm_lm_gio đổi sang hàm mới sm_lm_gio2.
--  1. Trọng thương: mỗi người theo đoàn đánh thua (cả đánh yêu thú) bị giảm Lực chiến Sơn Môn theo số lần thua trong ngày
--     (đếm theo ngày Sơn Môn, đổi lúc 5:00): lần 1 -10% tới hết giờ nghỉ + 1 giờ, lần 2 -30% tới hết giờ nghỉ + 3 giờ,
--     từ lần 3 -50% tới 5:00. Luật nghỉ 2 giờ giữ nguyên. Thời gian tính từ lúc HẾT NGHỈ, vì trong 2 giờ nghỉ người đó vốn
--     không đánh, không giữ được (nếu tính từ lúc thua thì lần 1 không có tác dụng gì).
--     Cách làm: trigger BEFORE trên vkl_sm_luc_chien. Khi có trọng thương, cột lc giữ số đã giảm, số gốc ở phan.lc_goc.
--     Mọi hàm cũ (tính trận, giữ ô, trinh sát, dải sức mạnh) đọc lc nên tự thấy số đã giảm. sm_tick_d30 mỗi phút xét trận
--     thua mới và hồi người hết hạn.
--  2. vkl_sm_bo_o: môn chủ, trưởng lão bỏ một ô (trừ chính điện, ô đang có quân hay yêu thú kéo tới).
--  3. Đất liền: trigger AFTER UPDATE OF mon_id trên vkl_sm_tile. Môn vừa mất ô (bị chiếm, bỏ, yêu thú tràn, tự bỏ ô xa)
--     thì tính các ô còn nối với chính điện qua ô kề; ô đứt về trống, người đứng ở đó về chính điện, chiến báo 'dut_mach'.
--  4. Linh Mạch, Thiên Trì mới xuất hiện (mạch dời, Kỷ mới): 50% có yêu thú giữ (lực như yêu thú vòng 5). Yêu thú này
--     không tự đi lúc 5:00, không đánh ô khác; đánh như ô yêu thú. Không có thì môn đầu tiên tới chiếm ngay.
--  5. Linh Mạch mới sinh ẩn (cột an): bản đồ công khai vkl_sm_map4 không hiện; môn trinh sát ô đó thấy dòng "Có Linh Mạch"
--     và thấy tới hết Kỷ (vkl_sm_lm_thay); môn đang giữ ô đó cũng thấy. Mạch đang hiện từ 20/11 giữ nguyên tới lúc dời.
--     Một ô không có Linh Mạch hai lần trong một Kỷ (vkl_sm_lm_su). Thiên Trì vẫn hiện.

insert into public.vkl_sm_cfg (k, v) values ('d30', jsonb_build_object(
  'phat', jsonb_build_array(jsonb_build_object('pct', 0.1, 'gio', 1), jsonb_build_object('pct', 0.3, 'gio', 3), jsonb_build_object('pct', 0.5, 'gio', null)),
  'yeu_dat', 0.5, 'bat_dau', '2026-11-20T22:00:00Z'))
on conflict (k) do nothing;

-- Luật mới chạy từ 5:00 21/11 (giờ VN), cùng lúc bản giao diện lên trang. Trước đó mọi phần mới đứng yên.
create or replace function vkl_priv.sm_d30_on()
returns boolean language sql stable security definer set search_path = '' as $$
  select now() >= coalesce(((select v ->> 'bat_dau' from public.vkl_sm_cfg where k = 'd30'))::timestamptz, 'infinity'::timestamptz);
$$;

-- ===== 1. Trọng thương =====
create table if not exists public.vkl_sm_thuong_tich (
  player_id uuid primary key,
  ngay date not null,
  lan int not null default 1,
  pct numeric not null,
  luc timestamptz not null default now(),
  het_luc timestamptz not null,
  hoi boolean not null default false
);
alter table public.vkl_sm_thuong_tich enable row level security;
create index if not exists vkl_sm_thuong_tich_cho on public.vkl_sm_thuong_tich (het_luc) where not hoi;

create table if not exists public.vkl_sm_thua_xet (
  chinh_id bigint primary key,
  luc timestamptz not null default now()
);
alter table public.vkl_sm_thua_xet enable row level security;

create or replace function vkl_priv.sm_lc_thuong()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_goc int; v_pct numeric;
begin
  v_goc := coalesce((new.phan ->> 'lc_goc')::int, new.lc);
  select pct into v_pct from public.vkl_sm_thuong_tich where player_id = new.player_id and not hoi and het_luc > now();
  if v_pct is not null and v_pct > 0 then
    new.phan := coalesce(new.phan, '{}'::jsonb) || jsonb_build_object('lc_goc', v_goc, 'thuong', v_pct);
    new.lc := round(v_goc * (1 - v_pct));
  else
    new.phan := coalesce(new.phan, '{}'::jsonb) - 'lc_goc' - 'thuong';
    new.lc := v_goc;
  end if;
  return new;
end;
$$;
drop trigger if exists vkl_sm_lc_thuong on public.vkl_sm_luc_chien;
create trigger vkl_sm_lc_thuong before insert or update on public.vkl_sm_luc_chien
  for each row execute function vkl_priv.sm_lc_thuong();

-- 5:00 kế tiếp (giờ VN)
create or replace function vkl_priv.sm_5h_toi()
returns timestamptz language sql stable set search_path = '' as $$
  select ((vkl_priv.sm_day() + 1)::timestamp + interval '5 hour') at time zone 'Asia/Ho_Chi_Minh';
$$;

-- Mỗi phút: trận thua mới -> trọng thương; người hết hạn -> hồi Lực chiến.
create or replace function vkl_priv.sm_tick_d30()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare x record; p record; cf jsonb; v_day date := vkl_priv.sm_day(); v_lan int; v_muc jsonb; v_het timestamptz; v_n_thua int := 0; v_n_hoi int := 0; v_max int;
begin
  select v into cf from public.vkl_sm_cfg where k = 'd30';
  if cf is null or not vkl_priv.sm_d30_on() then return jsonb_build_object('bo_qua', true); end if;
  v_max := jsonb_array_length(cf -> 'phat');
  for x in select c.id, c.mon_id, t.ten from public.vkl_sm_chinh c
             join public.vkl_sm_tile t on t.ky_id = c.ky_id and t.q = c.toi_q and t.r = c.toi_r
            where c.trang_thai = 'xong' and c.ket_qua ->> 'kq' = 'thua' and c.toi_noi_luc > now() - interval '6 hours'
              and c.toi_noi_luc >= (cf ->> 'bat_dau')::timestamptz
              and not exists (select 1 from public.vkl_sm_thua_xet s where s.chinh_id = c.id)
            order by c.toi_noi_luc, c.id for update of c skip locked loop
    insert into public.vkl_sm_thua_xet (chinh_id) values (x.id) on conflict do nothing;
    for p in select th.player_id, m.nghi_toi from public.vkl_sm_chinh_theo th
               join public.vkl_sm_member m on m.player_id = th.player_id and m.mon_id = x.mon_id
              where th.chinh_id = x.id loop
      select case when ngay = v_day then lan + 1 else 1 end into v_lan from public.vkl_sm_thuong_tich where player_id = p.player_id;
      v_lan := coalesce(v_lan, 1);
      v_muc := cf -> 'phat' -> (least(v_lan, v_max) - 1);
      v_het := case when v_muc ->> 'gio' is null then vkl_priv.sm_5h_toi()
                    else least(vkl_priv.sm_5h_toi(), greatest(now(), coalesce(p.nghi_toi, now())) + make_interval(hours => (v_muc ->> 'gio')::int)) end;
      insert into public.vkl_sm_thuong_tich (player_id, ngay, lan, pct, luc, het_luc, hoi)
      values (p.player_id, v_day, v_lan, (v_muc ->> 'pct')::numeric, now(), v_het, false)
      on conflict (player_id) do update set ngay = excluded.ngay, lan = excluded.lan, pct = excluded.pct, luc = excluded.luc,
        het_luc = excluded.het_luc, hoi = false;
      update public.vkl_sm_luc_chien set lc = coalesce((phan ->> 'lc_goc')::int, lc) where player_id = p.player_id;
      v_n_thua := v_n_thua + 1;
    end loop;
    perform vkl_priv.sm_he(x.mon_id,
      format('Người theo đoàn đánh %s bị trọng thương, Lực chiến giảm một thời gian. Thua càng nhiều lần trong ngày càng nặng, xem ở thẻ từng người.', x.ten),
      format('Those who marched on %s are wounded and fight weaker for a while. More losses today means worse wounds; see each member card.', x.ten));
  end loop;
  for p in select player_id from public.vkl_sm_thuong_tich where not hoi and het_luc <= now() for update skip locked loop
    update public.vkl_sm_thuong_tich set hoi = true where player_id = p.player_id;
    update public.vkl_sm_luc_chien set lc = coalesce((phan ->> 'lc_goc')::int, lc) where player_id = p.player_id;
    v_n_hoi := v_n_hoi + 1;
  end loop;
  delete from public.vkl_sm_thua_xet where luc < now() - interval '2 days';
  return jsonb_build_object('thua', v_n_thua, 'hoi', v_n_hoi);
end;
$$;

-- ===== 3. Đất liền =====
create or replace function vkl_priv.sm_lien(p_ky int, p_mon bigint)
returns int language plpgsql security definer set search_path = '' as $$
declare v_n int; v_ten text[]; v_qs int[]; v_rs int[];
begin
  if p_mon is null or p_mon is not distinct from vkl_priv.sm_yeu_mon() then return 0; end if;
  if exists (select 1 from public.vkl_sm_mon where id = p_mon and giai_tan_luc is not null) then return 0; end if;
  perform vkl_priv.sm_chon_cd(p_ky, p_mon);
  if not exists (select 1 from public.vkl_sm_tile where ky_id = p_ky and mon_id = p_mon and chinh_dien) then return 0; end if;
  with recursive own as (select q, r from public.vkl_sm_tile where ky_id = p_ky and mon_id = p_mon),
  reach (q, r) as (
    select q, r from public.vkl_sm_tile where ky_id = p_ky and mon_id = p_mon and chinh_dien
    union
    select o.q, o.r from own o join reach x
      on (o.q - x.q, o.r - x.r) in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1))),
  cut as (select q, r from own except select q, r from reach)
  select count(*)::int, array_agg(t.ten order by t.ten), array_agg(c.q), array_agg(c.r) into v_n, v_ten, v_qs, v_rs
    from cut c join public.vkl_sm_tile t on t.ky_id = p_ky and t.q = c.q and t.r = c.r;
  if coalesce(v_n, 0) = 0 then return 0; end if;
  update public.vkl_sm_member m set dung_q = null, dung_r = null
    from unnest(v_qs, v_rs) c(q, r) where m.mon_id = p_mon and m.dung_q = c.q and m.dung_r = c.r;
  update public.vkl_sm_tile t set mon_id = null, chinh_dien = false, bao_ho_toi = null, chiem_luc = null
    from unnest(v_qs, v_rs) c(q, r) where t.ky_id = p_ky and t.q = c.q and t.r = c.r and t.mon_id = p_mon;
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, noi_dung)
  values (p_ky, 'dut_mach', p_mon, jsonb_build_object('n', v_n, 'ds', to_jsonb(v_ten)));
  perform vkl_priv.sm_he(p_mon,
    format('Đất đứt mạch, mất %s ô: %s. Người đứng giữ ở đó đã về chính điện.', v_n, array_to_string(v_ten, ', ')),
    format('Our land was cut off from the main hall; lost %s tiles: %s. Their guards went back to the hall.', v_n, array_to_string(v_ten, ', ')));
  return v_n;
end;
$$;

create or replace function vkl_priv.sm_tile_lien()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_yeu bigint := vkl_priv.sm_yeu_mon();
begin
  -- yêu thú giữ Linh Mạch / Thiên Trì vừa bị diệt: bỏ lực yêu thú khỏi ô đất đó
  if v_yeu is not null and old.mon_id = v_yeu then
    update public.vkl_sm_dat set yeu_luc = null, yeu_luc_dat = null
     where ky_id = old.ky_id and q = old.q and r = old.r and loai in ('linh_mach', 'thien_tri') and yeu_luc is not null;
    return null;
  end if;
  if coalesce(current_setting('vkl.sm_lien', true), '') = '1' or not vkl_priv.sm_d30_on() then return null; end if;
  perform set_config('vkl.sm_lien', '1', true);
  perform vkl_priv.sm_lien(old.ky_id, old.mon_id);
  perform set_config('vkl.sm_lien', '', true);
  return null;
end;
$$;
drop trigger if exists vkl_sm_tile_lien on public.vkl_sm_tile;
create trigger vkl_sm_tile_lien after update of mon_id on public.vkl_sm_tile
  for each row when (old.mon_id is not null and old.mon_id is distinct from new.mon_id)
  execute function vkl_priv.sm_tile_lien();

-- ===== 2. Bỏ ô =====
create or replace function public.vkl_sm_bo_o(p_token uuid, p_q integer, p_r integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_mon public.vkl_sm_mon; t public.vkl_sm_tile; v_truoc int; v_sau int; v_ten text;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  if m.chuc not in ('chu', 'lao') then raise exception 'SM_QUYEN'; end if;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id for update;
  select * into t from public.vkl_sm_tile where ky_id = v_mon.ky_lap and q = p_q and r = p_r for update;
  if t.ky_id is null then raise exception 'SM_O'; end if;
  if t.mon_id is distinct from v_mon.id then raise exception 'SM_KHONG_CUA_TA'; end if;
  if t.chinh_dien then raise exception 'SM_BO_CD'; end if;
  if exists (select 1 from public.vkl_sm_chinh where ky_id = t.ky_id and toi_q = p_q and toi_r = p_r and trang_thai in ('tap_hop', 'di'))
     or exists (select 1 from public.vkl_sm_yeu_cong where ky_id = t.ky_id and q = p_q and r = p_r and trang_thai = 'cho') then
    raise exception 'SM_O_DANG_BI_TOI';
  end if;
  select username into v_ten from public.vkl_players where id = v_me;
  select count(*) into v_truoc from public.vkl_sm_tile where ky_id = t.ky_id and mon_id = v_mon.id;
  update public.vkl_sm_member set dung_q = null, dung_r = null where mon_id = v_mon.id and dung_q = p_q and dung_r = p_r;
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, q, r, noi_dung)
  values (t.ky_id, 'bo_o', v_mon.id, p_q, p_r, jsonb_build_object('ten_o', t.ten, 'nguoi', v_ten));
  perform vkl_priv.sm_he(v_mon.id, format('%s bỏ ô %s. Người đứng giữ ở đó đã về chính điện.', v_ten, t.ten),
                                   format('%s gave up %s. Its guards went back to the main hall.', v_ten, t.ten));
  update public.vkl_sm_tile set mon_id = null, chinh_dien = false, bao_ho_toi = null, chiem_luc = null
   where ky_id = t.ky_id and q = p_q and r = p_r;
  select count(*) into v_sau from public.vkl_sm_tile where ky_id = t.ky_id and mon_id = v_mon.id;
  return jsonb_build_object('ok', true, 'ten_o', t.ten, 'dut', greatest(0, v_truoc - 1 - v_sau));
end;
$$;

-- ===== 4 + 5. Linh Mạch ẩn, yêu thú giữ đất mới =====
alter table public.vkl_sm_dat add column if not exists an boolean not null default false;

create table if not exists public.vkl_sm_lm_su (
  ky_id int not null references public.vkl_sm_ky (id) on delete cascade,
  q int not null, r int not null,
  luc timestamptz not null default now(),
  primary key (ky_id, q, r)
);
alter table public.vkl_sm_lm_su enable row level security;

create table if not exists public.vkl_sm_lm_thay (
  ky_id int not null references public.vkl_sm_ky (id) on delete cascade,
  mon_id bigint not null references public.vkl_sm_mon (id) on delete cascade,
  q int not null, r int not null,
  luc timestamptz not null default now(),
  primary key (ky_id, mon_id, q, r)
);
alter table public.vkl_sm_lm_thay enable row level security;
create index if not exists vkl_sm_lm_thay_mon on public.vkl_sm_lm_thay (mon_id, ky_id);

-- ô đã từng có Linh Mạch trong Kỷ này (mạch đang có + chỗ cũ trong chiến báo dời mạch)
insert into public.vkl_sm_lm_su (ky_id, q, r)
select ky_id, q, r from public.vkl_sm_dat where loai = 'linh_mach'
union select ky_id, q, r from public.vkl_sm_bao where loai = 'lm_doi' and q is not null
on conflict do nothing;

create or replace function vkl_priv.sm_dat_sinh()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_yeu bigint := vkl_priv.sm_yeu_mon(); cf jsonb; c jsonb;
begin
  if new.loai not in ('linh_mach', 'thien_tri') or not vkl_priv.sm_d30_on() then return new; end if;
  -- insert ... on conflict do update vẫn chạy trigger BEFORE INSERT: ô đã có dòng thì không làm gì thêm
  if exists (select 1 from public.vkl_sm_dat where ky_id = new.ky_id and q = new.q and r = new.r) then return new; end if;
  if new.loai = 'linh_mach' then
    new.an := true;
    insert into public.vkl_sm_lm_su (ky_id, q, r) values (new.ky_id, new.q, new.r) on conflict do nothing;
  end if;
  select v into cf from public.vkl_sm_cfg where k = 'd30';
  select v into c from public.vkl_sm_cfg where k = 'dat';
  if v_yeu is not null and random() < coalesce((cf ->> 'yeu_dat')::numeric, 0)
     and exists (select 1 from public.vkl_sm_tile where ky_id = new.ky_id and q = new.q and r = new.r and mon_id is null)
     and not exists (select 1 from public.vkl_sm_chinh where ky_id = new.ky_id and toi_q = new.q and toi_r = new.r and trang_thai in ('tap_hop', 'di')) then
    new.yeu_luc := (c ->> 'y5_lo')::int + floor(random() * (((c ->> 'y5_hi')::int - (c ->> 'y5_lo')::int) / 500 + 1)) * 500;
    new.yeu_luc_dat := now();
    update public.vkl_sm_tile set mon_id = v_yeu, chinh_dien = false, chiem_luc = now(), bao_ho_toi = now() + interval '100 years'
     where ky_id = new.ky_id and q = new.q and r = new.r;
  end if;
  return new;
end;
$$;
drop trigger if exists vkl_sm_dat_sinh on public.vkl_sm_dat;
create trigger vkl_sm_dat_sinh before insert on public.vkl_sm_dat
  for each row execute function vkl_priv.sm_dat_sinh();

-- Trinh sát xong: ô có Linh Mạch thì thêm vào kết quả, môn đó thấy mạch tới hết Kỷ
create or replace function vkl_priv.sm_trinh_lm()
returns trigger language plpgsql security definer set search_path = '' as $$
declare d public.vkl_sm_dat;
begin
  if old.ket_qua is null and new.ket_qua is not null then
    select * into d from public.vkl_sm_dat where ky_id = new.ky_id and q = new.q and r = new.r and loai = 'linh_mach';
    if d.q is not null then
      new.ket_qua := new.ket_qua || jsonb_build_object('lm', coalesce(d.ten_rieng, 'Linh Mạch'));
      insert into public.vkl_sm_lm_thay (ky_id, mon_id, q, r) values (new.ky_id, new.mon_id, new.q, new.r) on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists vkl_sm_trinh_lm on public.vkl_sm_trinh;
create trigger vkl_sm_trinh_lm before update of ket_qua on public.vkl_sm_trinh
  for each row execute function vkl_priv.sm_trinh_lm();

-- Như sm_lm_gio, thêm: không dời về ô từng có mạch trong Kỷ này; chiến báo không lộ chỗ mới (mạch mới ẩn).
create or replace function vkl_priv.sm_lm_gio2()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_ky int := vkl_priv.sm_ky_now(); c jsonb; v_gio text := to_char(date_trunc('hour', now()), 'YYYY-MM-DD"T"HH24');
  v_yeu bigint := vkl_priv.sm_yeu_mon(); x record; m record; v_can int := 0;
begin
  if not vkl_priv.sm_d30_on() then return vkl_priv.sm_lm_gio(); end if;
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
    m := null;
    select t.q, t.r, t.ten into m from public.vkl_sm_tile t
     where t.ky_id = v_ky and t.mon_id is null and vkl_priv.sm_dist(0, 0, t.q, t.r) between 2 and 5
       and not exists (select 1 from public.vkl_sm_dat d where d.ky_id = t.ky_id and d.q = t.q and d.r = t.r)
       and not exists (select 1 from public.vkl_sm_lm_su s where s.ky_id = t.ky_id and s.q = t.q and s.r = t.r)
       and not exists (select 1 from public.vkl_sm_tile cd where cd.ky_id = t.ky_id and cd.chinh_dien and vkl_priv.sm_dist(cd.q, cd.r, t.q, t.r) < 2)
       and not exists (select 1 from public.vkl_sm_chinh h where h.ky_id = t.ky_id and h.toi_q = t.q and h.toi_r = t.r and h.trang_thai in ('tap_hop', 'di'))
     order by random() limit 1;
    if m.q is null then
      select t.q, t.r, t.ten into m from public.vkl_sm_tile t
       where t.ky_id = v_ky and t.mon_id is null and vkl_priv.sm_dist(0, 0, t.q, t.r) between 1 and 6
         and not exists (select 1 from public.vkl_sm_dat d where d.ky_id = t.ky_id and d.q = t.q and d.r = t.r)
         and not exists (select 1 from public.vkl_sm_lm_su s where s.ky_id = t.ky_id and s.q = t.q and s.r = t.r)
       order by random() limit 1;
    end if;
    if m.q is not null then
      insert into public.vkl_sm_dat (ky_id, q, r, loai, ten_rieng, tru_luong) values (v_ky, m.q, m.r, 'linh_mach', x.ten_rieng, (c ->> 'lm_tru')::int);
    end if;
    insert into public.vkl_sm_bao (ky_id, loai, mon_a, q, r, noi_dung)
    values (v_ky, 'lm_doi', x.mon_id, x.q, x.r, jsonb_build_object('lm', x.ten_rieng, 'ten_o', x.ten_o, 'an', true));
    v_can := v_can + 1;
  end loop;
  update public.vkl_sm_cfg set v = v || jsonb_build_object('gio_lm', v_gio) where k = 'dat';
  return jsonb_build_object('can', v_can);
end;
$$;

-- Bản đồ công khai: như vkl_sm_map3, nhưng Linh Mạch ẩn không hiện (ô ẩn có yêu thú giữ thì hiện như ô yêu thú thường)
create or replace function public.vkl_sm_map4(p_ky integer)
returns jsonb language sql stable security definer set search_path = '' as $$
  with k as (select coalesce(p_ky, vkl_priv.sm_ky_now(), (select max(id) from public.vkl_sm_ky)) id)
  select public.vkl_sm_map3(p_ky) || jsonb_build_object(
    'dat', (select coalesce(jsonb_agg(case when d.loai = 'linh_mach' and d.an
                                         then jsonb_build_array(d.q, d.r, 'yeu_thu', null, d.yeu_luc, null)
                                         else jsonb_build_array(d.q, d.r, d.loai, d.ten_rieng, d.yeu_luc, d.tru_luong) end), '[]')
              from public.vkl_sm_dat d join k on d.ky_id = k.id
              left join public.vkl_sm_tile t on t.ky_id = d.ky_id and t.q = d.q and t.r = d.r
             where not (d.loai = 'linh_mach' and d.an) or (vkl_priv.sm_yeu_mon() is not null and t.mon_id = vkl_priv.sm_yeu_mon())),
    'lm_an', true);
$$;

-- Riêng môn ta: Linh Mạch ẩn đã trinh sát thấy hoặc đang giữ, và trọng thương của người trong môn
create or replace function public.vkl_sm_d30(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_mon bigint; v_ky int;
begin
  select m.mon_id, mo.ky_lap into v_mon, v_ky from public.vkl_sm_member m join public.vkl_sm_mon mo on mo.id = m.mon_id where m.player_id = v_me;
  return jsonb_build_object(
    'ta', (select jsonb_build_object('pct', s.pct, 'het', s.het_luc, 'lan', s.lan, 'goc', (l.phan ->> 'lc_goc')::int)
             from public.vkl_sm_thuong_tich s left join public.vkl_sm_luc_chien l on l.player_id = s.player_id
            where s.player_id = v_me and not s.hoi and s.het_luc > now()),
    'lan_hom_nay', coalesce((select lan from public.vkl_sm_thuong_tich where player_id = v_me and ngay = vkl_priv.sm_day()), 0),
    'mon', case when v_mon is null then '{}'::jsonb else coalesce((
             select jsonb_object_agg(p.username, jsonb_build_object('pct', s.pct, 'het', s.het_luc, 'lan', s.lan))
               from public.vkl_sm_member m join public.vkl_sm_thuong_tich s on s.player_id = m.player_id and not s.hoi and s.het_luc > now()
               join public.vkl_players p on p.id = m.player_id
              where m.mon_id = v_mon), '{}'::jsonb) end,
    'lm', case when v_mon is null then '[]'::jsonb else coalesce((
             select jsonb_agg(jsonb_build_array(d.q, d.r, d.loai, d.ten_rieng, d.yeu_luc, d.tru_luong))
               from public.vkl_sm_dat d join public.vkl_sm_tile t on t.ky_id = d.ky_id and t.q = d.q and t.r = d.r
              where d.ky_id = v_ky and d.loai = 'linh_mach' and d.an
                and (t.mon_id = v_mon or exists (select 1 from public.vkl_sm_lm_thay h where h.ky_id = d.ky_id and h.mon_id = v_mon and h.q = d.q and h.r = d.r))), '[]'::jsonb) end);
end;
$$;

revoke all on function public.vkl_sm_bo_o(uuid, integer, integer) from public;
revoke all on function public.vkl_sm_map4(integer) from public;
revoke all on function public.vkl_sm_d30(uuid) from public;
grant execute on function public.vkl_sm_bo_o(uuid, integer, integer) to anon, authenticated;
grant execute on function public.vkl_sm_map4(integer) to anon, authenticated;
grant execute on function public.vkl_sm_d30(uuid) to anon, authenticated;
revoke all on function vkl_priv.sm_lc_thuong() from public;
revoke all on function vkl_priv.sm_d30_on() from public;
revoke all on function vkl_priv.sm_5h_toi() from public;
revoke all on function vkl_priv.sm_tick_d30() from public;
revoke all on function vkl_priv.sm_lien(int, bigint) from public;
revoke all on function vkl_priv.sm_tile_lien() from public;
revoke all on function vkl_priv.sm_dat_sinh() from public;
revoke all on function vkl_priv.sm_trinh_lm() from public;
revoke all on function vkl_priv.sm_lm_gio2() from public;

select cron.schedule('vkl_sm_tick_d30', '* * * * *', 'select vkl_priv.sm_tick_d30()');
select cron.schedule('vkl_sm_lm_gio', '2 * * * *', 'select vkl_priv.sm_lm_gio2()');
