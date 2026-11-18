-- 18/11 (Tyler): môn chủ / trưởng lão xếp người vào từng ô; đệ tử vẫn tự đi được. Sang ô khác mất thời gian đi đường
-- 20 phút mỗi ô (gio.di_phut, cùng tốc độ xuất chinh), tính từ ô đang đứng (chưa chọn thì là chính điện). Trong lúc đi,
-- người đó không giữ ô nào. Mục đích: chiếm thêm ô thì lực phải chia ra, không còn nhảy ngay sang ô bị đánh.
--   cột MỚI vkl_sm_member.di_toi: lúc tới ô đang đi tới (dung_q, dung_r là ô đích).
--   hàm MỚI vkl_priv.sm_di (dùng chung), vkl_sm_xep (môn chủ, trưởng lão xếp người).
--   vkl_sm_guard: viết lại để đi qua sm_di. sm_giu: thêm một điều kiện (đang đi thì không tính).
--   vkl_sm_state, vkl_sm_members: trả thêm di_toi. vkl_sm_mon_ds: trả thêm dung, di_toi khi cùng môn.
-- Áp lại nhiều lần không hỏng.

alter table public.vkl_sm_member add column if not exists di_toi timestamptz;

-- cho người p sang giữ ô (q, r) của môn mình; trả lúc tới (null nếu đã ở đó)
create or replace function vkl_priv.sm_di(p uuid, p_q int, p_r int)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare m public.vkl_sm_member; v_cd record; v_q int; v_r int; v_d int; v_toi timestamptz;
begin
  select * into m from public.vkl_sm_member where player_id = p for update;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  if m.nghi_toi > now() then raise exception 'SM_NGHI'; end if;
  if not exists (select 1 from public.vkl_sm_tile where mon_id = m.mon_id and q = p_q and r = p_r) then raise exception 'SM_O_KHONG_CUA_TA'; end if;
  if exists (select 1 from public.vkl_sm_chinh_theo t join public.vkl_sm_chinh c on c.id = t.chinh_id
             where t.player_id = p and c.trang_thai = 'di') then raise exception 'SM_DANG_DI'; end if;
  select q, r into v_cd from public.vkl_sm_tile where mon_id = m.mon_id and chinh_dien limit 1;
  v_q := coalesce(m.dung_q, v_cd.q); v_r := coalesce(m.dung_r, v_cd.r);
  -- đang ở (hoặc đang đi tới) đúng ô đó: không làm gì
  if v_q = p_q and v_r = p_r then return case when m.di_toi > now() then m.di_toi end; end if;
  -- ô đang đứng không còn của môn (mất ô): coi như đi từ chính điện
  if not exists (select 1 from public.vkl_sm_tile where mon_id = m.mon_id and q = v_q and r = v_r) then
    v_q := v_cd.q; v_r := v_cd.r;
  end if;
  v_d := greatest(1, coalesce(vkl_priv.sm_dist(v_q, v_r, p_q, p_r), 1));
  v_toi := now() + make_interval(mins => v_d * coalesce(vkl_priv.sm_cfg('gio', 'di_phut'), 20)::int);
  delete from public.vkl_sm_chinh_theo t using public.vkl_sm_chinh c
   where t.chinh_id = c.id and t.player_id = p and c.trang_thai = 'tap_hop';
  update public.vkl_sm_member set dung_q = p_q, dung_r = p_r, di_toi = v_toi where player_id = p;
  return v_toi;
end;
$$;

-- tự sang giữ ô (viết lại để có thời gian đi đường)
create or replace function public.vkl_sm_guard(p_token uuid, p_q integer, p_r integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_toi timestamptz;
begin
  v_toi := vkl_priv.sm_di(v_me, p_q, p_r);
  return jsonb_build_object('ok', true, 'di_toi', v_toi);
end;
$$;

-- môn chủ xếp được mọi người; trưởng lão xếp được đệ tử và chính mình
create or replace function public.vkl_sm_xep(p_token uuid, p_username text, p_q int, p_r int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; x public.vkl_sm_member; v_toi timestamptz;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  select mb.* into x from public.vkl_sm_member mb join public.vkl_players p on p.id = mb.player_id where p.username = p_username;
  if m.mon_id is null or x.mon_id is distinct from m.mon_id then raise exception 'SM_QUYEN'; end if;
  if not (m.chuc = 'chu' or (m.chuc = 'lao' and (x.chuc = 'de' or x.player_id = v_me))) then raise exception 'SM_QUYEN'; end if;
  v_toi := vkl_priv.sm_di(x.player_id, p_q, p_r);
  return jsonb_build_object('ok', true, 'di_toi', v_toi);
end;
$$;
revoke all on function vkl_priv.sm_di(uuid, int, int) from public;
revoke all on function public.vkl_sm_xep(uuid, text, int, int) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant execute on function public.vkl_sm_xep(uuid, text, int, int) to anon, authenticated';
  end if;
end $$;

do $$
declare d text;
begin
  -- lực giữ một ô: người đang đi đường không tính
  d := pg_get_functiondef('vkl_priv.sm_giu'::regproc);
  if position('di_toi' in d) = 0 then
    d := replace(d, 'and (m.nghi_toi is null or m.nghi_toi <= now())', 'and (m.nghi_toi is null or m.nghi_toi <= now())
    and (m.di_toi is null or m.di_toi <= now())');
    if position('di_toi' in d) = 0 then raise exception 'sm_giu: không tìm thấy dòng nghi_toi'; end if;
    execute d;
  end if;
  -- ra khỏi môn: xóa cả lúc tới
  d := pg_get_functiondef('vkl_priv.sm_out'::regproc);
  if position('di_toi' in d) = 0 then
    d := replace(d, 'dung_q = null, dung_r = null, vao_luc = null,', 'dung_q = null, dung_r = null, vao_luc = null, di_toi = null,');
    if position('di_toi' in d) = 0 then raise exception 'sm_out: không tìm thấy dòng dung_q'; end if;
    execute d;
  end if;
  d := pg_get_functiondef('public.vkl_sm_state(uuid)'::regprocedure);
  if position('di_toi' in d) = 0 then
    d := replace(d, $r$'chuc', m.chuc, 'dung', case when m.dung_q is not null then jsonb_build_array(m.dung_q, m.dung_r) end,$r$,
      $r$'chuc', m.chuc, 'dung', case when m.dung_q is not null then jsonb_build_array(m.dung_q, m.dung_r) end, 'di_toi', case when m.di_toi > now() then m.di_toi end,$r$);
    if position('di_toi' in d) = 0 then raise exception 'state: không tìm thấy dòng dung'; end if;
    execute d;
  end if;
  d := pg_get_functiondef('public.vkl_sm_members(uuid)'::regprocedure);
  if position('di_toi' in d) = 0 then
    d := replace(d, $r$'chuc', x.chuc, 'lc', coalesce(l.lc, 0), 'dung', case when x.dung_q is not null then jsonb_build_array(x.dung_q, x.dung_r) end,$r$,
      $r$'chuc', x.chuc, 'lc', coalesce(l.lc, 0), 'dung', case when x.dung_q is not null then jsonb_build_array(x.dung_q, x.dung_r) end, 'di_toi', case when x.di_toi > now() then x.di_toi end,$r$);
    if position('di_toi' in d) = 0 then raise exception 'members: không tìm thấy dòng dung'; end if;
    execute d;
  end if;
end $$;
