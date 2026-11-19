-- Ngày 7c (Tyler 19/11 23:09): mở khóa đánh ô của môn khác.
-- Số 19/11: cả 14 môn đều giữ đúng trần ô nên SM_DU_O khóa xuất chinh với mọi môn, 0 trận đánh ô có chủ.
-- Luật mới: trần ô chỉ chặn cắm cờ/khai hoang ô TRỐNG. Xuất chinh vào ô có chủ (môn khác, không phải yêu thú)
-- luôn được. Thắng mà vượt trần thì môn thắng tự bỏ ô xa chính điện nhất (không bỏ chính điện, không bỏ ô vừa chiếm).
-- Không sửa hàm cũ:
--  * public.vkl_sm_march3 / vkl_sm_march_tt3: client gọi thay vkl_sm_march / vkl_sm_march_tt.
--  * vkl_priv.sm_tran3: tính trận cho đúng loại đoàn "đủ ô đánh ô có chủ" (các hàm tính trận cũ sẽ hủy vì du_o).
--  * vkl_priv.sm_tick3 (mỗi phút) tính trước các đoàn đó khi còn 130 giây tới nơi, trước sm_tick2 (70 giây) và sm_tick (lúc tới).

-- ô xa chính điện nhất của môn (trừ chính điện và ô vừa chiếm)
create or replace function vkl_priv.sm_o_xa(p_ky integer, p_mon bigint, p_tru_q integer, p_tru_r integer)
returns table (q integer, r integer, ten text) language sql stable security definer set search_path = '' as $$
  select t.q, t.r, t.ten
    from public.vkl_sm_tile t
    left join public.vkl_sm_tile cd on cd.ky_id = t.ky_id and cd.mon_id = t.mon_id and cd.chinh_dien
   where t.ky_id = p_ky and t.mon_id = p_mon and not t.chinh_dien
     and not (t.q = p_tru_q and t.r = p_tru_r)
   order by coalesce(vkl_priv.sm_dist(t.q, t.r, cd.q, cd.r), 0) desc, t.chiem_luc asc nulls first, t.q, t.r
   limit 1;
$$;

-- đoàn này có phải "môn đủ ô đánh ô có chủ" không
create or replace function vkl_priv.sm_la_danh_du_o(p_chinh bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.vkl_sm_chinh c
      join public.vkl_sm_tile t on t.ky_id = c.ky_id and t.q = c.toi_q and t.r = c.toi_r
     where c.id = p_chinh
       and t.mon_id is not null and t.mon_id <> c.mon_id
       and t.mon_id is distinct from vkl_priv.sm_yeu_mon()
       and (select count(*) from public.vkl_sm_tile x where x.ky_id = c.ky_id and x.mon_id = c.mon_id) >= vkl_priv.sm_o_max(c.mon_id));
$$;

create or replace function public.vkl_sm_march3(p_token uuid, p_q integer, p_r integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_mon public.vkl_sm_mon; t public.vkl_sm_tile; d public.vkl_sm_dat;
  v_tu record; v_th timestamptz; v_toi timestamptz; v_id bigint; v_yeu bigint := vkl_priv.sm_yeu_mon(); cf jsonb; v_thu timestamptz;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id;
  select * into t from public.vkl_sm_tile where ky_id = v_mon.ky_lap and q = p_q and r = p_r;
  if t.ky_id is null then raise exception 'SM_O'; end if;
  -- không phải trường hợp mới (ô trống, ô yêu thú, hay môn chưa đủ ô): đi đường cũ
  if t.mon_id is null or t.mon_id = v_mon.id or t.mon_id is not distinct from v_yeu
     or (select count(*) from public.vkl_sm_tile where mon_id = v_mon.id) < vkl_priv.sm_o_max(v_mon.id) then
    return public.vkl_sm_march2(p_token, p_q, p_r);
  end if;
  -- môn đủ ô đánh ô có chủ: như vkl_sm_march nhưng không chặn vì đủ ô
  if m.chuc not in ('chu', 'lao') then raise exception 'SM_QUYEN'; end if;
  perform 1 from public.vkl_sm_mon where id = v_mon.id for update;
  if vkl_priv.sm_dat_on() then
    select v into cf from public.vkl_sm_cfg where k = 'dat';
    select * into d from public.vkl_sm_dat where ky_id = t.ky_id and q = p_q and r = p_r;
    select toi into v_thu from public.vkl_sm_thu where mon_a = v_mon.id and mon_b = t.mon_id and toi > now();
    if v_thu is not null then raise exception 'SM_THU'; end if;
    if d.loai is null and vkl_priv.sm_mon_lc(t.mon_id) < vkl_priv.sm_mon_lc(v_mon.id) * (cf ->> 'dai')::numeric then raise exception 'SM_NGOAI_DAI'; end if;
  end if;
  if exists (select 1 from public.vkl_sm_chinh where mon_id = v_mon.id and trang_thai in ('tap_hop', 'di')) then raise exception 'SM_DANG_CHINH'; end if;
  if t.bao_ho_toi > now() then raise exception 'SM_BAO_HO'; end if;
  if v_mon.moi_bh_toi > now() then update public.vkl_sm_mon set moi_bh_toi = now() where id = v_mon.id; end if;
  select q, r into v_tu from public.vkl_sm_tile where mon_id = v_mon.id and vkl_priv.sm_dist(q, r, p_q, p_r) = 1 limit 1;
  if v_tu is null then raise exception 'SM_KHONG_KE'; end if;
  if m.nghi_toi > now() then raise exception 'SM_NGHI'; end if;
  v_th := now() + make_interval(mins => vkl_priv.sm_cfg('gio', 'tap_hop_phut')::int);
  v_toi := v_th + make_interval(mins => vkl_priv.sm_cfg('gio', 'di_phut')::int);
  insert into public.vkl_sm_chinh (ky_id, mon_id, nguoi_phat, tu_q, tu_r, toi_q, toi_r, tap_hop_toi, toi_noi_luc)
  values (v_mon.ky_lap, v_mon.id, v_me, v_tu.q, v_tu.r, p_q, p_r, v_th, v_toi) returning id into v_id;
  insert into public.vkl_sm_chinh_theo (chinh_id, player_id) values (v_id, v_me);
  return jsonb_build_object('id', v_id, 'tap_hop_toi', v_th, 'toi_noi_luc', v_toi, 'bo_khi_thang', (select ten from vkl_priv.sm_o_xa(v_mon.ky_lap, v_mon.id, p_q, p_r)));
end;
$$;

-- như vkl_sm_march_tt (xuất chinh kèm tự trinh sát) nhưng đi qua vkl_sm_march3
create or replace function public.vkl_sm_march_tt3(p_token uuid, p_q integer, p_r integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := vkl_priv.sm_me(p_token); v jsonb; m public.vkl_sm_member; v_ky int; t public.vkl_sm_tile; v_d int; v_xong timestamptz;
begin
  v := public.vkl_sm_march3(p_token, p_q, p_r);
  select * into m from public.vkl_sm_member where player_id = v_me;
  select ky_lap into v_ky from public.vkl_sm_mon where id = m.mon_id;
  select * into t from public.vkl_sm_tile where ky_id = v_ky and q = p_q and r = p_r;
  if t.mon_id is not null and not exists (
       select 1 from public.vkl_sm_trinh where mon_id = m.mon_id and q = p_q and r = p_r
          and (ket_qua is null or xong_luc > now() - interval '1 hour')) then
    select min(vkl_priv.sm_dist(q, r, p_q, p_r)) into v_d from public.vkl_sm_tile where mon_id = m.mon_id;
    v_xong := now() + make_interval(mins => (greatest(coalesce(v_d, 1), 1) * vkl_priv.sm_cfg('gio', 'trinh_phut'))::int);
    insert into public.vkl_sm_trinh (ky_id, mon_id, player_id, q, r, xong_luc) values (v_ky, m.mon_id, v_me, p_q, p_r, v_xong);
    v := v || jsonb_build_object('tu_trinh', v_xong);
  end if;
  return v;
end;
$$;

-- tính trận cho đoàn "môn đủ ô đánh ô có chủ": như nhánh đánh ô có chủ của sm_tran2, bỏ chặn đủ ô,
-- thắng mà vượt trần thì bỏ ô xa chính điện nhất.
create or replace function vkl_priv.sm_tran3(p_chinh bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  c public.vkl_sm_chinh; t public.vkl_sm_tile; d public.vkl_sm_dat; cf jsonb; v_on boolean := vkl_priv.sm_dat_on();
  v_atk numeric; v_n_atk int; v_def numeric := 0; v_n_def int := 0; v_win boolean; v_kq jsonb;
  v_kv_a numeric; v_kv_b numeric := 0; v_dem boolean; v_mot boolean := false; v_san numeric;
  v_bo_q int; v_bo_r int; v_bo_ten text;
begin
  select v into cf from public.vkl_sm_cfg where k = 'dat';
  select * into c from public.vkl_sm_chinh where id = p_chinh for update;
  if c.trang_thai <> 'di' then return null; end if;
  if not vkl_priv.sm_la_danh_du_o(c.id) then return null; end if;
  select * into t from public.vkl_sm_tile where ky_id = c.ky_id and q = c.toi_q and r = c.toi_r for update;
  if v_on then select * into d from public.vkl_sm_dat where ky_id = c.ky_id and q = c.toi_q and r = c.toi_r; end if;
  select count(*)::int, coalesce(sum(vkl_priv.sm_cap(coalesce(l.lc, 0))), 0) into v_n_atk, v_atk
    from public.vkl_sm_chinh_theo th
    join public.vkl_sm_member m on m.player_id = th.player_id and m.mon_id = c.mon_id
    left join public.vkl_sm_luc_chien l on l.player_id = th.player_id
   where th.chinh_id = c.id;
  v_kv_a := vkl_priv.sm_kv_bonus(c.mon_id, c.toi_noi_luc);
  v_atk := v_atk * (1 + v_kv_a);
  v_dem := extract(hour from c.toi_noi_luc at time zone 'Asia/Ho_Chi_Minh') < 7;

  if exists (select 1 from public.vkl_sm_mon where id = c.mon_id and giai_tan_luc is not null) or v_n_atk = 0 then
    v_kq := jsonb_build_object('kq', 'huy', 'ly_do', 'khong_nguoi');
  elsif t.bao_ho_toi is not null and t.bao_ho_toi > c.toi_noi_luc then
    v_kq := jsonb_build_object('kq', 'huy', 'ly_do', 'bao_ho', 'toi', t.bao_ho_toi);
  else
    select g.n, g.lc into v_n_def, v_def from vkl_priv.sm_giu(c.ky_id, t.mon_id, t.q, t.r) g;
    v_kv_b := vkl_priv.sm_kv_bonus(t.mon_id, c.toi_noi_luc);
    v_mot := (select count(*) from public.vkl_sm_tile where ky_id = c.ky_id and mon_id = t.mon_id) = 1;
    v_san := vkl_priv.sm_cfg('tran', 'san_nha');
    v_def := v_def * v_san * (1 + v_kv_b) * (case when v_dem then vkl_priv.sm_cfg('tran', 'dem') else 1 end)
             * (case when v_mot then vkl_priv.sm_cfg('tran', 'mot_o') else 1 end)
             * (case when d.loai = 'thien_tri' then (cf ->> 'tt_giu')::numeric else 1 end);
    v_win := v_atk > v_def;
    if v_win then
      update public.vkl_sm_member set dung_q = null, dung_r = null
       where mon_id = t.mon_id and dung_q = t.q and dung_r = t.r;
      update public.vkl_sm_tile set mon_id = c.mon_id, chinh_dien = false, chiem_luc = now(),
        bao_ho_toi = now() + make_interval(hours => vkl_priv.sm_cfg('gio', 'bao_ho_gio')::int)
       where ky_id = t.ky_id and q = t.q and r = t.r;
      perform vkl_priv.sm_chon_cd(c.ky_id, t.mon_id);
      perform vkl_priv.sm_chon_cd(c.ky_id, c.mon_id);
      if v_on then
        insert into public.vkl_sm_thu (mon_a, mon_b, toi) values (c.mon_id, t.mon_id, now() + make_interval(hours => (cf ->> 'thu_gio')::int))
        on conflict (mon_a, mon_b) do update set toi = excluded.toi;
      end if;
      if not exists (select 1 from public.vkl_sm_tile where ky_id = c.ky_id and mon_id = t.mon_id) then
        insert into public.vkl_sm_bao (ky_id, loai, mon_a, mon_b, q, r) values (c.ky_id, 'mat_het', t.mon_id, c.mon_id, t.q, t.r);
      end if;
      -- vượt trần: bỏ ô xa chính điện nhất
      if (select count(*) from public.vkl_sm_tile where ky_id = c.ky_id and mon_id = c.mon_id) > vkl_priv.sm_o_max(c.mon_id) then
        select o.q, o.r, o.ten into v_bo_q, v_bo_r, v_bo_ten from vkl_priv.sm_o_xa(c.ky_id, c.mon_id, t.q, t.r) o;
        if v_bo_q is not null then
          update public.vkl_sm_member set dung_q = null, dung_r = null where mon_id = c.mon_id and dung_q = v_bo_q and dung_r = v_bo_r;
          update public.vkl_sm_tile set mon_id = null, chinh_dien = false, bao_ho_toi = null
           where ky_id = c.ky_id and q = v_bo_q and r = v_bo_r;
        end if;
      end if;
    else
      update public.vkl_sm_member m set nghi_toi = now() + make_interval(hours => vkl_priv.sm_cfg('gio', 'nghi_gio')::int)
        from public.vkl_sm_chinh_theo th where th.chinh_id = c.id and th.player_id = m.player_id;
    end if;
    v_kq := jsonb_build_object('kq', case when v_win then 'thang' else 'thua' end,
      'atk', round(v_atk), 'def', round(v_def), 'n_atk', v_n_atk, 'n_def', v_n_def,
      'kv_a', v_kv_a, 'kv_b', v_kv_b, 'dem', v_dem, 'mot_o', v_mot, 'mon_b', t.mon_id, 'thien_tri', d.loai = 'thien_tri',
      'du_o', true);
    if v_bo_q is not null then v_kq := v_kq || jsonb_build_object('bo_o', v_bo_ten, 'bo_q', v_bo_q, 'bo_r', v_bo_r); end if;
    if (select count(*) from public.vkl_sm_bao where loai = 'tran' and mon_a = c.mon_id and mon_b = t.mon_id and luc > now() - interval '1 day') = 5
       and not exists (select 1 from public.vkl_sm_bao where loai = 'tran' and mon_a = t.mon_id and mon_b = c.mon_id and luc > now() - interval '1 day') then
      perform vkl_priv.sm_flag('mot_chieu', jsonb_build_object('a', c.mon_id, 'b', t.mon_id));
    end if;
  end if;

  update public.vkl_sm_chinh set trang_thai = case when v_kq ->> 'kq' = 'huy' then 'huy' else 'xong' end, ket_qua = v_kq where id = c.id;
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, mon_b, q, r, noi_dung)
  values (c.ky_id, case when v_kq ->> 'kq' = 'huy' then 'huy' else 'tran' end,
          c.mon_id, t.mon_id, t.q, t.r, v_kq || jsonb_build_object('ten_o', t.ten, 'chinh', c.id));
  return v_kq;
end;
$$;

-- Mỗi phút: tính trước các đoàn "đủ ô đánh ô có chủ" khi còn 130 giây tới nơi (sm_tick2 lấy 70 giây, sm_tick lấy lúc tới).
create or replace function vkl_priv.sm_tick3()
returns int language plpgsql security definer set search_path = '' as $$
declare r record; v_n int := 0;
begin
  for r in select id from public.vkl_sm_chinh where trang_thai = 'di' and toi_noi_luc <= now() + interval '130 seconds'
            order by toi_noi_luc, id for update skip locked loop
    if vkl_priv.sm_la_danh_du_o(r.id) then
      perform vkl_priv.sm_tran3(r.id);
      v_n := v_n + 1;
    end if;
  end loop;
  return v_n;
end;
$$;

revoke all on function vkl_priv.sm_o_xa(integer, bigint, integer, integer) from public;
revoke all on function vkl_priv.sm_la_danh_du_o(bigint) from public;
revoke all on function vkl_priv.sm_tran3(bigint) from public;
revoke all on function vkl_priv.sm_tick3() from public;
revoke all on function public.vkl_sm_march3(uuid, integer, integer) from public;
revoke all on function public.vkl_sm_march_tt3(uuid, integer, integer) from public;
grant execute on function public.vkl_sm_march3(uuid, integer, integer) to anon, authenticated;
grant execute on function public.vkl_sm_march_tt3(uuid, integer, integer) to anon, authenticated;

select cron.schedule('vkl_sm_tick3', '* * * * *', 'select vkl_priv.sm_tick3()');

-- thư một lần cho môn chủ và trưởng lão mọi môn, gửi lúc 5:20 20/11 (22:20 UTC 19/11) khi bản mới lên, rồi tự gỡ lịch
create or replace function vkl_priv.sm_thu_7c()
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.vkl_mail (to_player, from_player, kind, body)
  select p.username, 'son_mon', 'son_mon',
    'Luật mới của Sơn Môn: môn đã giữ đủ ô vẫn xuất chinh đánh ô của môn khác được. Thắng thì ô về tay môn ta, môn tự bỏ lại ô xa chính điện nhất. Mở Bản đồ, chạm ô kề lãnh thổ của môn khác rồi bấm Xuất chinh.'
    from public.vkl_sm_member m join public.vkl_players p on p.id = m.player_id
   where m.chuc in ('chu', 'lao');
  perform cron.unschedule('vkl_sm_thu_7c');
end;
$$;
revoke all on function vkl_priv.sm_thu_7c() from public;
select cron.schedule('vkl_sm_thu_7c', '20 22 19 11 *', 'select vkl_priv.sm_thu_7c()');
