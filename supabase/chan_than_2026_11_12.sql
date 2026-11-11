-- 4.5.0 Ngày 3 (12/11/2026): số liệu cho đạo Hương Hỏa và Từ Bi (đọc từ Nghĩa trang).
-- Không sửa hàm cũ: thêm bảng ghi ai thắp mộ nào, hàm ghi (trình duyệt gọi sau vkl_thap_huong) và hàm đọc.

create table if not exists public.vkl_huong_log (
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  life_id bigint not null references public.vkl_lives (id) on delete cascade,
  at timestamptz not null default now(),
  primary key (player_id, life_id)
);
alter table public.vkl_huong_log enable row level security;
-- không có policy: chỉ đọc ghi qua hàm

create or replace function public.vkl_huong_ghi(p_token uuid, p_life_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := public.vkl_player(p_token);
begin
  if v_me is null then return; end if;
  -- mộ của chính mình không tính cho Từ Bi
  if exists (select 1 from public.vkl_lives where id = p_life_id and player_id <> v_me) then
    insert into public.vkl_huong_log (player_id, life_id) values (v_me, p_life_id) on conflict do nothing;
  end if;
end;
$$;

-- incense: tổng hương các mộ của mình được thắp; lit: số mộ khác nhau (của người khác) mình đã thắp từ 12/11/2026
create or replace function public.vkl_ct_ext(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := public.vkl_player(p_token);
begin
  if v_me is null then return null; end if;
  return jsonb_build_object(
    'incense', (select coalesce(sum(incense), 0) from public.vkl_lives where player_id = v_me),
    'lit', (select count(*) from public.vkl_huong_log where player_id = v_me)
  );
end;
$$;

grant execute on function public.vkl_huong_ghi(uuid, bigint) to anon, authenticated;
grant execute on function public.vkl_ct_ext(uuid) to anon, authenticated;
