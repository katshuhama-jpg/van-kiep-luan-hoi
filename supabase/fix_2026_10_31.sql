-- Sửa sự cố 31/10/2026: hồ sơ người chơi bị ghi đè làm mất số kiếp khi máy chủ quá tải.
-- Chạy một lần trong Supabase SQL Editor (project van-kiep-luan-hoi). Chạy lại phần 2 cũng an toàn (chỉ đụng tài khoản còn lệch).

-- 1. Chặn trên máy chủ: không cho ghi hồ sơ có số kiếp thấp hơn số đang lưu.
--    Game (bản 155e439 trở đi) tự dùng hàm này khi nó tồn tại.
create or replace function public.vkl_save_meta2(p_token uuid, p_meta jsonb)
returns void language plpgsql security definer set search_path to ''
as $$
declare
  v_id uuid := public.vkl_player(p_token);
  v_old int;
  v_new int := coalesce((p_meta->>'lives')::int, 0);
begin
  if v_id is null then raise exception 'NOT_LOGGED_IN'; end if;
  select coalesce((meta->>'lives')::int, 0) into v_old from public.vkl_players where id = v_id;
  if v_new < coalesce(v_old, 0) then raise exception 'META_REGRESS'; end if;
  update public.vkl_players set meta = p_meta where id = v_id;
end;
$$;
grant execute on function public.vkl_save_meta2(uuid, jsonb) to anon, authenticated;

-- 2. Khôi phục các tài khoản bị mất: số kiếp theo bia trong Nghĩa trang, kết cục theo bia,
--    đẩy kiếp đang chơi dở lên số kế tiếp (không mất kiếp đang chơi), tặng phúc duyên đền bù (3 phúc mỗi kiếp mất, 10-200) và gửi thư xin lỗi.
with aff as (
  select p.id, p.username, coalesce((p.meta->>'lives')::int,0) old_lives, max(l.life_no) new_lives
  from public.vkl_players p join public.vkl_lives l on l.player_name = p.username
  group by p.id having coalesce((p.meta->>'lives')::int,0) < max(l.life_no) - 1
),
ends as (
  select a.id, jsonb_object_agg(g.k, g.n) e
  from aff a join (select player_name, look->>'ending' k, count(*)::int n from public.vkl_lives where look->>'ending' is not null group by 1,2) g on g.player_name = a.username
  group by a.id
),
up as (
  update public.vkl_players p set meta = coalesce(p.meta,'{}'::jsonb)
    || jsonb_build_object('lives', a.new_lives)
    || jsonb_build_object('endings', coalesce(e.e,'{}'::jsonb) || coalesce(p.meta->'endings','{}'::jsonb))
  from aff a left join ends e on e.id = a.id
  where p.id = a.id
  returning p.id
),
sv as (
  update public.vkl_saves s set state = jsonb_set(s.state, '{char,lifeNo}', to_jsonb(a.new_lives + 1))
  from aff a
  where s.player_id = a.id and s.state ? 'char' and coalesce((s.state->'char'->>'lifeNo')::int,0) <= a.new_lives
  returning s.player_id
),
g as (
  insert into public.vkl_gift (to_player, kind, amount, note)
  select username, 'phuc', least(200, greatest(10, 3*(new_lives-old_lives))),
    'Thiên Đạo đền bù: hồ sơ của đạo hữu bị lỗi máy chủ ghi đè chiều 31/10, nay đã khôi phục ' || new_lives || ' kiếp'
  from aff returning id
),
m as (
  insert into public.vkl_mail (to_player, from_player, kind, body)
  select username, null, 'thien_dao',
    'Thiên Đạo tạ lỗi: chiều 31/10 máy chủ quá tải, hồ sơ của đạo hữu bị ghi đè làm mất số kiếp đã qua. Nay đã khôi phục ' || new_lives
    || ' kiếp và các kết cục trong Sổ Sinh Tử theo bia ở Nghĩa trang, gửi kèm ' || least(200, greatest(10, 3*(new_lives-old_lives)))
    || ' phúc duyên đền bù. Tải lại trang để nhận. Lỗi đã được sửa.'
  from aff returning id
)
select (select count(*) from up) ho_so_khoi_phuc, (select count(*) from sv) ban_luu_doi_so_kiep, (select count(*) from g) qua, (select count(*) from m) thu;
