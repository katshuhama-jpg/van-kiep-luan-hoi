-- 17/11 (Tyler: "Làm chat tự do trong Sơn môn cho xôm"): Truyền âm - chat trong môn.
-- Chỉ người trong môn đọc và gửi được tin của môn mình. Bảng bật RLS, không policy, chỉ đọc/ghi qua hàm SECURITY DEFINER.
-- An toàn: tối đa 200 ký tự; một tin mỗi 3 giây, 15 tin mỗi phút; che từ tục; ẩn link và số điện thoại (chống lừa đảo);
-- môn chủ, trưởng lão ẩn được tin, người viết tự xóa được tin mình; báo xấu: 3 người báo thì tin tự ẩn, mọi lần báo ghi vào vkl_sm_co.
-- Hàm MỚI, không sửa hàm cũ. Áp lại cả file nhiều lần không hỏng.

create table if not exists public.vkl_sm_chat (
  id bigserial primary key,
  mon_id bigint not null references public.vkl_sm_mon (id) on delete cascade,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  noi_dung text not null check (char_length(noi_dung) between 1 and 400),
  luc timestamptz not null default now(),
  an boolean not null default false,
  an_boi uuid
);
create index if not exists vkl_sm_chat_mon on public.vkl_sm_chat (mon_id, id desc);
create index if not exists vkl_sm_chat_nguoi on public.vkl_sm_chat (player_id, luc desc);
alter table public.vkl_sm_chat enable row level security;

create table if not exists public.vkl_sm_chat_bao (
  chat_id bigint not null references public.vkl_sm_chat (id) on delete cascade,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  luc timestamptz not null default now(),
  primary key (chat_id, player_id)
);
alter table public.vkl_sm_chat_bao enable row level security;

-- làm sạch tin: ẩn link, số điện thoại, che từ tục (so từng từ, bỏ dấu câu, không phân biệt hoa thường)
create or replace function vkl_priv.sm_chat_sach(p text)
returns text language plpgsql immutable set search_path = '' as $$
declare
  bad text[] := array['đm','đcm','dcm','đmm','dmm','địt','đụ','đéo','lồn','buồi','cặc','đĩ','đỵt','đjt','djt','loz','lìn','vãilồn','cmm','clm','đkm','dkm','đmcs','óc chó','chó đẻ','mẹ mày','con đĩ','thằng chó'];
  t text := p;
  w text; core text; out text[] := '{}'; b text;
begin
  t := regexp_replace(t, '(https?://|www\.)\S+', '[link ẩn]', 'gi');
  t := regexp_replace(t, '\S+\.(com|net|org|vn|xyz|io|me|ly|gg|info|top|site|online|shop|click|link|tk|ml|app|co)(/\S*)?(\s|$)', '[link ẩn]\3', 'gi');
  t := regexp_replace(t, '(\+?84|0)[ .-]?[1-9]([ .-]?[0-9]){7,9}', '[số ẩn]', 'g');
  -- cụm hai chữ
  foreach b in array bad loop
    if position(' ' in b) > 0 then
      t := regexp_replace(t, b, repeat('*', char_length(b)), 'gi');
    end if;
  end loop;
  foreach w in array regexp_split_to_array(btrim(t), '\s+') loop
    core := lower(regexp_replace(w, '[[:punct:]]', '', 'g'));
    if core = any (bad) then out := out || repeat('*', char_length(w)); else out := out || w; end if;
  end loop;
  return array_to_string(out, ' ');
end;
$$;

create or replace function vkl_priv.sm_chat_row(c public.vkl_sm_chat, p_me uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', c.id, 'luc', c.luc, 'nd', c.noi_dung, 'ta', c.player_id = p_me,
    'tk', p.username, 'ten', coalesce(nullif(p.meta -> 'chanThan' ->> 'name', ''), p.username),
    'chuc', (select chuc from public.vkl_sm_member where player_id = c.player_id and mon_id = c.mon_id))
  from public.vkl_players p where p.id = c.player_id;
$$;

-- gửi tin
create or replace function public.vkl_sm_chat_send(p_token uuid, p_nd text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_mon bigint; v_nd text; r public.vkl_sm_chat;
begin
  select mon_id into v_mon from public.vkl_sm_member where player_id = v_me;
  if v_mon is null then raise exception 'SM_CHUA_CO_MON'; end if;
  v_nd := btrim(regexp_replace(coalesce(p_nd, ''), '\s+', ' ', 'g'));
  if v_nd = '' then raise exception 'SM_CHAT_TRONG'; end if;
  if char_length(v_nd) > 200 then raise exception 'SM_CHAT_DAI'; end if;
  if exists (select 1 from public.vkl_sm_chat where player_id = v_me and luc > now() - interval '3 seconds')
     or (select count(*) from public.vkl_sm_chat where player_id = v_me and luc > now() - interval '1 minute') >= 15 then
    raise exception 'SM_CHAT_NHANH';
  end if;
  v_nd := vkl_priv.sm_chat_sach(v_nd);
  insert into public.vkl_sm_chat (mon_id, player_id, noi_dung) values (v_mon, v_me, v_nd) returning * into r;
  return vkl_priv.sm_chat_row(r, v_me);
end;
$$;

-- đọc tin của môn mình: p_sau = 0 thì 50 tin mới nhất, > 0 thì các tin mới hơn id đó (tối đa 50)
create or replace function public.vkl_sm_chat_list(p_token uuid, p_sau bigint default 0)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_mon bigint;
begin
  select mon_id into v_mon from public.vkl_sm_member where player_id = v_me;
  if v_mon is null then raise exception 'SM_CHUA_CO_MON'; end if;
  return (select coalesce(jsonb_agg(vkl_priv.sm_chat_row(x, v_me) order by x.id), '[]') from (
    select * from public.vkl_sm_chat c where c.mon_id = v_mon and not c.an and c.id > coalesce(p_sau, 0)
    order by c.id desc limit 50) x);
end;
$$;

-- số tin mới của người khác sau id (chấm đỏ ở mục Truyền âm)
create or replace function public.vkl_sm_chat_n(p_token uuid, p_sau bigint default 0)
returns int language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_mon bigint;
begin
  select mon_id into v_mon from public.vkl_sm_member where player_id = v_me;
  if v_mon is null then return 0; end if;
  return (select count(*)::int from (select 1 from public.vkl_sm_chat where mon_id = v_mon and not an and player_id <> v_me and id > coalesce(p_sau, 0) limit 99) x);
end;
$$;

-- ẩn tin: người viết, môn chủ, trưởng lão của môn đó
create or replace function public.vkl_sm_chat_hide(p_token uuid, p_id bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); r public.vkl_sm_chat; m public.vkl_sm_member;
begin
  select * into r from public.vkl_sm_chat where id = p_id;
  if r.id is null then raise exception 'SM_CHAT_KHONG_CO'; end if;
  select * into m from public.vkl_sm_member where player_id = v_me;
  if r.player_id <> v_me and not (m.mon_id = r.mon_id and m.chuc in ('chu', 'lao')) then raise exception 'SM_QUYEN'; end if;
  update public.vkl_sm_chat set an = true, an_boi = v_me where id = p_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- báo tin xấu: người cùng môn, mỗi người một lần mỗi tin; 3 người báo thì tin tự ẩn; ghi vkl_sm_co cho Tyler xem
create or replace function public.vkl_sm_chat_report(p_token uuid, p_id bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); r public.vkl_sm_chat; v_n int;
begin
  select * into r from public.vkl_sm_chat where id = p_id;
  if r.id is null then raise exception 'SM_CHAT_KHONG_CO'; end if;
  if not exists (select 1 from public.vkl_sm_member where player_id = v_me and mon_id = r.mon_id) then raise exception 'SM_QUYEN'; end if;
  if r.player_id = v_me then raise exception 'SM_QUYEN'; end if;
  insert into public.vkl_sm_chat_bao (chat_id, player_id) values (p_id, v_me) on conflict do nothing;
  select count(*) into v_n from public.vkl_sm_chat_bao where chat_id = p_id;
  if v_n >= 3 then update public.vkl_sm_chat set an = true where id = p_id; end if;
  perform vkl_priv.sm_flag('chat_bao', jsonb_build_object('mon', r.mon_id, 'player', r.player_id, 'chat', p_id, 'nd', left(r.noi_dung, 200), 'so_bao', v_n));
  return jsonb_build_object('so_bao', v_n, 'an', v_n >= 3);
end;
$$;

-- quyền
do $$ declare f text; begin
  foreach f in array array['vkl_priv.sm_chat_sach(text)', 'vkl_priv.sm_chat_row(public.vkl_sm_chat, uuid)'] loop
    execute format('revoke all on function %s from public', f);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('revoke all on function %s from anon, authenticated', f); end if;
  end loop;
  foreach f in array array['public.vkl_sm_chat_send(uuid, text)', 'public.vkl_sm_chat_list(uuid, bigint)', 'public.vkl_sm_chat_n(uuid, bigint)',
                           'public.vkl_sm_chat_hide(uuid, bigint)', 'public.vkl_sm_chat_report(uuid, bigint)'] loop
    execute format('revoke all on function %s from public', f);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('grant execute on function %s to anon, authenticated', f); end if;
  end loop;
end $$;
