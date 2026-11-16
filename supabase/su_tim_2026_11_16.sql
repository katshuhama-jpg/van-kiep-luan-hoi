-- 16/11/2026 (Tyler yêu cầu): người mới tự tìm sư phụ, không cần link mời.
-- Chỉ thêm bảng, hàm MỚI (vkl_su_an, vkl_su_tim, vkl_su_an_set). Không sửa hàm, bảng cũ. Bái sư vẫn qua vkl_su_bind có sẵn.
-- Áp lại nhiều lần không hỏng.

-- người chơi không muốn hiện trong danh sách "Tìm sư phụ" (mặc định ai đủ điều kiện cũng hiện)
create table if not exists public.vkl_su_an (
  player_id uuid primary key references public.vkl_players (id) on delete cascade,
  luc timestamptz not null default now()
);
alter table public.vkl_su_an enable row level security;
-- không có policy: chỉ đọc ghi qua hàm

-- Danh sách sư phụ để chọn: có chân thân, đã chơi từ 20 kiếp, có chơi trong 3 ngày qua, không ẩn tên,
-- đang kèm dưới 10 đệ tử chưa thành tài. Tối đa 8 người, ai có nhiều đệ tử thành tài và vừa chơi gần đây lên trước.
-- can: người gọi còn bái sư được không (đăng nhập, chưa có sư phụ, tài khoản mới: dưới 8 ngày và chưa quá 5 kiếp; cùng luật vkl_su_bind).
create or replace function public.vkl_su_tim(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_me uuid := public.vkl_player(p_token);
  v_can boolean := false;
  v_an boolean := false;
  v_ds jsonb;
begin
  if v_me is not null then
    v_can := not exists (select 1 from public.vkl_su where de_tu = v_me)
      and exists (select 1 from public.vkl_players where id = v_me and created_at >= now() - interval '8 days')
      and (select count(*) from (select 1 from public.vkl_lives where player_id = v_me limit 6) x) <= 5;
    v_an := exists (select 1 from public.vkl_su_an where player_id = v_me);
  end if;
  with gan as (
    select l.player_id, max(l.created_at) as choi_luc
      from public.vkl_lives l
     where l.created_at > now() - interval '3 days' and l.player_id is not null
     group by l.player_id
  ), ung as (
    select p.id, p.username, p.meta, g.choi_luc,
           (select count(*) from public.vkl_su s where s.su_phu = p.id and s.thanh_tai_luc is not null) as tai,
           (select count(*) from public.vkl_su s where s.su_phu = p.id and s.thanh_tai_luc is null and now() <= s.bai_luc + interval '7 days') as dang
      from gan g
      join public.vkl_players p on p.id = g.player_id
     where p.id <> coalesce(v_me, '00000000-0000-0000-0000-000000000000'::uuid)
       and p.meta ? 'chanThan' and jsonb_typeof(p.meta -> 'chanThan') = 'object'
       and (case when jsonb_typeof(p.meta -> 'lives') = 'number' then (p.meta ->> 'lives')::numeric else 0 end) >= 20
       and not exists (select 1 from public.vkl_su_an a where a.player_id = p.id)
       and not exists (select 1 from public.vkl_su s where s.de_tu = p.id and s.su_phu = v_me)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'ten', u.username,
           'phap_danh', u.meta -> 'chanThan' ->> 'name',
           'huyet', case when jsonb_typeof(u.meta -> 'huyet') = 'array' then jsonb_array_length(u.meta -> 'huyet') else 0 end,
           'kiep', (u.meta ->> 'lives')::numeric::int,
           'tai', u.tai,
           'choi_luc', u.choi_luc
         ) order by u.tai desc, u.choi_luc desc), '[]'::jsonb)
    into v_ds
    from (select * from ung where dang < 10 order by tai desc, choi_luc desc limit 8) u;
  return jsonb_build_object('can', v_can, 'an', v_an, 'ds', v_ds);
end;
$$;

-- Ẩn hoặc hiện tên mình trong danh sách Tìm sư phụ. Trả trạng thái mới (true: đang ẩn), null nếu phiên hỏng.
create or replace function public.vkl_su_an_set(p_token uuid, p_an boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := public.vkl_player(p_token);
begin
  if v_me is null then return null; end if;
  if p_an then
    insert into public.vkl_su_an (player_id) values (v_me) on conflict (player_id) do nothing;
  else
    delete from public.vkl_su_an where player_id = v_me;
  end if;
  return p_an;
end;
$$;

revoke all on function public.vkl_su_tim(uuid) from public;
revoke all on function public.vkl_su_an_set(uuid, boolean) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant execute on function public.vkl_su_tim(uuid), public.vkl_su_an_set(uuid, boolean) to anon, authenticated';
  end if;
end $$;
