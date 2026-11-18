-- 18/11 (Tyler): sơn môn mới được bảo hộ 48 giờ kể từ lúc cắm cờ, không môn nào đánh được ô của môn đó.
-- Môn đang được bảo hộ mà xuất chinh vào ô CÓ CHỦ của môn khác thì mất bảo hộ ngay (chiếm ô trống vẫn giữ).
-- Cách làm: dùng lại bảo hộ ô có sẵn (vkl_sm_tile.bao_ho_toi đã chặn xuất chinh, chặn trận, hiện trên bản đồ):
--   cột MỚI vkl_sm_mon.moi_bh_toi = cam_co_luc + gio.moi_gio (48); mọi ô của môn có bao_ho_toi ít nhất tới mốc đó.
--   trigger MỚI trên vkl_sm_mon (đặt mốc khi cắm cờ, dọn bảo hộ ô khi mất) và trên vkl_sm_tile (ô mới chiếm cũng được bảo hộ).
--   vkl_sm_march: thêm một dòng (mất bảo hộ khi đánh ô có chủ). vkl_sm_state: trả thêm moi_bh_toi.
-- Áp lại nhiều lần không hỏng.

alter table public.vkl_sm_mon add column if not exists moi_bh_toi timestamptz;
update public.vkl_sm_cfg set v = v || '{"moi_gio": 48}'::jsonb where k = 'gio';

-- đặt mốc bảo hộ khi môn cắm cờ lần đầu
create or replace function vkl_priv.sm_mon_bh_dat()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.cam_co_luc is not null and (tg_op = 'INSERT' or old.cam_co_luc is null) and new.moi_bh_toi is null then
    new.moi_bh_toi := new.cam_co_luc + make_interval(hours => coalesce(vkl_priv.sm_cfg('gio', 'moi_gio'), 48)::int);
  end if;
  return new;
end;
$$;
drop trigger if exists vkl_sm_mon_bh_dat on public.vkl_sm_mon;
create trigger vkl_sm_mon_bh_dat before insert or update of cam_co_luc on public.vkl_sm_mon
  for each row execute function vkl_priv.sm_mon_bh_dat();

-- mốc đổi: nâng bảo hộ các ô của môn lên mốc mới; mốc rút về (mất bảo hộ) thì bỏ phần bảo hộ do mốc cũ
create or replace function vkl_priv.sm_mon_bh_o()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.moi_bh_toi is distinct from old.moi_bh_toi then
    if old.moi_bh_toi is not null and (new.moi_bh_toi is null or new.moi_bh_toi < old.moi_bh_toi) then
      update public.vkl_sm_tile set bao_ho_toi = null where mon_id = new.id and bao_ho_toi = old.moi_bh_toi;
    end if;
    if new.moi_bh_toi is not null and new.moi_bh_toi > now() then
      update public.vkl_sm_tile set bao_ho_toi = new.moi_bh_toi
       where mon_id = new.id and (bao_ho_toi is null or bao_ho_toi < new.moi_bh_toi);
    end if;
  end if;
  return null;
end;
$$;
drop trigger if exists vkl_sm_mon_bh_o on public.vkl_sm_mon;
create trigger vkl_sm_mon_bh_o after update of moi_bh_toi on public.vkl_sm_mon
  for each row execute function vkl_priv.sm_mon_bh_o();

-- ô vừa về tay một môn đang được bảo hộ: ô đó cũng được bảo hộ tới mốc của môn
create or replace function vkl_priv.sm_tile_bh()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v timestamptz;
begin
  if new.mon_id is not null then
    select moi_bh_toi into v from public.vkl_sm_mon where id = new.mon_id;
    if v is not null and v > now() and (new.bao_ho_toi is null or new.bao_ho_toi < v) then
      new.bao_ho_toi := v;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists vkl_sm_tile_bh on public.vkl_sm_tile;
create trigger vkl_sm_tile_bh before insert or update of mon_id, bao_ho_toi on public.vkl_sm_tile
  for each row execute function vkl_priv.sm_tile_bh();

-- xuất chinh vào ô có chủ khi môn mình đang được bảo hộ: mất bảo hộ
do $$
declare d text;
begin
  d := pg_get_functiondef('public.vkl_sm_march(uuid, int, int)'::regprocedure);
  if position('moi_bh_toi' in d) = 0 then
    d := replace(d, $r$if t.bao_ho_toi > now() and t.mon_id is not null then raise exception 'SM_BAO_HO'; end if;$r$,
      $r$if t.bao_ho_toi > now() and t.mon_id is not null then raise exception 'SM_BAO_HO'; end if;
  if t.mon_id is not null and v_mon.moi_bh_toi > now() then update public.vkl_sm_mon set moi_bh_toi = now() where id = v_mon.id; end if;$r$);
    if position('moi_bh_toi' in d) = 0 then raise exception 'march: không tìm thấy dòng SM_BAO_HO'; end if;
    execute d;
  end if;
  d := pg_get_functiondef('public.vkl_sm_state(uuid)'::regprocedure);
  if position('moi_bh_toi' in d) = 0 then
    d := replace(d, $r$'cam_co', v_mon.cam_co_luc is not null,$r$,
      $r$'cam_co', v_mon.cam_co_luc is not null, 'moi_bh_toi', case when v_mon.moi_bh_toi > now() then v_mon.moi_bh_toi end,$r$);
    if position('moi_bh_toi' in d) = 0 then raise exception 'state: không tìm thấy dòng cam_co'; end if;
    execute d;
  end if;
end $$;

-- môn đã cắm cờ trước khi có luật: bảo hộ 48 giờ tính từ lúc cắm cờ
update public.vkl_sm_mon set moi_bh_toi = cam_co_luc + make_interval(hours => coalesce(vkl_priv.sm_cfg('gio', 'moi_gio'), 48)::int)
 where cam_co_luc is not null and moi_bh_toi is null and giai_tan_luc is null;
