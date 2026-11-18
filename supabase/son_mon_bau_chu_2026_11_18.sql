-- 18/11 tối (Tyler, sau khi Chí Triệu Kiên than "vào phải tông môn mà tông chủ không online"):
-- môn chủ vắng mặt 48 giờ thì người trong môn được bầu môn chủ mới.
-- Luật:
--   * Vắng = 48 giờ không chơi kiếp (lưu), không điểm danh, không nhắn Truyền âm, không mở Sơn Môn.
--   * Khi đó ai trong môn cũng mở được một cuộc bầu, kéo dài 24 giờ. Mỗi người 1 phiếu, chọn bất kỳ ai trong môn
--     trừ môn chủ cũ (chọn mình cũng được), đổi phiếu được tới lúc xong.
--   * Xong sớm khi một người được quá nửa số người bầu được. Hết giờ thì người nhiều phiếu nhất lên (bằng phiếu thì
--     Lực chiến cao hơn). Không ai bỏ phiếu thì bầu hủy.
--   * Môn chủ quay lại trong lúc bầu thì bầu hủy. Môn chủ bị thay thì thành đệ tử (không vướng giới hạn trưởng lão).
-- Số giờ ở cấu hình gio.vang_gio, gio.bau_gio (đổi được mà không sửa hàm). Chạy lại nhiều lần không hỏng.

update public.vkl_sm_cfg set v = v || '{"vang_gio": 48, "bau_gio": 24}'::jsonb where k = 'gio';

alter table public.vkl_sm_member add column if not exists hoat_dong timestamptz;

create table if not exists public.vkl_sm_bau (
  id bigserial primary key,
  mon_id bigint not null references public.vkl_sm_mon (id) on delete cascade,
  chu_cu uuid references public.vkl_players (id) on delete set null,
  mo_boi uuid references public.vkl_players (id) on delete set null,
  mo_luc timestamptz not null default now(),
  het_luc timestamptz not null,
  xong_luc timestamptz,
  ket_qua text check (ket_qua in ('thang', 'huy_ve', 'huy_trong', 'huy_doi')),
  chu_moi uuid references public.vkl_players (id) on delete set null
);
create unique index if not exists vkl_sm_bau_mo on public.vkl_sm_bau (mon_id) where xong_luc is null;
alter table public.vkl_sm_bau enable row level security;

create table if not exists public.vkl_sm_bau_phieu (
  bau_id bigint not null references public.vkl_sm_bau (id) on delete cascade,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  chon uuid not null references public.vkl_players (id) on delete cascade,
  luc timestamptz not null default now(),
  primary key (bau_id, player_id)
);
alter table public.vkl_sm_bau_phieu enable row level security;

-- lần cuối một người có mặt: chơi kiếp (lưu), điểm danh, Truyền âm, mở Sơn Môn
create or replace function vkl_priv.sm_hd(p uuid)
returns timestamptz language sql stable security definer set search_path = '' as $$
  select greatest(
    (select hoat_dong from public.vkl_sm_member where player_id = p),
    (select updated_at from public.vkl_saves where player_id = p),
    (select max(luc) from public.vkl_sm_diem_danh where player_id = p),
    (select max(luc) from public.vkl_sm_chat where player_id = p));
$$;

-- chốt một cuộc bầu nếu đã đủ điều kiện (hết giờ, quá nửa, hay môn chủ đã quay lại). Trả true nếu đã xong.
create or replace function vkl_priv.sm_bau_ket(p_bau bigint)
returns boolean language plpgsql security definer set search_path = '' as $$
declare b public.vkl_sm_bau; v_mon public.vkl_sm_mon; v_n int; v_top uuid; v_phieu int;
begin
  select * into b from public.vkl_sm_bau where id = p_bau for update;
  if b.id is null or b.xong_luc is not null then return true; end if;
  select * into v_mon from public.vkl_sm_mon where id = b.mon_id for update;
  -- môn chủ đã đổi bằng đường khác (tự rời, giải tán)
  if v_mon.id is null or v_mon.mon_chu is distinct from b.chu_cu then
    update public.vkl_sm_bau set xong_luc = now(), ket_qua = 'huy_doi' where id = b.id;
    return true;
  end if;
  if coalesce(vkl_priv.sm_hd(b.chu_cu), '-infinity') >= b.mo_luc then
    update public.vkl_sm_bau set xong_luc = now(), ket_qua = 'huy_ve' where id = b.id;
    return true;
  end if;
  select count(*) into v_n from public.vkl_sm_member where mon_id = b.mon_id and player_id is distinct from b.chu_cu;
  select x.chon, x.n into v_top, v_phieu from (
    select ph.chon, count(*) n, coalesce(max(l.lc), 0) lc
      from public.vkl_sm_bau_phieu ph
      join public.vkl_sm_member a on a.player_id = ph.player_id and a.mon_id = b.mon_id
      join public.vkl_sm_member c on c.player_id = ph.chon and c.mon_id = b.mon_id
      left join public.vkl_sm_luc_chien l on l.player_id = ph.chon
     where ph.bau_id = b.id and ph.chon is distinct from b.chu_cu and ph.player_id is distinct from b.chu_cu
     group by ph.chon) x
   order by x.n desc, x.lc desc limit 1;
  if now() < b.het_luc and (v_top is null or v_phieu * 2 <= v_n) then return false; end if;
  if v_top is null then
    update public.vkl_sm_bau set xong_luc = now(), ket_qua = 'huy_trong' where id = b.id;
    return true;
  end if;
  update public.vkl_sm_member set chuc = 'de' where player_id = b.chu_cu and mon_id = b.mon_id;
  update public.vkl_sm_member set chuc = 'chu' where player_id = v_top;
  update public.vkl_sm_mon set mon_chu = v_top where id = b.mon_id;
  update public.vkl_sm_bau set xong_luc = now(), ket_qua = 'thang', chu_moi = v_top where id = b.id;
  return true;
end;
$$;

-- xem tình hình (và ghi "đang có mặt" cho người gọi): môn chủ vắng bao lâu, cuộc bầu đang mở, kết quả gần nhất
create or replace function public.vkl_sm_bau(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_mon public.vkl_sm_mon; b public.vkl_sm_bau;
  v_hd timestamptz; v_vang int := coalesce(vkl_priv.sm_cfg('gio', 'vang_gio'), 48)::int; v_g public.vkl_sm_bau;
begin
  update public.vkl_sm_member set hoat_dong = now() where player_id = v_me;
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select * into b from public.vkl_sm_bau where mon_id = m.mon_id and xong_luc is null;
  if b.id is not null then perform vkl_priv.sm_bau_ket(b.id); end if;
  select * into b from public.vkl_sm_bau where mon_id = m.mon_id and xong_luc is null;
  select * into m from public.vkl_sm_member where player_id = v_me;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id;
  v_hd := vkl_priv.sm_hd(v_mon.mon_chu);
  select * into v_g from public.vkl_sm_bau where mon_id = m.mon_id and xong_luc > now() - interval '3 days' order by xong_luc desc limit 1;
  return jsonb_build_object(
    'vang_gio', v_vang,
    'chu_hd', v_hd,
    'mo_duoc', b.id is null and m.chuc <> 'chu' and v_mon.mon_chu is not null
               and coalesce(v_hd, '-infinity') < now() - make_interval(hours => v_vang),
    'dang', case when b.id is not null then jsonb_build_object(
      'id', b.id, 'het_luc', b.het_luc,
      'mo_boi', (select coalesce(p.meta -> 'chanThan' ->> 'name', p.username) from public.vkl_players p where p.id = b.mo_boi),
      'n', (select count(*) from public.vkl_sm_member where mon_id = m.mon_id and player_id is distinct from b.chu_cu),
      'bau_duoc', v_me is distinct from b.chu_cu,
      'ta_chon', (select p.username from public.vkl_sm_bau_phieu ph join public.vkl_players p on p.id = ph.chon where ph.bau_id = b.id and ph.player_id = v_me),
      'phieu', (select coalesce(jsonb_agg(jsonb_build_object('tk', p.username, 'ten', coalesce(p.meta -> 'chanThan' ->> 'name', p.username), 'n', x.n) order by x.n desc), '[]')
                  from (select ph.chon, count(*) n from public.vkl_sm_bau_phieu ph
                          join public.vkl_sm_member a on a.player_id = ph.player_id and a.mon_id = m.mon_id
                          join public.vkl_sm_member c on c.player_id = ph.chon and c.mon_id = m.mon_id
                         where ph.bau_id = b.id group by ph.chon) x join public.vkl_players p on p.id = x.chon)) end,
    'gan_nhat', case when v_g.id is not null then jsonb_build_object('ket_qua', v_g.ket_qua, 'xong_luc', v_g.xong_luc,
      'chu_moi', (select coalesce(p.meta -> 'chanThan' ->> 'name', p.username) from public.vkl_players p where p.id = v_g.chu_moi)) end);
end;
$$;

create or replace function public.vkl_sm_bau_mo(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_mon public.vkl_sm_mon; b public.vkl_sm_bau; v_id bigint;
  v_vang int := coalesce(vkl_priv.sm_cfg('gio', 'vang_gio'), 48)::int; v_gio int := coalesce(vkl_priv.sm_cfg('gio', 'bau_gio'), 24)::int;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id for update;
  if m.chuc = 'chu' or v_mon.mon_chu is null then raise exception 'SM_QUYEN'; end if;
  select * into b from public.vkl_sm_bau where mon_id = m.mon_id and xong_luc is null;
  if b.id is not null and not vkl_priv.sm_bau_ket(b.id) then raise exception 'SM_BAU_DANG'; end if;
  if coalesce(vkl_priv.sm_hd(v_mon.mon_chu), '-infinity') >= now() - make_interval(hours => v_vang) then raise exception 'SM_CHU_CON'; end if;
  insert into public.vkl_sm_bau (mon_id, chu_cu, mo_boi, het_luc)
    values (m.mon_id, v_mon.mon_chu, v_me, now() + make_interval(hours => v_gio)) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function public.vkl_sm_bau_bo(p_token uuid, p_username text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; b public.vkl_sm_bau; v_ai uuid; v_xong boolean;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select * into b from public.vkl_sm_bau where mon_id = m.mon_id and xong_luc is null;
  if b.id is null or vkl_priv.sm_bau_ket(b.id) then raise exception 'SM_BAU_HET'; end if;
  if v_me = b.chu_cu then raise exception 'SM_QUYEN'; end if;
  select p.id into v_ai from public.vkl_players p join public.vkl_sm_member x on x.player_id = p.id
   where p.username = p_username and x.mon_id = m.mon_id;
  if v_ai is null or v_ai = b.chu_cu then raise exception 'SM_BAU_AI'; end if;
  insert into public.vkl_sm_bau_phieu (bau_id, player_id, chon) values (b.id, v_me, v_ai)
    on conflict (bau_id, player_id) do update set chon = excluded.chon, luc = now();
  v_xong := vkl_priv.sm_bau_ket(b.id);
  return jsonb_build_object('ok', true, 'xong', v_xong,
    'chu_moi', case when v_xong then (select p.username from public.vkl_sm_bau x join public.vkl_players p on p.id = x.chu_moi where x.id = b.id) end);
end;
$$;

-- quyền
do $$ declare f text; begin
  foreach f in array array['vkl_priv.sm_hd(uuid)', 'vkl_priv.sm_bau_ket(bigint)'] loop
    execute format('revoke all on function %s from public', f);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('revoke all on function %s from anon, authenticated', f); end if;
  end loop;
  foreach f in array array['public.vkl_sm_bau(uuid)', 'public.vkl_sm_bau_mo(uuid)', 'public.vkl_sm_bau_bo(uuid, text)'] loop
    execute format('revoke all on function %s from public', f);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('grant execute on function %s to anon, authenticated', f); end if;
  end loop;
end $$;
