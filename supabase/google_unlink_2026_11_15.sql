-- Gỡ liên kết Google (góp ý người chơi 15/11). Hàm mới, không sửa hàm cũ.
-- Để không ai bị khóa ngoài tài khoản: phải xác thực lại đúng Google đang gắn (auth.uid() = google_sub)
-- và đặt mật khẩu mới ngay lúc gỡ (tài khoản tạo bằng Google vốn có mật khẩu ngẫu nhiên không ai biết).

create or replace function public.vkl_google_unlink(p_token uuid, p_new text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub text := auth.uid()::text;
  v_id uuid := public.vkl_player(p_token);
  v_cur text;
begin
  if v_sub is null then
    raise exception 'GOOGLE_REQUIRED';
  end if;
  if v_id is null then
    raise exception 'SESSION';
  end if;
  if char_length(coalesce(p_new, '')) < 3 or char_length(p_new) > 6 then
    raise exception 'PASSWORD_INVALID';
  end if;
  select google_sub into v_cur from public.vkl_players where id = v_id;
  if v_cur is null then
    raise exception 'NOT_LINKED';
  end if;
  if v_cur <> v_sub then
    raise exception 'GOOGLE_MISMATCH';
  end if;
  update public.vkl_players
    set google_sub = null, google_email = null,
        pass_hash = extensions.crypt(p_new, extensions.gen_salt('bf')),
        must_change = false, failed = 0, locked_until = null
    where id = v_id;
  return json_build_object('ok', true);
end;
$$;

revoke all on function public.vkl_google_unlink(uuid, text) from public, anon;
grant execute on function public.vkl_google_unlink(uuid, text) to authenticated;
