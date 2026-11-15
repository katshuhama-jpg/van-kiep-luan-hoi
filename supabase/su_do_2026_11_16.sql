-- 4.6.0 Ngày 3b Sư Đồ (đêm 15/11/2026, người chơi thấy từ 5:00 sáng 16/11).
-- Chỉ thêm bảng, hàm, trigger MỚI (bảng vkl_su, hàm vkl_su_*, vkl_priv.su_*). Không sửa hàm, bảng cũ.
-- Áp lại cả file nhiều lần không hỏng: create if not exists, create or replace, trigger tạo trong khối DO khi chưa có.
-- Bảng bật RLS và không có policy: trình duyệt chỉ đọc ghi qua hàm SECURITY DEFINER.
-- Phúc duyên nằm trong vkl_players.meta do trình duyệt ghi đè, nên máy chủ KHÔNG tự cộng: chỉ đánh dấu "chờ nhận",
-- trình duyệt gọi vkl_su_claim lấy số phúc duyên rồi tự cộng vào meta và lưu như thường.

create schema if not exists vkl_priv;

create table if not exists public.vkl_su (
  de_tu uuid primary key references public.vkl_players (id) on delete cascade,
  su_phu uuid not null references public.vkl_players (id) on delete cascade,
  bai_luc timestamptz not null default now(),
  kiep int not null default 0,                 -- số kiếp sống tới 16 tuổi trong 7 ngày đầu
  thanh_tai_luc timestamptz,                   -- đủ 10 kiếp
  thuong_su boolean not null default false,    -- sư phụ được thưởng (trần 5 đệ tử mỗi 7 ngày)
  su_nhan boolean not null default false,      -- sư phụ đã nhận thưởng
  de_nhan boolean not null default false,      -- đệ tử đã nhận thưởng
  sid text                                     -- mã máy của đệ tử lúc bái (để đánh dấu nghi gian lận)
);
create index if not exists vkl_su_su_phu_idx on public.vkl_su (su_phu);
alter table public.vkl_su enable row level security;
-- không có policy: chỉ đọc ghi qua hàm

-- ---------- Hàm nội bộ ----------
-- đánh dấu cho Tyler xem (vào vkl_sm_co của Sơn Môn); chưa có sm_flag hay lỗi gì cũng bỏ qua
create or replace function vkl_priv.su_flag(p_loai text, p_ct jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  begin
    perform vkl_priv.sm_flag(p_loai, p_ct);
  exception when others then
    null;
  end;
end;
$$;

-- trigger sau khi ghi bia: đếm kiếp của đệ tử chưa thành tài (không bao giờ chặn việc ghi bia)
create or replace function vkl_priv.su_after_life()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  r public.vkl_su;
  v_n int;
begin
  begin
    if new.player_id is null or coalesce(new.age, 0) < 16 then return null; end if;
    update public.vkl_su
       set kiep = kiep + 1,
           thanh_tai_luc = case when kiep + 1 >= 10 then now() else null end
     where de_tu = new.player_id and thanh_tai_luc is null and now() <= bai_luc + interval '7 days'
     returning * into r;
    if r.de_tu is null or r.thanh_tai_luc is null then return null; end if;
    -- xếp hàng theo sư phụ để đếm trần 5 đệ tử/7 ngày cho đúng khi hai đệ tử thành tài cùng lúc
    perform pg_advisory_xact_lock(hashtext('vkl_su:' || r.su_phu::text));
    select count(*) into v_n from public.vkl_su
     where su_phu = r.su_phu and de_tu <> r.de_tu and thuong_su and thanh_tai_luc > now() - interval '7 days';
    update public.vkl_su set thuong_su = (v_n < 5) where de_tu = r.de_tu;
    if exists (select 1 from public.vkl_su where su_phu = r.su_phu and de_tu <> r.de_tu and thanh_tai_luc > now() - interval '1 hour') then
      perform vkl_priv.su_flag('su_cung_gio', jsonb_build_object('su_phu', r.su_phu, 'de_tu', r.de_tu));
    end if;
  exception when others then
    null;
  end;
  return null;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'vkl_lives_zz_su_do' and tgrelid = 'public.vkl_lives'::regclass) then
    create trigger vkl_lives_zz_su_do after insert on public.vkl_lives
      for each row execute function vkl_priv.su_after_life();
  end if;
end $$;

-- ---------- Hàm cho trình duyệt ----------
-- Bái sư. Trả mã: OK, SU_AUTH (phiên hỏng), SU_NONE (không có sư phụ đó), SU_SELF (tự bái mình, hoặc bái chính đệ tử của mình),
-- SU_DONE (đã có sư phụ), SU_OLD (tài khoản cũ: tạo quá 8 ngày hoặc đã quá 5 kiếp).
create or replace function public.vkl_su_bind(p_token uuid, p_su text, p_sid text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := public.vkl_player(p_token);
  v_su uuid;
  v_sid text := left(nullif(trim(coalesce(p_sid, '')), ''), 64);
begin
  if v_me is null then return 'SU_AUTH'; end if;
  select id into v_su from public.vkl_players where username = lower(trim(coalesce(p_su, '')));
  if v_su is null then return 'SU_NONE'; end if;
  if v_su = v_me then return 'SU_SELF'; end if;
  if exists (select 1 from public.vkl_su where de_tu = v_me) then return 'SU_DONE'; end if;
  if exists (select 1 from public.vkl_players where id = v_me and created_at < now() - interval '8 days')
     or (select count(*) from (select 1 from public.vkl_lives where player_id = v_me limit 6) x) > 5 then
    return 'SU_OLD';
  end if;
  -- hai người bái nhau làm sư phụ
  if exists (select 1 from public.vkl_su where de_tu = v_su and su_phu = v_me) then return 'SU_SELF'; end if;
  insert into public.vkl_su (de_tu, su_phu, sid) values (v_me, v_su, v_sid) on conflict (de_tu) do nothing;
  if not found then return 'SU_DONE'; end if;
  if v_sid is not null and exists (
    select 1 from public.vkl_su where sid = v_sid and de_tu <> v_me and (su_phu = v_su or de_tu = v_su)
  ) then
    perform vkl_priv.su_flag('su_cung_may', jsonb_build_object('su_phu', v_su, 'de_tu', v_me, 'sid', v_sid));
  end if;
  return 'OK';
end;
$$;

-- Sư Đồ của mình: sư phụ, tiến độ thành tài, số đệ tử, phúc duyên chờ nhận
create or replace function public.vkl_su_info(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_me uuid := public.vkl_player(p_token);
  r public.vkl_su;
begin
  if v_me is null then return null; end if;
  select * into r from public.vkl_su where de_tu = v_me;
  return jsonb_build_object(
    'su', (select jsonb_build_object('ten', p.username, 'phap_danh', p.meta -> 'chanThan' ->> 'name') from public.vkl_players p where p.id = r.su_phu),
    'kiep', coalesce(r.kiep, 0),
    'han', r.bai_luc + interval '7 days',
    'thanh_tai', r.thanh_tai_luc is not null,
    'de_tu', (select count(*) from public.vkl_su where su_phu = v_me),
    'thanh_tai_n', (select count(*) from public.vkl_su where su_phu = v_me and thanh_tai_luc is not null),
    'cho_nhan', (case when r.thanh_tai_luc is not null and not r.de_nhan then 20 else 0 end)
                + 20 * (select count(*) from public.vkl_su where su_phu = v_me and thuong_su and not su_nhan)
  );
end;
$$;

-- Nhận thưởng: đánh dấu đã nhận trong một câu lệnh, trả số phúc duyên vừa nhận (gọi hai lần thì lần sau trả 0)
create or replace function public.vkl_su_claim(p_token uuid)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := public.vkl_player(p_token);
  v_n int;
begin
  if v_me is null then return 0; end if;
  with a as (
    update public.vkl_su set de_nhan = true where de_tu = v_me and thanh_tai_luc is not null and not de_nhan returning 1
  ), b as (
    update public.vkl_su set su_nhan = true where su_phu = v_me and thuong_su and not su_nhan returning 1
  )
  select 20 * ((select count(*) from a) + (select count(*) from b))::int into v_n;
  return coalesce(v_n, 0);
end;
$$;

-- Số đệ tử thành tài (cho đạo Truyền Đạo, cần 20)
create or replace function public.vkl_su_count(p_token uuid)
returns int language plpgsql stable security definer set search_path = '' as $$
declare
  v_me uuid := public.vkl_player(p_token);
begin
  if v_me is null then return null; end if;
  return (select count(*) from public.vkl_su where su_phu = v_me and thanh_tai_luc is not null)::int;
end;
$$;

-- ---------- Quyền ----------
revoke all on function vkl_priv.su_flag(text, jsonb) from public;
revoke all on function vkl_priv.su_after_life() from public;
revoke all on function public.vkl_su_bind(uuid, text, text) from public;
revoke all on function public.vkl_su_info(uuid) from public;
revoke all on function public.vkl_su_claim(uuid) from public;
revoke all on function public.vkl_su_count(uuid) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function vkl_priv.su_flag(text, jsonb), vkl_priv.su_after_life() from anon, authenticated';
    execute 'grant execute on function public.vkl_su_bind(uuid, text, text), public.vkl_su_info(uuid), public.vkl_su_claim(uuid), public.vkl_su_count(uuid) to anon, authenticated';
  end if;
end $$;
