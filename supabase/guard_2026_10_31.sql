-- Lớp 1: máy chủ tự nâng số kiếp theo bia. Lập bia kiếp N thì hồ sơ có ít nhất N kiếp.
create or replace function public.vkl_lives_bump() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.player_id is not null and new.life_no is not null then
    update public.vkl_players
      set meta = coalesce(meta, '{}'::jsonb) || jsonb_build_object('lives', new.life_no)
      where id = new.player_id and coalesce((meta->>'lives')::int, 0) < new.life_no;
  end if;
  return new;
end $$;
drop trigger if exists vkl_lives_bump on public.vkl_lives;
create trigger vkl_lives_bump after insert on public.vkl_lives for each row execute function public.vkl_lives_bump();

-- Lớp 2: lịch sử hồ sơ. Giữ bản cũ khi số kiếp đổi, hoặc 10 phút một bản.
create table if not exists public.vkl_meta_hist (
  id bigserial primary key,
  player_id uuid not null,
  lives int,
  meta jsonb not null,
  at timestamptz not null default now()
);
create index if not exists vkl_meta_hist_p on public.vkl_meta_hist (player_id, at desc);
alter table public.vkl_meta_hist enable row level security;

create or replace function public.vkl_meta_keep() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.meta is not null and old.meta is distinct from new.meta and (
       coalesce((old.meta->>'lives')::int, 0) <> coalesce((new.meta->>'lives')::int, 0)
       or not exists (select 1 from public.vkl_meta_hist h where h.player_id = old.id and h.at > now() - interval '10 minutes')
     ) then
    insert into public.vkl_meta_hist (player_id, lives, meta) values (old.id, (old.meta->>'lives')::int, old.meta);
  end if;
  return new;
end $$;
drop trigger if exists vkl_meta_keep on public.vkl_players;
create trigger vkl_meta_keep before update of meta on public.vkl_players for each row execute function public.vkl_meta_keep();

-- Lớp 3: kiểm tra mỗi đêm. Đếm tài khoản có số kiếp thấp hơn bia, ghi vào vkl_daily; dọn lịch sử hồ sơ (giữ 60 bản mỗi người).
create or replace function public.vkl_nightly_check(d date) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r jsonb;
begin
  select jsonb_build_object(
    'lives_behind', count(*),
    'lives_behind_names', coalesce(jsonb_agg(username) filter (where true), '[]'::jsonb)
  ) into r
  from (
    select p.username from public.vkl_players p join public.vkl_lives l on l.player_id = p.id
    group by p.id having coalesce((p.meta->>'lives')::int, 0) < max(l.life_no)
  ) x;
  update public.vkl_daily set stats = stats || r where day = d;
  delete from public.vkl_meta_hist h using (
    select id from (select id, row_number() over (partition by player_id order by at desc) rn from public.vkl_meta_hist) z where rn > 60
  ) o where h.id = o.id;
  return r;
end $$;
revoke all on function public.vkl_nightly_check(date) from public, anon, authenticated;
revoke all on function public.vkl_lives_bump() from public, anon, authenticated;
revoke all on function public.vkl_meta_keep() from public, anon, authenticated;

-- Lịch: 00:15 giờ VN mỗi đêm (sau bản tổng kết 00:05)
select cron.schedule('vkl_nightly_check', '15 17 * * *', $$select public.vkl_nightly_check(((now() at time zone 'Asia/Ho_Chi_Minh')::date - 1))$$);
