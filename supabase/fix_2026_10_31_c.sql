-- Tối 31/10: vài tài khoản mới chơi tiếp sau lần tải hồ sơ lỗi mạng, game không ghi số kiếp lên máy chủ.
-- Khôi phục số kiếp theo bia ở Nghĩa trang (giống fix_2026_10_31_b.sql). Kiếp đang chơi được đổi số cho khớp.
with aff as (
  select p.id, max(l.life_no) new_lives
  from public.vkl_players p join public.vkl_lives l on l.player_id = p.id
  group by p.id having coalesce((p.meta->>'lives')::int,0) < max(l.life_no) - 1
     or (coalesce((p.meta->>'lives')::int,0) < max(l.life_no)
         and coalesce((select (s.state->'char'->>'lifeNo')::int from public.vkl_saves s where s.player_id = p.id), 0) > max(l.life_no))
),
up as (
  update public.vkl_players p set meta = coalesce(p.meta,'{}'::jsonb) || jsonb_build_object('lives', a.new_lives)
  from aff a where p.id = a.id returning p.username
),
sv as (
  update public.vkl_saves s set state = jsonb_set(s.state, '{char,lifeNo}', to_jsonb(a.new_lives + 1))
  from aff a
  where s.player_id = a.id and s.state ? 'char' and coalesce((s.state->'char'->>'lifeNo')::int,0) <= a.new_lives
  returning s.player_id
)
select (select string_agg(username, ', ') from up) ho_so_khoi_phuc, (select count(*) from sv) ban_luu_doi_so_kiep;
