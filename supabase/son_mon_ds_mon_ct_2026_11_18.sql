-- 18/11 (Tyler: bấm vào người xem chi tiết chân thân, xem vào môn từ lúc nào, danh sách hấp dẫn hơn).
-- Thay hàm vkl_sm_mon_ds (tạo sáng 18/11): thêm hình chân thân (ct), vào môn lúc (vao_luc), lần chơi gần nhất (choi_luc),
-- số kiếp (kiep), từng phần Lực chiến (phan: huyet, vien_man, canh, ket_cuc...). Chỉ thêm khóa, khóa cũ giữ nguyên.
-- tk (tên đăng nhập) chỉ trả khi người gọi cùng môn (màn Thành viên dùng để ghép với vkl_sm_members).
create or replace function public.vkl_sm_mon_ds(p_token uuid, p_mon bigint)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_cung boolean;
begin
  if not exists (select 1 from public.vkl_sm_mon m where m.id = p_mon and m.ky_lap = vkl_priv.sm_ky_now() and m.giai_tan_luc is null) then
    raise exception 'SM_KHONG_CO_MON';
  end if;
  v_cung := exists (select 1 from public.vkl_sm_member where player_id = v_me and mon_id = p_mon);
  return (select coalesce(jsonb_agg(jsonb_build_object('ten', coalesce(p.meta -> 'chanThan' ->> 'name', p.username),
            'chuc', x.chuc, 'lc', coalesce(l.lc, 0), 'ta', x.player_id = v_me,
            'tk', case when v_cung then p.username end,
            'ct', case when jsonb_typeof(p.meta -> 'chanThan') = 'object' then p.meta -> 'chanThan' end,
            'vao_luc', x.vao_luc,
            'choi_luc', (select max(v.created_at) from public.vkl_lives v where v.player_id = x.player_id),
            'kiep', case when jsonb_typeof(p.meta -> 'lives') = 'number' then (p.meta ->> 'lives')::numeric::int else 0 end,
            'phan', l.phan)
            order by case x.chuc when 'chu' then 0 when 'lao' then 1 else 2 end, l.lc desc nulls last), '[]')
          from public.vkl_sm_member x join public.vkl_players p on p.id = x.player_id
          left join public.vkl_sm_luc_chien l on l.player_id = x.player_id
          where x.mon_id = p_mon);
end;
$$;
