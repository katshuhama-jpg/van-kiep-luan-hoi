-- 4.6.0 Sư Đồ: danh sách đệ tử kèm tiến độ từng người, và danh sách mọi cặp thầy trò cho quản trị (Tyler yêu cầu 15/11 tối).
-- Chỉ thêm hàm MỚI (vkl_su_ds, vkl_su_admin), không sửa bảng hay hàm cũ. Áp lại nhiều lần không hỏng.

-- Đệ tử của ngươi: pháp danh, tên, số kiếp (tính tới 10), hạn 7 ngày, thành tài lúc nào, lần chơi gần nhất.
-- Thứ tự: đang tu (còn hạn) xếp theo số kiếp giảm dần, rồi đã thành tài (mới nhất trước), rồi đã hết hạn.
create or replace function public.vkl_su_ds(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_me uuid := public.vkl_player(p_token);
begin
  if v_me is null then return null; end if;
  return coalesce((
    select jsonb_agg(x.j order by x.nhom, x.k1 desc, x.k2 desc)
    from (
      select jsonb_build_object(
               'ten', p.username,
               'phap_danh', p.meta -> 'chanThan' ->> 'name',
               'kiep', least(s.kiep, 10),
               'bai_luc', s.bai_luc,
               'han', s.bai_luc + interval '7 days',
               'thanh_tai_luc', s.thanh_tai_luc,
               'choi_luc', (select max(l.created_at) from public.vkl_lives l where l.player_id = s.de_tu)
             ) j,
             case when s.thanh_tai_luc is not null then 1 when now() <= s.bai_luc + interval '7 days' then 0 else 2 end nhom,
             s.kiep k1,
             coalesce(extract(epoch from s.thanh_tai_luc), extract(epoch from s.bai_luc)) k2
      from public.vkl_su s
      join public.vkl_players p on p.id = s.de_tu
      where s.su_phu = v_me
      order by s.bai_luc desc
      limit 200
    ) x
  ), '[]'::jsonb);
end;
$$;

-- Quản trị: mọi cặp thầy trò (mới nhất trước, tối đa 500) và số tổng; chỉ khi tên đăng nhập nằm trong vkl_sm_admin_user.
create or replace function public.vkl_su_admin(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_me uuid := public.vkl_player(p_token);
begin
  if v_me is null then raise exception 'SU_AUTH'; end if;
  if not exists (select 1 from public.vkl_players p join public.vkl_sm_admin_user a on a.username = p.username where p.id = v_me) then
    raise exception 'SU_QUYEN';
  end if;
  return jsonb_build_object(
    'luc', now(),
    'tong', (select jsonb_build_object(
               'cap', count(*),
               'su_phu', count(distinct su_phu),
               'dang_tu', count(*) filter (where thanh_tai_luc is null and now() <= bai_luc + interval '7 days'),
               'thanh_tai', count(*) filter (where thanh_tai_luc is not null),
               'het_han', count(*) filter (where thanh_tai_luc is null and now() > bai_luc + interval '7 days'),
               'bai_24h', count(*) filter (where bai_luc > now() - interval '24 hours'))
             from public.vkl_su),
    'cap', coalesce((
      select jsonb_agg(jsonb_build_object(
               'su', ps.username, 'su_pd', ps.meta -> 'chanThan' ->> 'name',
               'de', pd.username, 'de_pd', pd.meta -> 'chanThan' ->> 'name',
               'kiep', least(s.kiep, 10), 'bai_luc', s.bai_luc, 'thanh_tai_luc', s.thanh_tai_luc,
               'het_han', s.thanh_tai_luc is null and now() > s.bai_luc + interval '7 days',
               'thuong_su', s.thuong_su, 'su_nhan', s.su_nhan, 'de_nhan', s.de_nhan)
             order by s.bai_luc desc)
      from (select * from public.vkl_su order by bai_luc desc limit 500) s
      join public.vkl_players ps on ps.id = s.su_phu
      join public.vkl_players pd on pd.id = s.de_tu
    ), '[]'::jsonb),
    'co', coalesce((
      select jsonb_agg(jsonb_build_object('loai', c.loai, 'chi_tiet', c.chi_tiet, 'luc', c.luc) order by c.luc desc)
      from (select * from public.vkl_sm_co where loai like 'su\_%' order by luc desc limit 50) c
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.vkl_su_ds(uuid) from public;
revoke all on function public.vkl_su_admin(uuid) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant execute on function public.vkl_su_ds(uuid), public.vkl_su_admin(uuid) to anon, authenticated';
  end if;
end $$;
