-- 18/11 sáng (Tyler: "rời sơn môn hết kỷ mới được lập thì hơi dở, hãy để là sau 24h"):
-- tự rời môn đã cắm cờ thì chỉ chờ 24 giờ (không quá lúc hết Kỷ) rồi vào hoặc lập môn khác. Bị đuổi vẫn vào ngay.
-- Số giờ để ở cấu hình gio.roi_gio (đổi được mà không sửa hàm). Đây là đổi luật nên phải sửa hàm vkl_sm_leave có sẵn
-- (chỉ đổi dòng tính v_khoa, phần còn lại giữ nguyên).
update public.vkl_sm_cfg set v = v || '{"roi_gio": 24}'::jsonb where k = 'gio';

create or replace function public.vkl_sm_leave(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_mon public.vkl_sm_mon; v_khoa timestamptz; v_moi uuid;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id for update;
  v_khoa := case when v_mon.cam_co_luc is not null then
    least(now() + make_interval(hours => coalesce(vkl_priv.sm_cfg('gio', 'roi_gio'), 24)::int),
          (select ket_thuc from public.vkl_sm_ky where id = v_mon.ky_lap)) end;
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

-- người đã tự rời trước khi đổi luật (rời trong sáng 18/11): rút khóa xuống còn tối đa 24 giờ tính từ bây giờ
update public.vkl_sm_member set khoa_toi = least(khoa_toi, now() + interval '24 hours') where khoa_toi > now();
