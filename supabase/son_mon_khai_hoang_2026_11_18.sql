-- 18/11 (Tyler: người chơi không biết mở rộng ô, tưởng phải đánh nhau).
-- Khai hoang: cắm cờ NGAY một ô trống kề lãnh thổ, không tập hợp, không đi đường, không giao tranh.
-- Ai trong môn cũng làm được (cả đệ tử), vẫn theo trần số ô của môn. Hàm mới, không sửa hàm cũ.
-- Bảo hộ ô mới do trigger vkl_sm_tile_bh tự đặt như ô chiếm bằng xuất chinh.

create or replace function public.vkl_sm_khai_hoang(p_token uuid, p_q integer, p_r integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_mon public.vkl_sm_mon; t public.vkl_sm_tile;
  v_ten text; v_bh timestamptz; v_n int;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id for update;
  if not exists (select 1 from public.vkl_sm_tile where mon_id = v_mon.id) then raise exception 'SM_CHUA_CO_O'; end if;
  select * into t from public.vkl_sm_tile where ky_id = v_mon.ky_lap and q = p_q and r = p_r for update;
  if t.ky_id is null then raise exception 'SM_O'; end if;
  if t.mon_id = v_mon.id then raise exception 'SM_O_CUA_TA'; end if;
  if t.mon_id is not null then raise exception 'SM_O_CO_CHU'; end if;
  select count(*) into v_n from public.vkl_sm_tile where mon_id = v_mon.id;
  if v_n >= vkl_priv.sm_o_max(v_mon.id) then raise exception 'SM_DU_O'; end if;
  if not exists (select 1 from public.vkl_sm_tile where mon_id = v_mon.id and vkl_priv.sm_dist(q, r, p_q, p_r) = 1) then raise exception 'SM_KHONG_KE'; end if;
  if exists (select 1 from public.vkl_sm_chinh where ky_id = t.ky_id and toi_q = p_q and toi_r = p_r and trang_thai in ('tap_hop', 'di')) then
    raise exception 'SM_O_DANG_BI_TOI';
  end if;
  if m.nghi_toi > now() then raise exception 'SM_NGHI'; end if;
  update public.vkl_sm_tile set mon_id = v_mon.id, chinh_dien = false, chiem_luc = now()
   where ky_id = t.ky_id and q = p_q and r = p_r
   returning bao_ho_toi into v_bh;
  select username into v_ten from public.vkl_players where id = v_me;
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, q, r, noi_dung)
  values (t.ky_id, 'cam_co', v_mon.id, p_q, p_r,
          jsonb_build_object('kq', 'cam_co', 'ten_o', t.ten, 'khai_hoang', true, 'nguoi', v_ten, 'bao_ho_toi', v_bh));
  return jsonb_build_object('ok', true, 'ten_o', t.ten, 'bao_ho_toi', v_bh, 'o', v_n + 1, 'o_max', vkl_priv.sm_o_max(v_mon.id));
end;
$$;

revoke all on function public.vkl_sm_khai_hoang(uuid, integer, integer) from public;
grant execute on function public.vkl_sm_khai_hoang(uuid, integer, integer) to anon, authenticated;
