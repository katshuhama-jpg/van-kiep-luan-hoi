-- 4.6.0 sửa nóng 18/11 (Tyler: "Cần có nút xem danh sách người chơi trong guild"):
-- người chưa có môn xem được ai đang ở trong một môn trước khi vào.
-- Hàm MỚI, không sửa hàm cũ. Chỉ trả tên chân thân, chức, Lực chiến (không trả tài khoản, không trả chỗ đứng trên bản đồ).
-- Cần token có chân thân (như vkl_sm_list). Chỉ môn của Kỷ đang chạy, chưa giải tán.
create or replace function public.vkl_sm_mon_ds(p_token uuid, p_mon bigint)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token);
begin
  if not exists (select 1 from public.vkl_sm_mon m where m.id = p_mon and m.ky_lap = vkl_priv.sm_ky_now() and m.giai_tan_luc is null) then
    raise exception 'SM_KHONG_CO_MON';
  end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('ten', coalesce(p.meta -> 'chanThan' ->> 'name', p.username),
            'chuc', x.chuc, 'lc', coalesce(l.lc, 0), 'ta', x.player_id = v_me)
            order by case x.chuc when 'chu' then 0 when 'lao' then 1 else 2 end, l.lc desc nulls last), '[]')
          from public.vkl_sm_member x join public.vkl_players p on p.id = x.player_id
          left join public.vkl_sm_luc_chien l on l.player_id = x.player_id
          where x.mon_id = p_mon);
end;
$$;
revoke all on function public.vkl_sm_mon_ds(uuid, bigint) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant execute on function public.vkl_sm_mon_ds(uuid, bigint) to anon, authenticated';
  end if;
end $$;
