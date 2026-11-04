-- Đăng nhập bằng Google (Tyler chốt 4/11). Không sửa hàm cũ: thêm cột và các hàm vkl_google_* mới.
-- Trình duyệt đổi ID token của Google lấy phiên Supabase Auth (signInWithIdToken), rồi gọi các hàm dưới với phiên đó:
-- auth.uid() là danh tính Google đã được Supabase kiểm chứng. Game vẫn dùng token phiên riêng (vkl_sessions) như cũ.

alter table public.vkl_players add column if not exists google_sub text;
alter table public.vkl_players add column if not exists google_email text;
alter table public.vkl_players add column if not exists google_linked_at timestamptz;
create unique index if not exists vkl_players_google_sub_idx on public.vkl_players (google_sub) where google_sub is not null;

-- Đăng nhập: đã liên kết thì cấp phiên game; chưa thì báo cần tạo tài khoản
create or replace function public.vkl_google_login()
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub text := auth.uid()::text;
  v_email text := auth.jwt() ->> 'email';
  p public.vkl_players;
  v_token uuid;
begin
  if v_sub is null then
    raise exception 'GOOGLE_REQUIRED';
  end if;
  select * into p from public.vkl_players where google_sub = v_sub;
  if not found then
    return json_build_object('need', 'new', 'email', v_email);
  end if;
  update public.vkl_players set failed = 0, locked_until = null, google_email = coalesce(v_email, google_email) where id = p.id;
  insert into public.vkl_sessions (player_id) values (p.id) returning token into v_token;
  return json_build_object('token', v_token, 'username', p.username, 'meta', p.meta);
end;
$$;

-- Tài khoản mới bằng Google: chỉ cần chọn tên, mật khẩu ngẫu nhiên không ai biết (đăng nhập bằng Google)
create or replace function public.vkl_google_register(p_username text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub text := auth.uid()::text;
  v_email text := auth.jwt() ->> 'email';
  v_user text := lower(trim(p_username));
  v_id uuid;
  v_token uuid;
begin
  if v_sub is null then
    raise exception 'GOOGLE_REQUIRED';
  end if;
  if exists (select 1 from public.vkl_players where google_sub = v_sub) then
    raise exception 'GOOGLE_USED';
  end if;
  if v_user !~ '^[a-z0-9_]{3,16}$' then
    raise exception 'USERNAME_INVALID';
  end if;
  if exists (select 1 from public.vkl_players where username = v_user) then
    raise exception 'USERNAME_TAKEN';
  end if;
  insert into public.vkl_players (username, pass_hash, google_sub, google_email, google_linked_at)
  values (v_user, extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')), v_sub, v_email, now())
  returning id into v_id;
  insert into public.vkl_sessions (player_id) values (v_id) returning token into v_token;
  return json_build_object('token', v_token, 'username', v_user, 'meta', '{}'::json);
end;
$$;

-- Tài khoản cũ đang đăng nhập (token phiên game) gắn với Google đang xác thực
create or replace function public.vkl_google_link(p_token uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub text := auth.uid()::text;
  v_email text := auth.jwt() ->> 'email';
  v_id uuid := public.vkl_player(p_token);
  v_cur text;
begin
  if v_sub is null then
    raise exception 'GOOGLE_REQUIRED';
  end if;
  if v_id is null then
    raise exception 'SESSION';
  end if;
  if exists (select 1 from public.vkl_players where google_sub = v_sub and id <> v_id) then
    raise exception 'GOOGLE_USED';
  end if;
  select google_sub into v_cur from public.vkl_players where id = v_id;
  if v_cur is not null and v_cur <> v_sub then
    raise exception 'ALREADY_LINKED';
  end if;
  update public.vkl_players set google_sub = v_sub, google_email = v_email, google_linked_at = coalesce(google_linked_at, now()) where id = v_id;
  return json_build_object('linked', true, 'email', v_email);
end;
$$;

-- Tài khoản đang đăng nhập đã liên kết Google chưa (để hiện pop up bắt buộc)
create or replace function public.vkl_google_status(p_token uuid)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object('linked', p.google_sub is not null, 'email', p.google_email)
  from public.vkl_players p where p.id = public.vkl_player(p_token);
$$;

grant execute on function public.vkl_google_login() to authenticated;
grant execute on function public.vkl_google_register(text) to authenticated;
grant execute on function public.vkl_google_link(uuid) to authenticated;
grant execute on function public.vkl_google_status(uuid) to anon, authenticated;
