-- 21/11 18:21 (Tyler: "Làm luôn cả 3 rồi push"). Môn chủ "online cho có": chơi kiếp riêng là đồng hồ vắng 48 giờ quay về 0,
-- dù không làm gì cho môn. Số 48 giờ qua: 5/10 môn đông người có môn chủ không phát lệnh nào, 4 môn không có trưởng lão.
-- 1. Vắng việc môn: đồng hồ 48 giờ chỉ tính việc môn chủ làm cho môn (phát lệnh xuất chinh/khai hoang, xếp người, bổ nhiệm,
--    duyệt đơn, đuổi, đổi điều kiện vào môn). Chơi kiếp, điểm danh, chat không tính. Tyler 18:23: áp từ lúc lập môn, không cho
--    thời gian làm quen: mốc gốc là lúc lập môn (hay lúc được bầu lên). Việc cũ chỉ có lệnh xuất chinh/khai hoang là có ghi lại
--    (bổ nhiệm, xếp người trước 21/11 không có sổ). Còn 12 giờ thì báo trong chat môn và trên thẻ của môn chủ.
-- 2. Tự cử trưởng lão: môn từ 6 người mà 24 giờ liền không có trưởng lão thì Thiên Đạo cử 2 người đóng góp nhiều nhất
--    (đã ở môn từ 24 giờ, có chơi trong 72 giờ). Môn chủ đổi lại được.
-- 3. Đơn bất tín nhiệm: người ở môn từ 24 giờ ký; đủ max(3, quá nửa người đang chơi 72 giờ) chữ ký trong 24 giờ thì mở bầu
--    24 giờ, môn chủ hiện tại cũng là ứng viên (được nhiều phiếu nhất thì giữ ghế). Mỗi môn tối đa 1 cuộc bầu mỗi 72 giờ;
--    môn chủ mới lên được miễn 24 giờ.
-- Không sửa hàm cũ: hàm mới *2 + RPC bọc. Bầu mới ghi mo_luc = 'infinity' để hàm cũ sm_bau_ket (client cũ còn mở) không hủy
-- nhầm vì môn chủ chơi kiếp; giờ mở thật ở cột bat_dau.

update public.vkl_sm_cfg set v = v || '{"canh_gio": 12, "btn_gio": 24, "btn_cach_gio": 72, "lao_tu_gio": 24}'::jsonb
 where k = 'gio' and not (v ? 'canh_gio');

create table if not exists public.vkl_sm_viec (
  id bigserial primary key,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  mon_id bigint references public.vkl_sm_mon (id) on delete cascade,
  loai text not null,
  luc timestamptz not null default now()
);
create index if not exists vkl_sm_viec_p on public.vkl_sm_viec (player_id, luc desc);
alter table public.vkl_sm_viec enable row level security;

alter table public.vkl_sm_bau add column if not exists loai text not null default 'vang';
alter table public.vkl_sm_bau add column if not exists bat_dau timestamptz;
alter table public.vkl_sm_bau drop constraint if exists vkl_sm_bau_ket_qua_check;
alter table public.vkl_sm_bau add constraint vkl_sm_bau_ket_qua_check check (ket_qua in ('thang', 'huy_ve', 'huy_trong', 'huy_doi', 'giu'));

alter table public.vkl_sm_mon add column if not exists khong_lao_tu timestamptz;
alter table public.vkl_sm_mon add column if not exists canh_chu_luc timestamptz;

create table if not exists public.vkl_sm_btn (
  mon_id bigint not null references public.vkl_sm_mon (id) on delete cascade,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  luc timestamptz not null default now(),
  primary key (mon_id, player_id)
);
alter table public.vkl_sm_btn enable row level security;

-- lần cuối người này làm việc môn
create or replace function vkl_priv.sm_hd2(p uuid)
returns timestamptz language sql stable security definer set search_path = '' as $$
  select greatest(
    (select max(luc) from public.vkl_sm_viec where player_id = p),
    (select max(c.tap_hop_toi) - make_interval(mins => coalesce(vkl_priv.sm_cfg('gio', 'tap_hop_phut'), 30)::int)
       from public.vkl_sm_chinh c where c.nguoi_phat = p),
    (select max(m.lap_luc) from public.vkl_sm_mon m where m.mon_chu = p),
    (select max(b.xong_luc) from public.vkl_sm_bau b where b.chu_moi = p and b.ket_qua in ('thang', 'giu')));
$$;

create or replace function vkl_priv.sm_ghi_viec(p uuid, p_loai text)
returns void language sql security definer set search_path = '' as $$
  insert into public.vkl_sm_viec (player_id, mon_id, loai)
  select p, m.mon_id, p_loai from public.vkl_sm_member m where m.player_id = p and m.chuc in ('chu', 'lao');
$$;

-- RPC bọc: gọi hàm cũ, xong thì ghi việc môn
create or replace function public.vkl_sm_role2(p_token uuid, p_username text, p_chuc text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r jsonb; begin
  r := public.vkl_sm_role(p_token, p_username, p_chuc);
  perform vkl_priv.sm_ghi_viec(vkl_priv.sm_me(p_token), 'role');
  return r;
end; $$;
create or replace function public.vkl_sm_xep2(p_token uuid, p_username text, p_q integer, p_r integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r jsonb; begin
  r := public.vkl_sm_xep(p_token, p_username, p_q, p_r);
  if p_username is distinct from (select username from public.vkl_players where id = vkl_priv.sm_me(p_token)) then
    perform vkl_priv.sm_ghi_viec(vkl_priv.sm_me(p_token), 'xep');
  end if;
  return r;
end; $$;
create or replace function public.vkl_sm_accept2(p_token uuid, p_don bigint, p_nhan boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r jsonb; begin
  r := public.vkl_sm_accept(p_token, p_don, p_nhan);
  perform vkl_priv.sm_ghi_viec(vkl_priv.sm_me(p_token), 'duyet');
  return r;
end; $$;
create or replace function public.vkl_sm_kick2(p_token uuid, p_username text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r jsonb; begin
  r := public.vkl_sm_kick(p_token, p_username);
  perform vkl_priv.sm_ghi_viec(vkl_priv.sm_me(p_token), 'duoi');
  return r;
end; $$;
create or replace function public.vkl_sm_set_dk2(p_token uuid, p_dk_kiep integer, p_dk_tuoi_dao integer, p_mo_cua boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r jsonb; begin
  r := public.vkl_sm_set_dk(p_token, p_dk_kiep, p_dk_tuoi_dao, p_mo_cua);
  perform vkl_priv.sm_ghi_viec(vkl_priv.sm_me(p_token), 'dk');
  return r;
end; $$;

-- chốt bầu (bản 2): bầu "vang" hủy khi môn chủ làm việc môn sau lúc mở; bầu "btn" không hủy, môn chủ là ứng viên
create or replace function vkl_priv.sm_bau_ket2(p_bau bigint)
returns boolean language plpgsql security definer set search_path = '' as $$
declare b public.vkl_sm_bau; v_mon public.vkl_sm_mon; v_n int; v_top uuid; v_phieu int; v_bd timestamptz;
begin
  select * into b from public.vkl_sm_bau where id = p_bau for update;
  if b.id is null or b.xong_luc is not null then return true; end if;
  select * into v_mon from public.vkl_sm_mon where id = b.mon_id for update;
  if v_mon.id is null or v_mon.mon_chu is distinct from b.chu_cu then
    update public.vkl_sm_bau set xong_luc = now(), ket_qua = 'huy_doi' where id = b.id;
    return true;
  end if;
  v_bd := coalesce(b.bat_dau, b.mo_luc);
  if b.loai <> 'btn' and coalesce(vkl_priv.sm_hd2(b.chu_cu), '-infinity') >= v_bd then
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
     where ph.bau_id = b.id and ph.player_id is distinct from b.chu_cu
       and (b.loai = 'btn' or ph.chon is distinct from b.chu_cu)
     group by ph.chon) x
   order by x.n desc, (x.chon = b.chu_cu) desc, x.lc desc limit 1;
  if now() < b.het_luc and (v_top is null or v_phieu * 2 <= v_n) then return false; end if;
  if v_top is null then
    update public.vkl_sm_bau set xong_luc = now(), ket_qua = case when b.loai = 'btn' then 'giu' else 'huy_trong' end where id = b.id;
    return true;
  end if;
  if v_top = b.chu_cu then
    update public.vkl_sm_bau set xong_luc = now(), ket_qua = 'giu', chu_moi = b.chu_cu where id = b.id;
    return true;
  end if;
  update public.vkl_sm_member set chuc = 'de' where player_id = b.chu_cu and mon_id = b.mon_id;
  update public.vkl_sm_member set chuc = 'chu' where player_id = v_top;
  update public.vkl_sm_mon set mon_chu = v_top where id = b.mon_id;
  update public.vkl_sm_bau set xong_luc = now(), ket_qua = 'thang', chu_moi = v_top where id = b.id;
  insert into public.vkl_sm_viec (player_id, mon_id, loai) values (v_top, b.mon_id, 'len_chu');
  return true;
end;
$$;

-- điều kiện đơn bất tín nhiệm của một môn: số chữ ký hợp lệ, số cần, và lý do chưa ký được (nếu có)
create or replace function vkl_priv.sm_btn_tt(p_mon bigint, p_me uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_mon public.vkl_sm_mon; m public.vkl_sm_member; v_n int; v_hd int; v_can int; v_ly text;
  v_gio int := coalesce(vkl_priv.sm_cfg('gio', 'btn_gio'), 24)::int; v_cach int := coalesce(vkl_priv.sm_cfg('gio', 'btn_cach_gio'), 72)::int;
begin
  select * into v_mon from public.vkl_sm_mon where id = p_mon;
  select * into m from public.vkl_sm_member where player_id = p_me;
  select count(*) into v_n from public.vkl_sm_btn b join public.vkl_sm_member x on x.player_id = b.player_id and x.mon_id = p_mon
   where b.mon_id = p_mon and b.luc > now() - make_interval(hours => v_gio) and x.chuc <> 'chu';
  select count(*) into v_hd from public.vkl_sm_member x
   where x.mon_id = p_mon and x.chuc <> 'chu' and coalesce(vkl_priv.sm_hd(x.player_id), '-infinity') > now() - interval '72 hours';
  v_can := greatest(3, v_hd / 2 + 1);
  v_ly := case
    when v_mon.mon_chu is null then 'khong_chu'
    when m.chuc = 'chu' then 'la_chu'
    when m.vao_luc > now() - interval '24 hours' then 'moi_vao'
    when exists (select 1 from public.vkl_sm_bau where mon_id = p_mon and xong_luc is null) then 'dang_bau'
    when exists (select 1 from public.vkl_sm_bau where mon_id = p_mon and coalesce(bat_dau, mo_luc) > now() - make_interval(hours => v_cach)
                   and coalesce(bat_dau, mo_luc) <> 'infinity') then 'vua_bau'
    when exists (select 1 from public.vkl_sm_bau where mon_id = p_mon and ket_qua = 'thang' and chu_moi = v_mon.mon_chu and xong_luc > now() - interval '24 hours') then 'chu_moi'
    end;
  return jsonb_build_object('n', v_n, 'can', v_can, 'ly_do', v_ly,
    'ta_ky', exists (select 1 from public.vkl_sm_btn where mon_id = p_mon and player_id = p_me and luc > now() - make_interval(hours => v_gio)));
end;
$$;

create or replace function public.vkl_sm_bau2(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_mon public.vkl_sm_mon; b public.vkl_sm_bau;
  v_hd timestamptz; v_viec timestamptz; v_vang int := coalesce(vkl_priv.sm_cfg('gio', 'vang_gio'), 48)::int;
  v_canh int := coalesce(vkl_priv.sm_cfg('gio', 'canh_gio'), 12)::int; v_g public.vkl_sm_bau; v_con numeric;
begin
  update public.vkl_sm_member set hoat_dong = now() where player_id = v_me;
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select * into b from public.vkl_sm_bau where mon_id = m.mon_id and xong_luc is null;
  if b.id is not null then perform vkl_priv.sm_bau_ket2(b.id); end if;
  select * into b from public.vkl_sm_bau where mon_id = m.mon_id and xong_luc is null;
  select * into m from public.vkl_sm_member where player_id = v_me;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id;
  v_hd := vkl_priv.sm_hd(v_mon.mon_chu);
  v_viec := vkl_priv.sm_hd2(v_mon.mon_chu);
  v_con := extract(epoch from (v_viec + make_interval(hours => v_vang) - now())) / 3600;
  select * into v_g from public.vkl_sm_bau where mon_id = m.mon_id and xong_luc > now() - interval '3 days' order by xong_luc desc limit 1;
  return jsonb_build_object(
    'vang_gio', v_vang,
    'chu_hd', v_hd,
    'chu_viec', v_viec,
    'canh_con', case when m.chuc = 'chu' and b.id is null and v_con <= v_canh then greatest(0, round(v_con)) end,
    'mo_duoc', b.id is null and m.chuc <> 'chu' and v_mon.mon_chu is not null and v_con <= 0,
    'btn', case when b.id is null and v_mon.mon_chu is not null and v_con > 0 then vkl_priv.sm_btn_tt(m.mon_id, v_me) end,
    'dang', case when b.id is not null then jsonb_build_object(
      'id', b.id, 'het_luc', b.het_luc, 'loai', b.loai,
      'chu', (select p.username from public.vkl_players p where p.id = b.chu_cu),
      'mo_boi', (select coalesce(p.meta -> 'chanThan' ->> 'name', p.username) from public.vkl_players p where p.id = b.mo_boi),
      'n', (select count(*) from public.vkl_sm_member where mon_id = m.mon_id and player_id is distinct from b.chu_cu),
      'bau_duoc', v_me is distinct from b.chu_cu,
      'ta_chon', (select p.username from public.vkl_sm_bau_phieu ph join public.vkl_players p on p.id = ph.chon where ph.bau_id = b.id and ph.player_id = v_me),
      'phieu', (select coalesce(jsonb_agg(jsonb_build_object('tk', p.username, 'ten', coalesce(p.meta -> 'chanThan' ->> 'name', p.username), 'n', x.n) order by x.n desc), '[]')
                  from (select ph.chon, count(*) n from public.vkl_sm_bau_phieu ph
                          join public.vkl_sm_member a on a.player_id = ph.player_id and a.mon_id = m.mon_id
                          join public.vkl_sm_member c on c.player_id = ph.chon and c.mon_id = m.mon_id
                         where ph.bau_id = b.id and ph.player_id is distinct from b.chu_cu group by ph.chon) x join public.vkl_players p on p.id = x.chon)) end,
    'gan_nhat', case when v_g.id is not null then jsonb_build_object('ket_qua', v_g.ket_qua, 'xong_luc', v_g.xong_luc, 'loai', v_g.loai,
      'chu_moi', (select coalesce(p.meta -> 'chanThan' ->> 'name', p.username) from public.vkl_players p where p.id = v_g.chu_moi)) end);
end;
$$;

create or replace function public.vkl_sm_bau_mo2(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_mon public.vkl_sm_mon; b public.vkl_sm_bau; v_id bigint;
  v_vang int := coalesce(vkl_priv.sm_cfg('gio', 'vang_gio'), 48)::int; v_gio int := coalesce(vkl_priv.sm_cfg('gio', 'bau_gio'), 24)::int;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id for update;
  if m.chuc = 'chu' or v_mon.mon_chu is null then raise exception 'SM_QUYEN'; end if;
  select * into b from public.vkl_sm_bau where mon_id = m.mon_id and xong_luc is null;
  if b.id is not null and not vkl_priv.sm_bau_ket2(b.id) then raise exception 'SM_BAU_DANG'; end if;
  if coalesce(vkl_priv.sm_hd2(v_mon.mon_chu), '-infinity') >= now() - make_interval(hours => v_vang) then raise exception 'SM_CHU_CON'; end if;
  insert into public.vkl_sm_bau (mon_id, chu_cu, mo_boi, mo_luc, bat_dau, het_luc, loai)
    values (m.mon_id, v_mon.mon_chu, v_me, 'infinity', now(), now() + make_interval(hours => v_gio), 'vang') returning id into v_id;
  insert into public.vkl_sm_chat_he (mon_id, noi_dung, noi_dung_en) values (m.mon_id,
    'Môn chủ đã hơn ' || v_vang || ' giờ không làm việc môn. Cuộc bầu môn chủ mới đã mở, bầu trong ' || v_gio || ' giờ ở mục Đồng môn.',
    'The leader has done no sect work for over ' || v_vang || ' hours. A leader vote is open for ' || v_gio || ' hours under Members.');
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function public.vkl_sm_bau_bo2(p_token uuid, p_username text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; b public.vkl_sm_bau; v_ai uuid; v_xong boolean;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select * into b from public.vkl_sm_bau where mon_id = m.mon_id and xong_luc is null;
  if b.id is null or vkl_priv.sm_bau_ket2(b.id) then raise exception 'SM_BAU_HET'; end if;
  if v_me = b.chu_cu then raise exception 'SM_QUYEN'; end if;
  select p.id into v_ai from public.vkl_players p join public.vkl_sm_member x on x.player_id = p.id
   where p.username = p_username and x.mon_id = m.mon_id;
  if v_ai is null or (v_ai = b.chu_cu and b.loai <> 'btn') then raise exception 'SM_BAU_AI'; end if;
  insert into public.vkl_sm_bau_phieu (bau_id, player_id, chon) values (b.id, v_me, v_ai)
    on conflict (bau_id, player_id) do update set chon = excluded.chon, luc = now();
  v_xong := vkl_priv.sm_bau_ket2(b.id);
  return jsonb_build_object('ok', true, 'xong', v_xong,
    'chu_moi', case when v_xong then (select p.username from public.vkl_sm_bau x join public.vkl_players p on p.id = x.chu_moi where x.id = b.id) end);
end;
$$;

-- ký / rút đơn bất tín nhiệm; đủ chữ ký thì mở bầu ngay
create or replace function public.vkl_sm_btn_ky(p_token uuid, p_ky boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_mon public.vkl_sm_mon; t jsonb; v_id bigint;
  v_gio int := coalesce(vkl_priv.sm_cfg('gio', 'bau_gio'), 24)::int;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id for update;
  if not p_ky then
    delete from public.vkl_sm_btn where mon_id = m.mon_id and player_id = v_me;
    return jsonb_build_object('ok', true) || vkl_priv.sm_btn_tt(m.mon_id, v_me);
  end if;
  t := vkl_priv.sm_btn_tt(m.mon_id, v_me);
  if t ->> 'ly_do' is not null then raise exception 'SM_BTN_%', upper(t ->> 'ly_do'); end if;
  insert into public.vkl_sm_btn (mon_id, player_id, luc) values (m.mon_id, v_me, now())
    on conflict (mon_id, player_id) do update set luc = now();
  t := vkl_priv.sm_btn_tt(m.mon_id, v_me);
  if (t ->> 'n')::int >= (t ->> 'can')::int then
    insert into public.vkl_sm_bau (mon_id, chu_cu, mo_boi, mo_luc, bat_dau, het_luc, loai)
      values (m.mon_id, v_mon.mon_chu, v_me, 'infinity', now(), now() + make_interval(hours => v_gio), 'btn') returning id into v_id;
    delete from public.vkl_sm_btn where mon_id = m.mon_id;
    insert into public.vkl_sm_chat_he (mon_id, noi_dung, noi_dung_en) values (m.mon_id,
      'Đơn bất tín nhiệm đủ ' || (t ->> 'n') || ' chữ ký. Cả môn bầu trong ' || v_gio || ' giờ ở mục Đồng môn: giữ môn chủ hiện tại hay chọn người khác.',
      'The no-confidence petition reached ' || (t ->> 'n') || ' signatures. Vote within ' || v_gio || ' hours under Members: keep the leader or pick someone else.');
    return jsonb_build_object('ok', true, 'mo_bau', true, 'id', v_id);
  end if;
  return jsonb_build_object('ok', true) || t;
end;
$$;

-- mỗi giờ: báo môn chủ còn 12 giờ; cử trưởng lão cho môn trống trưởng lão 24 giờ
create or replace function vkl_priv.sm_mon_chu_tick()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare x record; v_vang int := coalesce(vkl_priv.sm_cfg('gio', 'vang_gio'), 48)::int; v_canh int := coalesce(vkl_priv.sm_cfg('gio', 'canh_gio'), 12)::int;
  v_tu int := coalesce(vkl_priv.sm_cfg('gio', 'lao_tu_gio'), 24)::int; v_ky int; v_ten text[]; v_nc int := 0; v_nl int := 0; v_viec timestamptz;
begin
  select id into v_ky from public.vkl_sm_ky where bat_dau <= now() order by id desc limit 1;
  for x in select m.* from public.vkl_sm_mon m where m.giai_tan_luc is null and m.mon_chu is not null loop
    -- 1. báo trước 12 giờ (một lần mỗi đợt vắng)
    v_viec := vkl_priv.sm_hd2(x.mon_chu);
    if (select count(*) from public.vkl_sm_member where mon_id = x.id) >= 2
       and v_viec + make_interval(hours => v_vang - v_canh) <= now() and v_viec + make_interval(hours => v_vang) > now()
       and (x.canh_chu_luc is null or x.canh_chu_luc < v_viec)
       and not exists (select 1 from public.vkl_sm_bau where mon_id = x.id and xong_luc is null) then
      insert into public.vkl_sm_chat_he (mon_id, noi_dung, noi_dung_en) values (x.id,
        'Môn chủ đã ' || (v_vang - v_canh) || ' giờ chưa làm việc môn (phát lệnh, xếp người giữ ô, bổ nhiệm, duyệt người vào). Còn ' || v_canh ||
        ' giờ nữa, nếu vẫn vậy thì ai trong môn cũng mở được cuộc bầu môn chủ mới.',
        'The leader has done no sect work for ' || (v_vang - v_canh) || ' hours (orders, guard assignments, appointments, approvals). In ' || v_canh ||
        ' more hours anyone may start a leader vote.');
      update public.vkl_sm_mon set canh_chu_luc = now() where id = x.id;
      v_nc := v_nc + 1;
    end if;
    -- 2. trưởng lão
    if exists (select 1 from public.vkl_sm_member where mon_id = x.id and chuc = 'lao')
       or (select count(*) from public.vkl_sm_member where mon_id = x.id) < 6 then
      if x.khong_lao_tu is not null then update public.vkl_sm_mon set khong_lao_tu = null where id = x.id; end if;
    elsif x.khong_lao_tu is null then
      update public.vkl_sm_mon set khong_lao_tu = now() where id = x.id;
    elsif x.khong_lao_tu <= now() - make_interval(hours => v_tu) then
      with c as (
        select mb.player_id, coalesce(cd.cong, 0) cong
          from public.vkl_sm_member mb left join vkl_priv.sm_cong_ds(v_ky) cd on cd.player_id = mb.player_id
         where mb.mon_id = x.id and mb.chuc = 'de' and mb.vao_luc <= now() - interval '24 hours'
           and coalesce(vkl_priv.sm_hd(mb.player_id), '-infinity') > now() - interval '72 hours'
         order by coalesce(cd.cong, 0) desc, mb.vao_luc limit least(2, coalesce(vkl_priv.sm_cfg('mon', 'lao'), 3)::int)),
      u as (update public.vkl_sm_member mb set chuc = 'lao' from c where mb.player_id = c.player_id returning mb.player_id)
      select array_agg(coalesce(p.meta -> 'chanThan' ->> 'name', p.username)) into v_ten from u join public.vkl_players p on p.id = u.player_id;
      update public.vkl_sm_mon set khong_lao_tu = null where id = x.id;
      if v_ten is not null then
        insert into public.vkl_sm_chat_he (mon_id, noi_dung, noi_dung_en) values (x.id,
          'Môn đã ' || v_tu || ' giờ không có trưởng lão nên Thiên Đạo cử ' || array_to_string(v_ten, ', ') ||
          ' (đóng góp nhiều nhất) làm trưởng lão: xếp người giữ ô, phát lệnh, duyệt người vào. Môn chủ đổi lại được ở mục Đồng môn.',
          'The sect had no elder for ' || v_tu || ' hours, so the Heavens appointed ' || array_to_string(v_ten, ', ') ||
          ' (top contributors) as elders. The leader can change this under Members.');
        v_nl := v_nl + 1;
      end if;
    end if;
  end loop;
  return jsonb_build_object('canh', v_nc, 'lao', v_nl);
end;
$$;

do $$ declare f text; begin
  foreach f in array array['vkl_priv.sm_hd2(uuid)', 'vkl_priv.sm_ghi_viec(uuid, text)', 'vkl_priv.sm_bau_ket2(bigint)', 'vkl_priv.sm_btn_tt(bigint, uuid)', 'vkl_priv.sm_mon_chu_tick()'] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;
  foreach f in array array['public.vkl_sm_role2(uuid, text, text)', 'public.vkl_sm_xep2(uuid, text, integer, integer)', 'public.vkl_sm_accept2(uuid, bigint, boolean)',
                            'public.vkl_sm_kick2(uuid, text)', 'public.vkl_sm_set_dk2(uuid, integer, integer, boolean)', 'public.vkl_sm_bau2(uuid)',
                            'public.vkl_sm_bau_mo2(uuid)', 'public.vkl_sm_bau_bo2(uuid, text)', 'public.vkl_sm_btn_ky(uuid, boolean)'] loop
    execute format('revoke all on function %s from public', f);
    execute format('grant execute on function %s to anon, authenticated', f);
  end loop;
end $$;

-- Tyler 18:23: tính từ lúc lập môn: môn đang không có trưởng lão thì đếm từ lúc lập môn, đủ 24 giờ là lần chạy đầu cử luôn.
update public.vkl_sm_mon m set khong_lao_tu = m.lap_luc
 where m.giai_tan_luc is null and m.mon_chu is not null and m.khong_lao_tu is null
   and not exists (select 1 from public.vkl_sm_member b where b.mon_id = m.id and b.chuc = 'lao')
   and (select count(*) from public.vkl_sm_member b where b.mon_id = m.id) >= 6;

select cron.schedule('vkl_sm_mon_chu_tick', '7 * * * *', 'select vkl_priv.sm_mon_chu_tick()');
