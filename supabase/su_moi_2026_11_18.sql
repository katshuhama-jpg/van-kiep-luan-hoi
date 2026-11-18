-- 18/11 sáng (Tyler yêu cầu): Sư Đồ hai chiều bằng lời mời / lời xin, có tìm theo tên.
--   Sư phụ (từ 20 kiếp, có chân thân) tìm người còn bái sư được (tài khoản dưới 8 ngày, tối đa 5 kiếp, chưa có sư phụ,
--   có chơi trong 3 ngày) rồi bấm Mời. Người kia Nhận hoặc Từ chối.
--   Người mới tìm sư phụ theo tên trong toàn bộ danh sách (trước chỉ 8 người), bấm Xin bái sư. Sư phụ Nhận hoặc Từ chối.
--   Link mời ?su= vẫn bái ngay như cũ (sư phụ tự gửi link là đã đồng ý).
-- Luật bái sư giữ nguyên như vkl_su_bind. Mỗi người gửi tối đa 10 lời mời/xin mỗi ngày; lời chờ quá 3 ngày tự hết hạn.
-- Chỉ thêm bảng, hàm MỚI. Không sửa bảng, hàm cũ. Áp lại nhiều lần không hỏng.

create table if not exists public.vkl_su_moi (
  id bigint generated always as identity primary key,
  loai text not null check (loai in ('moi', 'xin')),   -- moi: sư phụ mời đệ tử; xin: đệ tử xin bái sư
  tu uuid not null references public.vkl_players (id) on delete cascade,   -- người gửi
  toi uuid not null references public.vkl_players (id) on delete cascade,  -- người nhận
  luc timestamptz not null default now(),
  trang_thai text not null default 'cho' check (trang_thai in ('cho', 'nhan', 'tu_choi', 'huy')),
  xong_luc timestamptz
);
create unique index if not exists vkl_su_moi_cho on public.vkl_su_moi (tu, toi) where trang_thai = 'cho';
create index if not exists vkl_su_moi_toi on public.vkl_su_moi (toi, trang_thai);
create index if not exists vkl_su_moi_tu_luc on public.vkl_su_moi (tu, luc);
alter table public.vkl_su_moi enable row level security;
-- không có policy: chỉ đọc ghi qua hàm

-- người này còn bái sư được không (cùng luật vkl_su_bind)
create or replace function vkl_priv.su_de_duoc(p uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.vkl_su where de_tu = p)
     and exists (select 1 from public.vkl_players where id = p and created_at >= now() - interval '8 days')
     and (select count(*) from (select 1 from public.vkl_lives where player_id = p limit 6) x) <= 5;
$$;

-- người này làm sư phụ được không (cùng điều kiện danh sách Tìm sư phụ, trừ lần chơi gần đây)
create or replace function vkl_priv.su_su_duoc(p uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.vkl_players x where x.id = p
    and jsonb_typeof(x.meta -> 'chanThan') = 'object'
    and (case when jsonb_typeof(x.meta -> 'lives') = 'number' then (x.meta ->> 'lives')::numeric else 0 end) >= 20);
$$;

-- bái sư (không cần token của đệ tử): trả mã như vkl_su_bind
create or replace function vkl_priv.su_bai(p_de uuid, p_su uuid)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if p_de = p_su then return 'SU_SELF'; end if;
  if exists (select 1 from public.vkl_su where de_tu = p_de) then return 'SU_DONE'; end if;
  if not vkl_priv.su_de_duoc(p_de) then return 'SU_OLD'; end if;
  if exists (select 1 from public.vkl_su where de_tu = p_su and su_phu = p_de) then return 'SU_SELF'; end if;
  insert into public.vkl_su (de_tu, su_phu, sid) values (p_de, p_su, null) on conflict (de_tu) do nothing;
  if not found then return 'SU_DONE'; end if;
  -- đã có sư phụ: mọi lời mời/xin đang chờ của người này hết hiệu lực
  update public.vkl_su_moi set trang_thai = 'huy', xong_luc = now()
   where trang_thai = 'cho' and ((loai = 'moi' and toi = p_de) or (loai = 'xin' and tu = p_de));
  return 'OK';
end;
$$;

-- Sư phụ tìm đệ tử: người còn bái sư được, có chơi (hoặc mới tạo tài khoản) trong 3 ngày. Tìm theo tên đăng nhập hoặc pháp danh.
-- Tối đa 30 người, vừa chơi gần đây lên trước. can: người gọi làm sư phụ được không.
create or replace function public.vkl_su_tim_de(p_token uuid, p_q text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := public.vkl_player(p_token); v_q text := lower(trim(coalesce(p_q, '')));
begin
  if v_me is null then return null; end if;
  if length(v_q) > 30 then v_q := left(v_q, 30); end if;
  return jsonb_build_object('can', vkl_priv.su_su_duoc(v_me), 'ds', coalesce((
    select jsonb_agg(jsonb_build_object('ten', u.username, 'phap_danh', u.pd, 'kiep', u.kiep, 'choi_luc', u.choi_luc, 'da_moi', u.da_moi)
           order by u.choi_luc desc)
    from (select * from (
      select p.username, p.meta -> 'chanThan' ->> 'name' pd,
             (select count(*) from public.vkl_lives l where l.player_id = p.id)::int kiep,
             coalesce((select max(l.created_at) from public.vkl_lives l where l.player_id = p.id), p.created_at) choi_luc,
             exists (select 1 from public.vkl_su_moi m where m.tu = v_me and m.toi = p.id and m.trang_thai = 'cho' and m.luc > now() - interval '3 days') da_moi
        from public.vkl_players p
       where p.created_at >= now() - interval '8 days'
         and p.id <> v_me
         and vkl_priv.su_de_duoc(p.id)
         and not exists (select 1 from public.vkl_su s where s.de_tu = v_me and s.su_phu = p.id)
         and (v_q = '' or position(v_q in lower(p.username)) > 0 or position(v_q in lower(coalesce(p.meta -> 'chanThan' ->> 'name', ''))) > 0)
    ) u0
    where u0.choi_luc > now() - interval '3 days'
    order by u0.choi_luc desc
    limit 30) u), '[]'::jsonb));
end;
$$;

-- Người mới tìm sư phụ theo tên trong toàn bộ danh sách (cùng điều kiện vkl_su_tim, tối đa 30). can: người gọi còn bái sư được.
create or replace function public.vkl_su_tim_su(p_token uuid, p_q text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := public.vkl_player(p_token); v_q text := lower(trim(coalesce(p_q, '')));
begin
  if length(v_q) > 30 then v_q := left(v_q, 30); end if;
  return jsonb_build_object('can', v_me is not null and vkl_priv.su_de_duoc(v_me), 'ds', coalesce((
    select jsonb_agg(jsonb_build_object('ten', u.username, 'phap_danh', u.meta -> 'chanThan' ->> 'name',
             'huyet', case when jsonb_typeof(u.meta -> 'huyet') = 'array' then jsonb_array_length(u.meta -> 'huyet') else 0 end,
             'kiep', (u.meta ->> 'lives')::numeric::int, 'tai', u.tai, 'choi_luc', u.choi_luc, 'da_xin', u.da_xin)
           order by u.tai desc, u.choi_luc desc)
    from (select * from (
      select p.id, p.username, p.meta, g.choi_luc,
             (select count(*) from public.vkl_su s where s.su_phu = p.id and s.thanh_tai_luc is not null) tai,
             (select count(*) from public.vkl_su s where s.su_phu = p.id and s.thanh_tai_luc is null and now() <= s.bai_luc + interval '7 days') dang,
             v_me is not null and exists (select 1 from public.vkl_su_moi m where m.tu = v_me and m.toi = p.id and m.trang_thai = 'cho' and m.luc > now() - interval '3 days') da_xin
        from (select l.player_id, max(l.created_at) choi_luc from public.vkl_lives l
               where l.created_at > now() - interval '3 days' and l.player_id is not null group by l.player_id) g
        join public.vkl_players p on p.id = g.player_id
       where p.id <> coalesce(v_me, '00000000-0000-0000-0000-000000000000'::uuid)
         and vkl_priv.su_su_duoc(p.id)
         and not exists (select 1 from public.vkl_su_an a where a.player_id = p.id)
         and not exists (select 1 from public.vkl_su s where s.de_tu = p.id and s.su_phu = v_me)
         and (v_q = '' or position(v_q in lower(p.username)) > 0 or position(v_q in lower(coalesce(p.meta -> 'chanThan' ->> 'name', ''))) > 0)
    ) u0
    where u0.dang < 10
    order by u0.tai desc, u0.choi_luc desc
    limit 30) u), '[]'::jsonb));
end;
$$;

-- Gửi lời mời (p_loai 'moi', người gọi là sư phụ) hoặc lời xin (p_loai 'xin', người gọi là đệ tử). Trả mã: OK, SU_AUTH, SU_NONE,
-- SU_SELF, SU_DONE (đã có sư phụ), SU_OLD (không còn bái sư được), SU_SU (người làm sư phụ chưa đủ 20 kiếp và chân thân),
-- SU_DA_GUI (đã gửi, đang chờ), SU_NHIEU (quá 10 lời mỗi ngày).
create or replace function public.vkl_su_gui(p_token uuid, p_ten text, p_loai text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_me uuid := public.vkl_player(p_token); v_ho uuid; v_de uuid; v_su uuid;
begin
  if v_me is null then return 'SU_AUTH'; end if;
  if p_loai not in ('moi', 'xin') then return 'SU_NONE'; end if;
  select id into v_ho from public.vkl_players where username = lower(trim(coalesce(p_ten, '')));
  if v_ho is null then return 'SU_NONE'; end if;
  if v_ho = v_me then return 'SU_SELF'; end if;
  if p_loai = 'moi' then v_su := v_me; v_de := v_ho; else v_su := v_ho; v_de := v_me; end if;
  if exists (select 1 from public.vkl_su where de_tu = v_de) then return 'SU_DONE'; end if;
  if not vkl_priv.su_de_duoc(v_de) then return 'SU_OLD'; end if;
  if not vkl_priv.su_su_duoc(v_su) then return 'SU_SU'; end if;
  if exists (select 1 from public.vkl_su where de_tu = v_su and su_phu = v_de) then return 'SU_SELF'; end if;
  perform pg_advisory_xact_lock(hashtext('vkl_su_gui'), hashtext(v_me::text));
  if (select count(*) from public.vkl_su_moi where tu = v_me and luc > now() - interval '1 day') >= 10 then return 'SU_NHIEU'; end if;
  -- lời cũ quá 3 ngày coi như hết hạn
  update public.vkl_su_moi set trang_thai = 'huy', xong_luc = now()
   where tu = v_me and toi = v_ho and trang_thai = 'cho' and luc <= now() - interval '3 days';
  -- người kia đã gửi chiều ngược lại cho mình: nhận luôn
  if exists (select 1 from public.vkl_su_moi where tu = v_ho and toi = v_me and trang_thai = 'cho' and luc > now() - interval '3 days'
              and loai = case when p_loai = 'moi' then 'xin' else 'moi' end) then
    update public.vkl_su_moi set trang_thai = 'nhan', xong_luc = now() where tu = v_ho and toi = v_me and trang_thai = 'cho';
    return vkl_priv.su_bai(v_de, v_su);
  end if;
  insert into public.vkl_su_moi (loai, tu, toi) values (p_loai, v_me, v_ho) on conflict do nothing;
  if not found then return 'SU_DA_GUI'; end if;
  return 'OK';
end;
$$;

-- Hộp thư Sư Đồ: lời mời/xin đang chờ gửi tới ta (den) và ta đã gửi (di). Chỉ lời chưa quá 3 ngày.
create or replace function public.vkl_su_hop(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := public.vkl_player(p_token);
begin
  if v_me is null then return null; end if;
  return jsonb_build_object(
    'den', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'loai', m.loai, 'ten', p.username, 'phap_danh', p.meta -> 'chanThan' ->> 'name',
              'kiep', case when m.loai = 'moi' then (case when jsonb_typeof(p.meta -> 'lives') = 'number' then (p.meta ->> 'lives')::numeric::int else 0 end)
                           else (select count(*) from public.vkl_lives l where l.player_id = p.id)::int end,
              'luc', m.luc) order by m.luc desc)
       from public.vkl_su_moi m join public.vkl_players p on p.id = m.tu
      where m.toi = v_me and m.trang_thai = 'cho' and m.luc > now() - interval '3 days'), '[]'::jsonb),
    'di', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'loai', m.loai, 'ten', p.username, 'phap_danh', p.meta -> 'chanThan' ->> 'name', 'luc', m.luc) order by m.luc desc)
       from public.vkl_su_moi m join public.vkl_players p on p.id = m.toi
      where m.tu = v_me and m.trang_thai = 'cho' and m.luc > now() - interval '3 days'), '[]'::jsonb));
end;
$$;

-- Trả lời một lời mời/xin gửi tới ta: p_nhan true thì bái sư (mã như vkl_su_bind), false thì từ chối (OK).
-- Người gửi cũng gọi được với p_nhan false để rút lại lời của mình.
create or replace function public.vkl_su_tra(p_token uuid, p_id bigint, p_nhan boolean)
returns text language plpgsql security definer set search_path = '' as $$
declare v_me uuid := public.vkl_player(p_token); m public.vkl_su_moi; v_r text;
begin
  if v_me is null then return 'SU_AUTH'; end if;
  select * into m from public.vkl_su_moi where id = p_id for update;
  if m.id is null or m.trang_thai <> 'cho' or m.luc <= now() - interval '3 days' then return 'SU_HET'; end if;
  if not p_nhan then
    if v_me not in (m.tu, m.toi) then return 'SU_NONE'; end if;
    update public.vkl_su_moi set trang_thai = case when v_me = m.toi then 'tu_choi' else 'huy' end, xong_luc = now() where id = m.id;
    return 'OK';
  end if;
  if v_me <> m.toi then return 'SU_NONE'; end if;
  if m.loai = 'moi' then v_r := vkl_priv.su_bai(m.toi, m.tu); else v_r := vkl_priv.su_bai(m.tu, m.toi); end if;
  if v_r = 'OK' then
    update public.vkl_su_moi set trang_thai = 'nhan', xong_luc = now() where id = m.id;
  elsif v_r in ('SU_DONE', 'SU_OLD', 'SU_SELF') then
    update public.vkl_su_moi set trang_thai = 'huy', xong_luc = now() where id = m.id;
  end if;
  return v_r;
end;
$$;

revoke all on function vkl_priv.su_de_duoc(uuid), vkl_priv.su_su_duoc(uuid), vkl_priv.su_bai(uuid, uuid) from public;
revoke all on function public.vkl_su_tim_de(uuid, text), public.vkl_su_tim_su(uuid, text), public.vkl_su_gui(uuid, text, text),
  public.vkl_su_hop(uuid), public.vkl_su_tra(uuid, bigint, boolean) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant execute on function public.vkl_su_tim_de(uuid, text), public.vkl_su_tim_su(uuid, text), public.vkl_su_gui(uuid, text, text),
      public.vkl_su_hop(uuid), public.vkl_su_tra(uuid, bigint, boolean) to anon, authenticated';
  end if;
end $$;
