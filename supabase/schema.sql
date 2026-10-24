-- Vạn Kiếp Luân Hồi - cấu trúc dữ liệu
-- Tài khoản riêng của game: tên đăng nhập + mật khẩu 3-6 ký tự (mã hóa bcrypt).
-- Trình duyệt không đọc/ghi bảng trực tiếp, mọi thao tác đi qua các hàm vkl_* bên dưới.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.vkl_players (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[a-z0-9_]{3,16}$'),
  pass_hash text not null,
  meta jsonb not null default '{}'::jsonb,
  failed int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.vkl_sessions (
  token uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '90 days'
);
create index if not exists vkl_sessions_player_idx on public.vkl_sessions (player_id);

create table if not exists public.vkl_saves (
  player_id uuid primary key references public.vkl_players (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.vkl_lives (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  player_name text not null,
  char_name text not null,
  life_no int not null default 1,
  age int not null,
  realm text not null,
  path text,
  dao_tam int not null default 0,
  cause text,
  epitaph text check (char_length(epitaph) <= 120),
  ascended boolean not null default false,
  incense int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists vkl_lives_created_at_idx on public.vkl_lives (created_at desc);
create index if not exists vkl_lives_player_idx on public.vkl_lives (player_id);

alter table public.vkl_players enable row level security;
alter table public.vkl_sessions enable row level security;
alter table public.vkl_saves enable row level security;
alter table public.vkl_lives enable row level security;

-- Nghĩa trang: ai cũng xem được
create policy "Ai cũng xem được nghĩa trang" on public.vkl_lives for select to anon, authenticated using (true);

-- ---------- Hàm nội bộ: đổi token thành người chơi ----------
create or replace function public.vkl_player(p_token uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.player_id from public.vkl_sessions s where s.token = p_token and s.expires_at > now();
$$;

-- ---------- Đăng ký ----------
create or replace function public.vkl_register(p_username text, p_password text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user text := lower(trim(p_username));
  v_id uuid;
  v_token uuid;
begin
  if v_user !~ '^[a-z0-9_]{3,16}$' then
    raise exception 'USERNAME_INVALID';
  end if;
  if char_length(p_password) < 3 or char_length(p_password) > 6 then
    raise exception 'PASSWORD_INVALID';
  end if;
  if exists (select 1 from public.vkl_players where username = v_user) then
    raise exception 'USERNAME_TAKEN';
  end if;
  insert into public.vkl_players (username, pass_hash)
  values (v_user, extensions.crypt(p_password, extensions.gen_salt('bf')))
  returning id into v_id;
  insert into public.vkl_sessions (player_id) values (v_id) returning token into v_token;
  return json_build_object('token', v_token, 'username', v_user, 'meta', '{}'::json);
end;
$$;

-- ---------- Đăng nhập (khóa 5 phút sau 8 lần sai) ----------
create or replace function public.vkl_login(p_username text, p_password text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user text := lower(trim(p_username));
  p public.vkl_players;
  v_token uuid;
begin
  select * into p from public.vkl_players where username = v_user;
  if not found then
    raise exception 'LOGIN_FAILED';
  end if;
  if p.locked_until is not null and p.locked_until > now() then
    raise exception 'LOCKED';
  end if;
  if p.pass_hash <> extensions.crypt(p_password, p.pass_hash) then
    update public.vkl_players
      set failed = failed + 1,
          locked_until = case when failed + 1 >= 8 then now() + interval '5 minutes' else null end
      where id = p.id;
    raise exception 'LOGIN_FAILED';
  end if;
  update public.vkl_players set failed = 0, locked_until = null where id = p.id;
  insert into public.vkl_sessions (player_id) values (p.id) returning token into v_token;
  return json_build_object('token', v_token, 'username', p.username, 'meta', p.meta);
end;
$$;

create or replace function public.vkl_logout(p_token uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.vkl_sessions set expires_at = now() where token = p_token;
$$;

-- ---------- Hồ sơ + bản lưu ----------
create or replace function public.vkl_me(p_token uuid)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_id uuid := public.vkl_player(p_token);
begin
  if v_id is null then
    return null;
  end if;
  return (
    select json_build_object('username', p.username, 'meta', p.meta, 'state', s.state)
    from public.vkl_players p left join public.vkl_saves s on s.player_id = p.id
    where p.id = v_id
  );
end;
$$;

create or replace function public.vkl_save_meta(p_token uuid, p_meta jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := public.vkl_player(p_token);
begin
  if v_id is null then raise exception 'NOT_LOGGED_IN'; end if;
  update public.vkl_players set meta = p_meta where id = v_id;
end;
$$;

create or replace function public.vkl_save_game(p_token uuid, p_state jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := public.vkl_player(p_token);
begin
  if v_id is null then raise exception 'NOT_LOGGED_IN'; end if;
  insert into public.vkl_saves (player_id, state, updated_at) values (v_id, coalesce(p_state, 'null'::jsonb), now())
  on conflict (player_id) do update set state = excluded.state, updated_at = now();
end;
$$;

-- ---------- Nghĩa trang ----------
create or replace function public.vkl_add_life(p_token uuid, p_life jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := public.vkl_player(p_token);
  v_name text;
begin
  if v_id is null then raise exception 'NOT_LOGGED_IN'; end if;
  select username into v_name from public.vkl_players where id = v_id;
  insert into public.vkl_lives (player_id, player_name, char_name, life_no, age, realm, path, dao_tam, cause, epitaph, ascended)
  values (
    v_id, v_name,
    left(p_life->>'char_name', 40),
    coalesce((p_life->>'life_no')::int, 1),
    coalesce((p_life->>'age')::int, 0),
    left(p_life->>'realm', 40),
    left(p_life->>'path', 20),
    coalesce((p_life->>'dao_tam')::int, 0),
    left(p_life->>'cause', 160),
    left(p_life->>'epitaph', 120),
    coalesce((p_life->>'ascended')::boolean, false)
  );
end;
$$;

create or replace function public.vkl_my_lives(p_token uuid)
returns setof public.vkl_lives
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.vkl_lives where player_id = public.vkl_player(p_token) order by created_at desc limit 100;
$$;

create or replace function public.vkl_thap_huong(p_token uuid, p_life_id bigint)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_n int;
begin
  if public.vkl_player(p_token) is null then raise exception 'NOT_LOGGED_IN'; end if;
  update public.vkl_lives set incense = incense + 1 where id = p_life_id returning incense into v_n;
  return v_n;
end;
$$;

grant execute on function public.vkl_register(text, text) to anon, authenticated;
grant execute on function public.vkl_login(text, text) to anon, authenticated;
grant execute on function public.vkl_logout(uuid) to anon, authenticated;
grant execute on function public.vkl_me(uuid) to anon, authenticated;
grant execute on function public.vkl_save_meta(uuid, jsonb) to anon, authenticated;
grant execute on function public.vkl_save_game(uuid, jsonb) to anon, authenticated;
grant execute on function public.vkl_add_life(uuid, jsonb) to anon, authenticated;
grant execute on function public.vkl_my_lives(uuid) to anon, authenticated;
grant execute on function public.vkl_thap_huong(uuid, bigint) to anon, authenticated;
