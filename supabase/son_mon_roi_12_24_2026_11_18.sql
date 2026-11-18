-- 18/11 07:00 (Tyler): "nếu rời sơn môn thì không được lập trong 24h và không được gia nhập trong 12h".
-- Tự rời môn đã cắm cờ: vào môn khác (vào thẳng, gửi đơn, được nhận đơn) sau 12 giờ; lập môn mới sau 24 giờ.
-- Cả hai không quá lúc hết Kỷ. Bị đuổi: không khóa gì (như cũ).
--   khoa_toi      = khóa LẬP môn (24 giờ, cấu hình gio.roi_gio)
--   khoa_vao_toi  = khóa VÀO môn (12 giờ, cấu hình gio.vao_gio) - cột MỚI
-- Đổi luật nên phải sửa vài hàm có sẵn; mỗi chỗ chỉ đổi đúng một dòng (dùng replace trên định nghĩa đang chạy để không đụng phần khác).

alter table public.vkl_sm_member add column if not exists khoa_vao_toi timestamptz;
update public.vkl_sm_cfg set v = v || '{"roi_gio": 24, "vao_gio": 12}'::jsonb where k = 'gio';

-- kiểm tra rảnh để VÀO môn: dùng khóa vào (12 giờ)
create or replace function vkl_priv.sm_ranh(p_player uuid)
returns text language sql stable security definer set search_path = '' as $$
  select case when mon_id is not null then 'SM_DA_CO_MON' when khoa_vao_toi > now() then 'SM_KHOA' else null end
  from public.vkl_sm_member where player_id = p_player;
$$;

-- hàm MỚI: kiểm tra rảnh để LẬP môn: như trên, thêm khóa lập (24 giờ)
create or replace function vkl_priv.sm_ranh_lap(p_player uuid)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(vkl_priv.sm_ranh(p_player),
    (select 'SM_KHOA_LAP' from public.vkl_sm_member where player_id = p_player and khoa_toi > now()));
$$;

do $$
declare d text;
begin
  -- lập môn dùng sm_ranh_lap
  d := pg_get_functiondef('public.vkl_sm_found(uuid, text, text, text, int, int, int, int, boolean)'::regprocedure);
  if position('sm_ranh_lap' in d) = 0 then
    d := replace(d, 'v_err := vkl_priv.sm_ranh(v_me);', 'v_err := vkl_priv.sm_ranh_lap(v_me);');
    if position('sm_ranh_lap' in d) = 0 then raise exception 'found: không tìm thấy dòng sm_ranh'; end if;
    execute d;
  end if;
  -- vào môn thì xóa cả hai khóa
  d := pg_get_functiondef('vkl_priv.sm_vao'::regproc);
  if position('khoa_vao_toi' in d) = 0 then
    d := replace(d, 'vao_luc = now(), khoa_toi = null;', 'vao_luc = now(), khoa_toi = null, khoa_vao_toi = null;');
    if position('khoa_vao_toi' in d) = 0 then raise exception 'sm_vao: không tìm thấy dòng khoa_toi'; end if;
    execute d;
  end if;
  -- ra khỏi môn (cả bị đuổi) thì xóa khóa vào cũ; vkl_sm_leave đặt lại sau
  d := pg_get_functiondef('vkl_priv.sm_out'::regproc);
  if position('khoa_vao_toi' in d) = 0 then
    d := replace(d, 'khoa_toi = p_khoa where player_id = p_player;', 'khoa_toi = p_khoa, khoa_vao_toi = null where player_id = p_player;');
    if position('khoa_vao_toi' in d) = 0 then raise exception 'sm_out: không tìm thấy dòng khoa_toi'; end if;
    execute d;
  end if;
  -- trạng thái trả thêm khoa_vao_toi
  d := pg_get_functiondef('public.vkl_sm_state(uuid)'::regprocedure);
  if position('khoa_vao_toi' in d) = 0 then
    d := replace(d, $r$'khoa_toi', case when m.khoa_toi > now() then m.khoa_toi end,$r$,
      $r$'khoa_toi', case when m.khoa_toi > now() then m.khoa_toi end, 'khoa_vao_toi', case when m.khoa_vao_toi > now() then m.khoa_vao_toi end,$r$);
    if position('khoa_vao_toi' in d) = 0 then raise exception 'state: không tìm thấy dòng khoa_toi'; end if;
    execute d;
  end if;
end $$;

create or replace function public.vkl_sm_leave(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_mon public.vkl_sm_mon; v_khoa timestamptz; v_khoa_vao timestamptz; v_het timestamptz; v_moi uuid;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id for update;
  if v_mon.cam_co_luc is not null then
    select ket_thuc into v_het from public.vkl_sm_ky where id = v_mon.ky_lap;
    v_khoa := least(now() + make_interval(hours => coalesce(vkl_priv.sm_cfg('gio', 'roi_gio'), 24)::int), v_het);
    v_khoa_vao := least(now() + make_interval(hours => coalesce(vkl_priv.sm_cfg('gio', 'vao_gio'), 12)::int), v_het);
  end if;
  perform vkl_priv.sm_out(v_me, v_khoa);
  update public.vkl_sm_member set khoa_vao_toi = v_khoa_vao where player_id = v_me;
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
  return jsonb_build_object('ok', true, 'khoa_toi', v_khoa, 'khoa_vao_toi', v_khoa_vao);
end;
$$;

-- người đang bị khóa (khóa lập đặt lúc rời + 24 giờ): khóa vào = khóa lập - 12 giờ
update public.vkl_sm_member set khoa_vao_toi = khoa_toi - interval '12 hours' where khoa_toi > now() and khoa_vao_toi is null;
