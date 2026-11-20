-- 20/11 tối (Tyler giao, góp ý #302 linhly): Ngày 38 - Kênh chat Thế giới. Lên bản 21/11.
-- Làm lại từ Truyền âm (son_mon_chat_2026_11_18.sql): dùng chung hàm làm sạch vkl_priv.sm_chat_sach (gọi lại, không sửa).
-- Chỉ bảng và hàm MỚI. Bảng bật RLS, không policy: trình duyệt chỉ đi qua hàm SECURITY DEFINER.
--   Đọc: ai đăng nhập cũng đọc được. Gửi: có chân thân (meta.chanThan) VÀ đã liên kết Google (vkl_players.google_sub).
--   Chống phá: tối đa 512 ký tự; 1 tin mỗi 10 giây, 20 tin mỗi 5 phút; tin trùng y hệt tin trước của mình trong 2 phút thì chặn;
--   3 người báo thì tin tự ẩn; bị ẩn từ 3 tin trong 24 giờ thì tự cấm chat 24 giờ (vkl_wc_cam).
--   Tin hệ thống (loai 'he'): phi thăng lần đầu, lên Khai Thiên lần đầu, kết cục chưa ai từng mở, môn chiếm Linh Mạch / Thiên Trì.
--   Trigger MỚI chỉ ghi vào hàng chờ vkl_wc_cho, hàm vkl_priv.wc_he_xa đăng tối đa 1 tin mỗi 3 phút (gom các việc dồn lại).
--   Trigger nuốt mọi lỗi: không bao giờ làm hỏng lưu game, ghi bia mộ hay trận Sơn Môn.
-- Dọn: pg_cron 'vkl_wc_don' xóa tin quá 7 ngày lúc 3:30 giờ VN (20:30 UTC). Áp lại cả file nhiều lần không hỏng.

-- ============ Bảng ============
create table if not exists public.vkl_wc_chat (
  id bigserial primary key,
  player_id uuid references public.vkl_players (id) on delete cascade, -- null với tin hệ thống
  noi_dung text not null check (char_length(noi_dung) between 1 and 512),
  noi_dung_en text,                                                    -- bản tiếng Anh của tin hệ thống
  luc timestamptz not null default now(),
  an boolean not null default false,
  loai text not null default 'nguoi' check (loai in ('nguoi', 'he')),
  ai jsonb                                                             -- ảnh chụp lúc gửi: tên chân thân, cảnh giới cao nhất, con đường, môn
);
create index if not exists vkl_wc_chat_nguoi on public.vkl_wc_chat (player_id, luc desc) where player_id is not null;
create index if not exists vkl_wc_chat_luc on public.vkl_wc_chat (luc);
create index if not exists vkl_wc_chat_he on public.vkl_wc_chat (luc desc) where loai = 'he';
alter table public.vkl_wc_chat enable row level security;

create table if not exists public.vkl_wc_bao (
  chat_id bigint not null references public.vkl_wc_chat (id) on delete cascade,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  luc timestamptz not null default now(),
  primary key (chat_id, player_id)
);
create index if not exists vkl_wc_bao_nguoi on public.vkl_wc_bao (player_id);
alter table public.vkl_wc_bao enable row level security;

create table if not exists public.vkl_wc_cam (
  player_id uuid primary key references public.vkl_players (id) on delete cascade,
  toi timestamptz not null,
  ly_do text,
  luc timestamptz not null default now()
);
alter table public.vkl_wc_cam enable row level security;

-- hàng chờ tin hệ thống (loai: phi, kt, ket, mon)
create table if not exists public.vkl_wc_cho (
  id bigserial primary key,
  loai text not null,
  ten text not null,
  x text,
  luc timestamptz not null default now()
);
alter table public.vkl_wc_cho enable row level security;

-- mốc đã báo của mỗi người (phi thăng lần đầu, Khai Thiên lần đầu): chỉ báo một lần
create table if not exists public.vkl_wc_moc (
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  loai text not null,
  luc timestamptz not null default now(),
  primary key (player_id, loai)
);
alter table public.vkl_wc_moc enable row level security;

-- kết cục có trong game (danh sách trắng, lấy từ lib/game/endings.ts) và lần đầu có người mở trên máy chủ.
-- Mã lạ do client gửi không có ở đây thì bỏ qua. Thêm kết cục mới vào game thì nhớ thêm dòng vào bảng này.
create table if not exists public.vkl_wc_ket (
  id text primary key,
  lan_dau timestamptz
);
alter table public.vkl_wc_ket enable row level security;

insert into public.vkl_wc_ket (id)
select unnest(array['hg_khai_thien','hg_thien_dao','hg_pham_nhan','hg_hanh_gia','hg_vo_danh','hg_thien_thi','hg_ac_thi','hg_tram_minh','hg_nghe_giang','hg_va_troi','hg_phong_than','hg_phan_sat','hg_giao_diet','thoat_van_kiep','go_chuong','dap_chuong','cau_hon','nghich_thien','van_kiep_bat_diet','chung_dao','van_kiep_ho_dao','dao_khon','ha_pham','thu_mon','hoa_chu','thien_de','hoa_huyet_hai','buong_dao','tam_phuc','vo_danh','ve_tuoi_tho','hoang_luong','dai_la','ma_de','hon_nguyen','giang_tran','ket_guong','xuyen_khong','toa_hoa','truyen_cong','tu_tran','thien_nhan_ngu_suy','loi_phat','tram_tien_dai','ma_the_muc_ruong','tam_ma_doat_xa','bi_thon_phe','hoa_tinh','lac_khe_nut','tieu_dao','tien_vo','ma_ton_do_kiep','phi_thang','ma_phat','xa_loi_den','huyet_lien','song_tam','ma_ton','pha_gioi','ma_hiep','thanh_phat','cuoi_rong','he_thong','kiem_than','dan_thanh','yeu_vuong','pham_nhan','tam_nien','dai_thien','dai_phu','tru_yeu_vuong','phan_do','lan_kha','co_doc','qua_do','be_quan','tinh_cu_doi_mang','vi_tinh_bo_tong','tho_yeu','thi_luyen','dao_giang_ho','khinh_dich','tu_dia','thien_kiep','tau_hoa','chet_doi','chet_yeu','xa_than','trung_doc','loan_dao','hiem_dia','moi_yeu_thu','anh_tai','tho_tan','tt3_du_am','tt3_dong_xanh','tt3_lang_duoi_nui','tt3_tre_quy_cua','tt3_tieng_dau','tt3_than_khong_mong','bat_dac'])
on conflict (id) do nothing;
-- kết cục đã có người mở (mọi tài khoản, kể cả thử) thì không còn là "lần đầu"
update public.vkl_wc_ket k set lan_dau = x.t
  from (select look ->> 'ending' e, min(created_at) t from public.vkl_lives where look ? 'ending' group by 1) x
 where x.e = k.id and k.lan_dau is null;

-- người đã phi thăng / lên Khai Thiên từ trước: không báo lại
insert into public.vkl_wc_moc (player_id, loai)
select distinct player_id, 'phi' from public.vkl_lives where ascended and player_id is not null
union select player_id, 'phi' from public.vkl_saves where state -> 'char' ->> 'ascended' = 'true'
union select distinct player_id, 'kt' from public.vkl_lives where realm_no >= 15 and player_id is not null
union select player_id, 'kt' from public.vkl_saves where state -> 'char' ->> 'realm' = '15'
on conflict do nothing;

-- ============ Hàm nội bộ ============
-- làm sạch từng dòng bằng hàm của Truyền âm (hàm cũ gộp mọi khoảng trắng thành một dấu cách nên phải tách dòng trước)
create or replace function vkl_priv.wc_sach(p text)
returns text language sql immutable set search_path = '' as $$
  select left(string_agg(vkl_priv.sm_chat_sach(l), E'\n' order by n), 512)
    from unnest(string_to_array(p, E'\n')) with ordinality as t(l, n);
$$;

-- tên hiện ra của một người: tên chân thân, chưa có thì tên nhân vật đang chơi
create or replace function vkl_priv.wc_ten(p_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(p.meta -> 'chanThan' ->> 'name', ''), nullif(s.state -> 'char' ->> 'name', ''), 'Một đạo hữu')
    from public.vkl_players p left join public.vkl_saves s on s.player_id = p.id where p.id = p_id;
$$;

-- tài khoản thử bị loại khỏi tin hệ thống
create or replace function vkl_priv.wc_thu(p_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select username ~ '^(test|ui)_' from public.vkl_players where id = p_id), true);
$$;

-- ảnh chụp người gửi: tên chân thân, cảnh giới cao nhất từng đạt (số + cõi), con đường của kiếp gần nhất, tên môn
create or replace function vkl_priv.wc_ai(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_ten text; v_rn int; v_co text; v_s jsonb; v_p text; v_mon text; v_srn int;
begin
  select nullif(meta -> 'chanThan' ->> 'name', '') into v_ten from public.vkl_players where id = p_id;
  select realm_no, look ->> 'cosmos' into v_rn, v_co from public.vkl_lives where player_id = p_id order by realm_no desc nulls last limit 1;
  select state -> 'char' into v_s from public.vkl_saves where player_id = p_id;
  if v_s is not null and (v_s ->> 'dead') is distinct from 'true' then
    v_p := nullif(v_s ->> 'path', '');
    v_srn := case when (v_s ->> 'realm') ~ '^[0-9]{1,2}$' then (v_s ->> 'realm')::int end;
    if v_srn is not null and v_srn > coalesce(v_rn, -1) then v_rn := v_srn; v_co := v_s ->> 'cosmos'; end if;
  end if;
  if v_p is null then select path into v_p from public.vkl_lives where player_id = p_id order by created_at desc limit 1; end if;
  select m.ten into v_mon from public.vkl_sm_member mb join public.vkl_sm_mon m on m.id = mb.mon_id
   where mb.player_id = p_id and m.giai_tan_luc is null;
  return jsonb_strip_nulls(jsonb_build_object('ten', coalesce(v_ten, 'Vô danh'), 'rn', v_rn, 'co', v_co, 'p', v_p, 'mon', v_mon));
end;
$$;

-- một tin gửi về trình duyệt (không có id người, username hay email)
create or replace function vkl_priv.wc_row(c public.vkl_wc_chat, p_me uuid)
returns jsonb language sql stable set search_path = '' as $$
  select case when c.loai = 'he'
    then jsonb_build_object('id', c.id, 'luc', c.luc, 'nd', c.noi_dung, 'nd_en', c.noi_dung_en, 'he', true)
    else jsonb_build_object('id', c.id, 'luc', c.luc, 'nd', c.noi_dung, 'ta', c.player_id = p_me) || coalesce(c.ai, '{}'::jsonb)
  end;
$$;

-- quyền gửi: null là được; còn lại là mã lý do
create or replace function vkl_priv.wc_quyen(p_me uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case
    when p.id is null then jsonb_build_object('ly', 'WC_AUTH')
    when jsonb_typeof(p.meta -> 'chanThan') is distinct from 'object' then jsonb_build_object('ly', 'WC_NO_CT')
    when p.google_sub is null then jsonb_build_object('ly', 'WC_NO_GG')
    when c.toi > now() then jsonb_build_object('ly', 'WC_CAM', 'toi', c.toi)
    else null end
  from (select p_me id) x
  left join public.vkl_players p on p.id = x.id
  left join public.vkl_wc_cam c on c.player_id = x.id;
$$;

-- ============ Hàm cho trình duyệt ============
-- đọc tin: p_sau = 0 thì 50 tin mới nhất, > 0 thì các tin mới hơn id đó (tối đa 50). Kèm quyền gửi của mình.
create or replace function public.vkl_wc_list(p_token uuid, p_sau bigint default 0)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := public.vkl_player(p_token); v_q jsonb;
begin
  if v_me is null then raise exception 'WC_AUTH'; end if;
  v_q := vkl_priv.wc_quyen(v_me);
  return jsonb_build_object(
    'tin', (select coalesce(jsonb_agg(vkl_priv.wc_row(x, v_me) order by x.id), '[]'::jsonb) from (
              select * from public.vkl_wc_chat c where not c.an and c.id > coalesce(p_sau, 0) order by c.id desc limit 50) x),
    'gui', v_q is null,
    'ly', v_q ->> 'ly',
    'toi', v_q -> 'toi');
end;
$$;

-- số tin mới (của người khác và tin hệ thống) sau id: chấm đỏ ở nút Thế giới
create or replace function public.vkl_wc_n(p_token uuid, p_sau bigint default 0)
returns int language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := public.vkl_player(p_token);
begin
  if v_me is null then return 0; end if;
  return (select count(*)::int from (
    select 1 from public.vkl_wc_chat where id > coalesce(p_sau, 0) and not an and player_id is distinct from v_me limit 99) x);
end;
$$;

-- gửi tin
create or replace function public.vkl_wc_send(p_token uuid, p_nd text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := public.vkl_player(p_token); v_q jsonb; v_nd text; v_cuoi public.vkl_wc_chat; r public.vkl_wc_chat;
begin
  if v_me is null then raise exception 'WC_AUTH'; end if;
  v_q := vkl_priv.wc_quyen(v_me);
  if v_q is not null then raise exception '%', v_q ->> 'ly'; end if;
  -- giữ xuống dòng (tối đa một dòng trống), gộp khoảng trắng trong dòng
  v_nd := regexp_replace(coalesce(p_nd, ''), '\r', '', 'g');
  v_nd := regexp_replace(v_nd, '[ \t\f\v]+', ' ', 'g');
  v_nd := regexp_replace(v_nd, ' ?\n ?', E'\n', 'g');
  v_nd := regexp_replace(v_nd, '\n{3,}', E'\n\n', 'g');
  v_nd := btrim(v_nd, E' \n');
  if v_nd = '' then raise exception 'WC_TRONG'; end if;
  if char_length(v_nd) > 512 then raise exception 'WC_DAI'; end if;
  -- một người gửi một lúc một tin (hai lần bấm cùng lúc không lọt qua giới hạn)
  perform pg_advisory_xact_lock(hashtext('vkl_wc_send'), hashtext(v_me::text));
  select * into v_cuoi from public.vkl_wc_chat where player_id = v_me order by luc desc limit 1;
  if v_cuoi.luc > now() - interval '10 seconds' then raise exception 'WC_NHANH'; end if;
  if (select count(*) from public.vkl_wc_chat where player_id = v_me and luc > now() - interval '5 minutes') >= 20 then
    raise exception 'WC_NHIEU';
  end if;
  v_nd := vkl_priv.wc_sach(v_nd);
  if v_cuoi.luc > now() - interval '2 minutes' and v_cuoi.noi_dung = v_nd then raise exception 'WC_TRUNG'; end if;
  insert into public.vkl_wc_chat (player_id, noi_dung, loai, ai) values (v_me, v_nd, 'nguoi', vkl_priv.wc_ai(v_me)) returning * into r;
  return vkl_priv.wc_row(r, v_me);
end;
$$;

-- báo tin xấu: người đủ điều kiện gửi, mỗi người một lần mỗi tin; 3 người báo thì tin tự ẩn;
-- người viết bị ẩn từ 3 tin trong 24 giờ thì tự cấm chat 24 giờ
create or replace function public.vkl_wc_report(p_token uuid, p_id bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := public.vkl_player(p_token); v_q jsonb; r public.vkl_wc_chat; v_n int; v_an int; v_cam boolean := false;
begin
  if v_me is null then raise exception 'WC_AUTH'; end if;
  v_q := vkl_priv.wc_quyen(v_me);
  if v_q is not null then raise exception '%', v_q ->> 'ly'; end if;
  select * into r from public.vkl_wc_chat where id = p_id for update;
  if r.id is null then raise exception 'WC_KHONG_CO'; end if;
  if r.loai = 'he' or r.player_id = v_me then raise exception 'WC_QUYEN'; end if;
  insert into public.vkl_wc_bao (chat_id, player_id) values (p_id, v_me) on conflict do nothing;
  select count(*) into v_n from public.vkl_wc_bao where chat_id = p_id;
  if v_n >= 3 and not r.an then
    update public.vkl_wc_chat set an = true where id = p_id;
    select count(*) into v_an from public.vkl_wc_chat where player_id = r.player_id and an and luc > now() - interval '24 hours';
    if v_an >= 3 then
      insert into public.vkl_wc_cam (player_id, toi, ly_do) values (r.player_id, now() + interval '24 hours', 'tu_dong')
      on conflict (player_id) do update set toi = greatest(public.vkl_wc_cam.toi, excluded.toi), ly_do = excluded.ly_do, luc = now();
      v_cam := true;
    end if;
  end if;
  return jsonb_build_object('so_bao', v_n, 'an', v_n >= 3, 'cam', v_cam);
end;
$$;

-- ============ Tin hệ thống ============
-- ghép tên: "A", "A và B", "A, B và C", "A, B, C và 2 người nữa"
create or replace function vkl_priv.wc_ds(p text[], p_en boolean)
returns text language sql immutable set search_path = '' as $$
  select case
    when n = 1 then p[1]
    when n <= 3 then array_to_string(p[1:n - 1], ', ') || case when p_en then ' and ' else ' và ' end || p[n]
    else array_to_string(p[1:3], ', ') || case when p_en then format(' and %s others', n - 3) else format(' và %s người nữa', n - 3) end
  end from (select cardinality(p) n) x;
$$;

-- đăng hàng chờ thành MỘT tin, nếu 3 phút qua chưa có tin hệ thống nào. Gọi từ trigger và từ cron mỗi phút.
create or replace function vkl_priv.wc_he_xa()
returns int language plpgsql security definer set search_path = '' as $$
declare v_vi text[] := '{}'; v_en text[] := '{}'; g record; v_max bigint;
begin
  if not exists (select 1 from public.vkl_wc_cho) then return 0; end if;
  if not pg_try_advisory_xact_lock(hashtext('vkl_wc_he_xa')) then return 0; end if;
  if exists (select 1 from public.vkl_wc_chat where loai = 'he' and luc > now() - interval '3 minutes') then return 0; end if;
  select max(id) into v_max from public.vkl_wc_cho;
  for g in select loai, array_agg(ten order by id) tens, array_agg(x order by id) xs, min(id) dau
             from public.vkl_wc_cho where id <= v_max group by loai order by min(id) loop
    if g.loai = 'phi' then
      v_vi := v_vi || (vkl_priv.wc_ds(g.tens, false) || ' vừa phi thăng lần đầu.');
      v_en := v_en || (vkl_priv.wc_ds(g.tens, true) || ' ascended for the first time.');
    elsif g.loai = 'kt' then
      v_vi := v_vi || (vkl_priv.wc_ds(g.tens, false) || ' vừa lên Khai Thiên.');
      v_en := v_en || (vkl_priv.wc_ds(g.tens, true) || ' reached World Opener.');
    elsif g.loai = 'ket' then
      v_vi := v_vi || (vkl_priv.wc_ds(g.tens, false) || case when cardinality(g.tens) = 1 then ' vừa mở một kết cục chưa ai từng gặp.' else ' vừa mở những kết cục chưa ai từng gặp.' end);
      v_en := v_en || (vkl_priv.wc_ds(g.tens, true) || case when cardinality(g.tens) = 1 then ' unlocked an ending no one had seen before.' else ' unlocked endings no one had seen before.' end);
    elsif g.loai = 'mon' then
      -- x = 'linh_mach|Tên ô' hoặc 'thien_tri|Tên ô'; mỗi môn một câu, tối đa 3 câu
      for i in 1 .. least(cardinality(g.tens), 3) loop
        if split_part(g.xs[i], '|', 1) = 'thien_tri' then
          v_vi := v_vi || format('%s vừa chiếm Thiên Trì.', g.tens[i]);
          v_en := v_en || format('%s took the Heaven Pool.', g.tens[i]);
        else
          v_vi := v_vi || format('%s vừa chiếm Linh Mạch ở %s.', g.tens[i], split_part(g.xs[i], '|', 2));
          v_en := v_en || format('%s took the Spirit Vein at %s.', g.tens[i], split_part(g.xs[i], '|', 2));
        end if;
      end loop;
    end if;
  end loop;
  delete from public.vkl_wc_cho where id <= v_max;
  if cardinality(v_vi) = 0 then return 0; end if;
  insert into public.vkl_wc_chat (noi_dung, noi_dung_en, loai)
  values (left(array_to_string(v_vi, ' '), 512), left(array_to_string(v_en, ' '), 512), 'he');
  return 1;
end;
$$;

create or replace function vkl_priv.wc_cho(p_loai text, p_ten text, p_x text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.vkl_wc_cho (loai, ten, x) values (p_loai, left(coalesce(nullif(p_ten, ''), 'Một đạo hữu'), 40), p_x);
  perform vkl_priv.wc_he_xa();
end;
$$;

-- lưu game: lần đầu phi thăng (ascended chuyển sang true), lần đầu lên Khai Thiên (realm chuyển sang 15)
create or replace function vkl_priv.wc_t_save()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_loai text; v_ok boolean;
begin
  begin
    if vkl_priv.wc_thu(new.player_id) then return new; end if;
    foreach v_loai in array array['phi', 'kt'] loop
      if (v_loai = 'phi' and new.state -> 'char' ->> 'ascended' = 'true' and (old.state -> 'char' ->> 'ascended') is distinct from 'true')
         or (v_loai = 'kt' and new.state -> 'char' ->> 'realm' = '15' and (old.state -> 'char' ->> 'realm') is distinct from '15') then
        insert into public.vkl_wc_moc (player_id, loai) values (new.player_id, v_loai) on conflict do nothing returning true into v_ok;
        if v_ok then perform vkl_priv.wc_cho(v_loai, vkl_priv.wc_ten(new.player_id)); end if;
        v_ok := null;
      end if;
    end loop;
  exception when others then null;
  end;
  return new;
end;
$$;
drop trigger if exists vkl_saves_zz_wc on public.vkl_saves;
create trigger vkl_saves_zz_wc after update on public.vkl_saves for each row
  when ((new.state -> 'char' ->> 'ascended' = 'true' and (old.state -> 'char' ->> 'ascended') is distinct from 'true')
     or (new.state -> 'char' ->> 'realm' = '15' and (old.state -> 'char' ->> 'realm') is distinct from '15'))
  execute function vkl_priv.wc_t_save();

-- bia mộ: kết cục (trong danh sách trắng) lần đầu có người mở trên toàn máy chủ
create or replace function vkl_priv.wc_t_life()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_id text;
begin
  begin
    if new.player_id is null or vkl_priv.wc_thu(new.player_id) then return new; end if;
    update public.vkl_wc_ket set lan_dau = now() where id = new.look ->> 'ending' and lan_dau is null returning id into v_id;
    if v_id is not null then
      perform vkl_priv.wc_cho('ket', coalesce(nullif((select meta -> 'chanThan' ->> 'name' from public.vkl_players where id = new.player_id), ''), nullif(new.char_name, ''), 'Một đạo hữu'));
    end if;
  exception when others then null;
  end;
  return new;
end;
$$;
drop trigger if exists vkl_lives_zz_wc on public.vkl_lives;
create trigger vkl_lives_zz_wc after insert on public.vkl_lives for each row
  when (new.look ? 'ending') execute function vkl_priv.wc_t_life();

-- Sơn Môn: môn cắm cờ hoặc thắng trận ở ô Linh Mạch / Thiên Trì (nguồn: vkl_sm_bao do hàm máy chủ ghi)
create or replace function vkl_priv.wc_t_sm()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_dat text; v_mon text;
begin
  begin
    if new.mon_a is null or new.mon_a is not distinct from vkl_priv.sm_yeu_mon() then return new; end if;
    if new.loai = 'tran' and new.noi_dung ->> 'kq' is distinct from 'thang' then return new; end if;
    select loai into v_dat from public.vkl_sm_dat where ky_id = new.ky_id and q = new.q and r = new.r and loai in ('linh_mach', 'thien_tri') limit 1;
    if v_dat is null then return new; end if;
    select ten into v_mon from public.vkl_sm_mon where id = new.mon_a;
    if v_mon is null then return new; end if;
    perform vkl_priv.wc_cho('mon', v_mon, v_dat || '|' || coalesce(new.noi_dung ->> 'ten_o', (select ten from public.vkl_sm_tile where ky_id = new.ky_id and q = new.q and r = new.r), '?'));
  exception when others then null;
  end;
  return new;
end;
$$;
drop trigger if exists vkl_sm_bao_zz_wc on public.vkl_sm_bao;
create trigger vkl_sm_bao_zz_wc after insert on public.vkl_sm_bao for each row
  when (new.loai in ('cam_co', 'tran')) execute function vkl_priv.wc_t_sm();

-- ============ Dọn ============
create or replace function vkl_priv.wc_don()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_n int; v_c int;
begin
  delete from public.vkl_wc_chat where luc < now() - interval '7 days';
  get diagnostics v_n = row_count;
  delete from public.vkl_wc_cam where toi < now() - interval '7 days';
  get diagnostics v_c = row_count;
  delete from public.vkl_wc_cho where luc < now() - interval '1 day';
  return jsonb_build_object('tin', v_n, 'cam', v_c);
end;
$$;

-- ============ Quyền ============
do $$ declare f text; begin
  foreach f in array array['vkl_priv.wc_sach(text)', 'vkl_priv.wc_ten(uuid)', 'vkl_priv.wc_thu(uuid)', 'vkl_priv.wc_ai(uuid)',
                           'vkl_priv.wc_row(public.vkl_wc_chat, uuid)', 'vkl_priv.wc_quyen(uuid)', 'vkl_priv.wc_ds(text[], boolean)',
                           'vkl_priv.wc_he_xa()', 'vkl_priv.wc_cho(text, text, text)', 'vkl_priv.wc_t_save()', 'vkl_priv.wc_t_life()',
                           'vkl_priv.wc_t_sm()', 'vkl_priv.wc_don()'] loop
    execute format('revoke all on function %s from public', f);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('revoke all on function %s from anon, authenticated', f); end if;
  end loop;
  foreach f in array array['public.vkl_wc_list(uuid, bigint)', 'public.vkl_wc_n(uuid, bigint)', 'public.vkl_wc_send(uuid, text)', 'public.vkl_wc_report(uuid, bigint)'] loop
    execute format('revoke all on function %s from public', f);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('grant execute on function %s to anon, authenticated', f); end if;
  end loop;
end $$;

-- ============ Lịch ============
select cron.unschedule(jobid) from cron.job where jobname in ('vkl_wc_don', 'vkl_wc_he');
select cron.schedule('vkl_wc_don', '30 20 * * *', 'select vkl_priv.wc_don()');  -- 3:30 giờ VN
select cron.schedule('vkl_wc_he', '* * * * *', 'select vkl_priv.wc_he_xa()');    -- xả hàng chờ tin hệ thống (thoát ngay khi trống)
