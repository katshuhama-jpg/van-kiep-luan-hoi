-- Bổ sung sự cố 31/10: máy người chơi còn mở bản game cũ vẫn gọi hàm cũ vkl_save_meta và ghi đè lại hồ sơ.
-- 1. Thêm chặn vào hàm cũ (giống vkl_save_meta2): không cho ghi số kiếp thấp hơn số đang lưu.
create or replace function public.vkl_save_meta(p_token uuid, p_meta jsonb)
returns void language plpgsql security definer set search_path to ''
as $$
declare
  v_id uuid := public.vkl_player(p_token);
  v_old int;
begin
  if v_id is null then raise exception 'NOT_LOGGED_IN'; end if;
  select coalesce((meta->>'lives')::int, 0) into v_old from public.vkl_players where id = v_id;
  if coalesce((p_meta->>'lives')::int, 0) < coalesce(v_old, 0) then raise exception 'META_REGRESS'; end if;
  update public.vkl_players set meta = p_meta where id = v_id;
end;
$$;

-- 2. Khôi phục lại số kiếp cho tài khoản bị ghi đè lần nữa sau đợt khôi phục (không tặng quà, không gửi thư lần hai).
with aff as (
  select p.id, max(l.life_no) new_lives
  from public.vkl_players p join public.vkl_lives l on l.player_name = p.username
  group by p.id having coalesce((p.meta->>'lives')::int,0) < max(l.life_no) - 1
),
up as (
  update public.vkl_players p set meta = coalesce(p.meta,'{}'::jsonb) || jsonb_build_object('lives', a.new_lives)
  from aff a where p.id = a.id returning p.id
),
sv as (
  update public.vkl_saves s set state = jsonb_set(s.state, '{char,lifeNo}', to_jsonb(a.new_lives + 1))
  from aff a
  where s.player_id = a.id and s.state ? 'char' and coalesce((s.state->'char'->>'lifeNo')::int,0) <= a.new_lives
  returning s.player_id
)
select (select count(*) from up) ho_so_khoi_phuc, (select count(*) from sv) ban_luu_doi_so_kiep;
