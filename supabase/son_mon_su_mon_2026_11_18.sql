-- 4.6.0 Ngày 7 (đêm 17/11): môn của sư phụ, để danh sách môn đưa môn đó lên đầu và hiện nút "Vào môn của sư phụ".
-- Hàm MỚI, không sửa hàm cũ. Trả id môn sư phụ đang ở (null nếu không có sư phụ hoặc sư phụ chưa vào môn).
create or replace function public.vkl_sm_su_mon(p_token uuid)
returns bigint language sql stable security definer set search_path = '' as $$
  select m.mon_id
  from public.vkl_su s
  join public.vkl_sm_member m on m.player_id = s.su_phu
  where s.de_tu = public.vkl_player(p_token) and m.mon_id is not null
  limit 1;
$$;
revoke all on function public.vkl_sm_su_mon(uuid) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant execute on function public.vkl_sm_su_mon(uuid) to anon, authenticated';
  end if;
end $$;

-- Chấm đỏ tab Sơn Môn: số môn đủ chữ ký, mở cửa, còn chỗ trong Kỷ đang chạy (công khai, không cần token).
create or replace function public.vkl_sm_mo_n()
returns int language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.vkl_sm_mon m
  where m.ky_lap = vkl_priv.sm_ky_now() and m.du_ky and m.mo_cua and m.giai_tan_luc is null
    and vkl_priv.sm_mon_n(m.id) < vkl_priv.sm_cfg('mon', 'toi_da');
$$;
revoke all on function public.vkl_sm_mo_n() from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant execute on function public.vkl_sm_mo_n() to anon, authenticated';
  end if;
end $$;
