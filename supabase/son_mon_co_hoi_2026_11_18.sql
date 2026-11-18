-- 18/11 tối (Tyler: đánh luôn không trinh sát thì sao biết cần bao nhiêu người theo). Khối 8c. Hàm MỚI, không sửa hàm cũ.
-- LƯU Ý 20:20 18/11: Tyler chốt chưa trinh sát thì vẫn "???". Phần mức thô (sm_nhieu, nguon uoc) sẽ bỏ ở bản sau; giao diện chưa dùng hàm này.
-- 1) vkl_sm_co_hoi: cơ hội thắng một ô (lực ta chính xác, lực giữ từ trinh sát trong 1 giờ hoặc mức thô có nhiễu ±35%)
-- 2) vkl_sm_march_tt: xuất chinh + tự gửi trinh sát nếu ô chưa được trinh sát trong 1 giờ
-- 3) vkl_sm_rut_quan: môn chủ/trưởng lão hủy lệnh trong lúc tập hợp, không ai bị nghỉ

-- nhiễu cố định theo ô, môn giữ và giờ: 0,65 .. 1,35 (bấm lại trong giờ ra cùng số, không dò ngược được)
create or replace function vkl_priv.sm_nhieu(p_q int, p_r int, p_mon bigint)
returns numeric language sql stable security definer set search_path = '' as $$
  select 0.65 + 0.7 * (('x' || substr(md5(p_q || ':' || p_r || ':' || coalesce(p_mon, 0) || ':vkl8c:' ||
         to_char(now() at time zone 'UTC', 'YYYYMMDDHH24')), 1, 8))::bit(32)::bigint / 4294967295.0);
$$;

create or replace function public.vkl_sm_co_hoi(p_token uuid, p_q int, p_r int)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_mon public.vkl_sm_mon; t public.vkl_sm_tile;
  c public.vkl_sm_chinh; v_toi timestamptz; v_ta numeric; v_n_ta int; v_kv_a numeric; v_kv_b numeric;
  v_dem boolean; v_mot boolean; v_mult numeric; s public.vkl_sm_trinh; v_cho timestamptz;
  v_n int; v_lc numeric; v_uoc numeric; v_muc int; v_avg numeric;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id;
  select * into t from public.vkl_sm_tile where ky_id = v_mon.ky_lap and q = p_q and r = p_r;
  if t.ky_id is null then raise exception 'SM_O'; end if;
  if t.mon_id is null then return jsonb_build_object('trong', true); end if;
  if t.mon_id = v_mon.id then return jsonb_build_object('cua_ta', true); end if;

  select * into c from public.vkl_sm_chinh
   where mon_id = v_mon.id and toi_q = p_q and toi_r = p_r and trang_thai in ('tap_hop', 'di') order by id desc limit 1;
  v_toi := coalesce(c.toi_noi_luc, now() + make_interval(mins => (vkl_priv.sm_cfg('gio', 'tap_hop_phut') + vkl_priv.sm_cfg('gio', 'di_phut'))::int));
  v_kv_a := vkl_priv.sm_kv_bonus(v_mon.id, v_toi);
  if c.id is not null then
    select count(*)::int, coalesce(sum(vkl_priv.sm_cap(coalesce(l.lc, 0))), 0) into v_n_ta, v_ta
      from public.vkl_sm_chinh_theo th
      join public.vkl_sm_member mm on mm.player_id = th.player_id and mm.mon_id = v_mon.id
      left join public.vkl_sm_luc_chien l on l.player_id = th.player_id
     where th.chinh_id = c.id;
  else
    select 1, vkl_priv.sm_cap(coalesce((select lc from public.vkl_sm_luc_chien where player_id = v_me), 0)) into v_n_ta, v_ta;
  end if;
  v_ta := v_ta * (1 + v_kv_a);
  -- Lực chiến trung bình (có trần) của người trong môn ta chưa đi theo, để đổi "cần thêm" ra số người
  select coalesce(avg(vkl_priv.sm_cap(coalesce(l.lc, 0))), 0) into v_avg
    from public.vkl_sm_member mm left join public.vkl_sm_luc_chien l on l.player_id = mm.player_id
   where mm.mon_id = v_mon.id;

  v_kv_b := vkl_priv.sm_kv_bonus(t.mon_id, v_toi);
  v_dem := extract(hour from v_toi at time zone 'Asia/Ho_Chi_Minh') < 7;
  v_mot := (select count(*) from public.vkl_sm_tile where ky_id = t.ky_id and mon_id = t.mon_id) = 1;
  v_mult := (1 + v_kv_b) * (case when v_dem then vkl_priv.sm_cfg('tran', 'dem') else 1 end)
            * (case when v_mot then vkl_priv.sm_cfg('tran', 'mot_o') else 1 end);

  -- trinh sát của môn ta trong 1 giờ qua, đúng chủ ô hiện tại
  select * into s from public.vkl_sm_trinh
   where mon_id = v_mon.id and q = p_q and r = p_r and ket_qua is not null and xong_luc > now() - interval '1 hour'
     and coalesce((ket_qua ->> 'trong')::boolean, false) = false and (ket_qua ->> 'mon')::bigint = t.mon_id
   order by xong_luc desc limit 1;
  select min(xong_luc) into v_cho from public.vkl_sm_trinh
   where mon_id = v_mon.id and q = p_q and r = p_r and ket_qua is null;

  if s.id is not null then
    v_uoc := (s.ket_qua ->> 'lc')::numeric * v_mult;
    return jsonb_build_object('nguon', 'trinh', 'ta', round(v_ta), 'n_ta', v_n_ta, 'avg', round(v_avg),
      'giu', round(v_uoc), 'lo', round(v_uoc / 1.15), 'hi', round(v_uoc / 0.85), 'n', (s.ket_qua ->> 'n')::int,
      'trinh_luc', s.xong_luc, 'dem', v_dem, 'toi', v_toi);
  end if;

  select g.n, g.lc into v_n, v_lc from vkl_priv.sm_giu(t.ky_id, t.mon_id, t.q, t.r) g;
  v_uoc := coalesce(v_lc, 0) * vkl_priv.sm_cfg('tran', 'san_nha') * v_mult * vkl_priv.sm_nhieu(p_q, p_r, t.mon_id);
  v_muc := case when v_uoc < 3000 then 0 when v_uoc < 8000 then 1 when v_uoc < 15000 then 2 else 3 end;
  return jsonb_build_object('nguon', 'uoc', 'ta', round(v_ta), 'n_ta', v_n_ta, 'avg', round(v_avg), 'muc', v_muc,
    'lo', (array[0, 3000, 8000, 15000])[v_muc + 1], 'hi', (array[3000, 8000, 15000, null])[v_muc + 1],
    'n_muc', case when coalesce(v_n, 0) = 0 then 0 when v_n <= 2 then 1 when v_n <= 5 then 2 else 3 end,
    'trinh_ve', v_cho, 'dem', v_dem, 'toi', v_toi);
end;
$$;

create or replace function public.vkl_sm_march_tt(p_token uuid, p_q int, p_r int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := vkl_priv.sm_me(p_token); v jsonb; m public.vkl_sm_member; v_ky int; t public.vkl_sm_tile; v_d int; v_xong timestamptz;
begin
  v := public.vkl_sm_march(p_token, p_q, p_r);
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

create or replace function public.vkl_sm_rut_quan(p_token uuid, p_chinh bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; c public.vkl_sm_chinh; t public.vkl_sm_tile; v_ten text;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  select * into c from public.vkl_sm_chinh where id = p_chinh for update;
  if c.id is null or c.mon_id is distinct from m.mon_id or m.chuc not in ('chu', 'lao') then raise exception 'SM_QUYEN'; end if;
  if c.trang_thai <> 'tap_hop' or c.tap_hop_toi <= now() then raise exception 'SM_HET_TAP_HOP'; end if;
  select username into v_ten from public.vkl_players where id = v_me;
  select * into t from public.vkl_sm_tile where ky_id = c.ky_id and q = c.toi_q and r = c.toi_r;
  update public.vkl_sm_chinh set trang_thai = 'huy',
    ket_qua = jsonb_build_object('kq', 'huy', 'ly_do', 'rut_quan', 'nguoi', v_ten) where id = c.id;
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, mon_b, q, r, noi_dung)
  values (c.ky_id, 'huy', c.mon_id, t.mon_id, c.toi_q, c.toi_r,
          jsonb_build_object('kq', 'huy', 'ly_do', 'rut_quan', 'nguoi', v_ten, 'ten_o', t.ten, 'chinh', c.id));
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function vkl_priv.sm_nhieu(int, int, bigint) from public;
revoke all on function public.vkl_sm_co_hoi(uuid, int, int) from public;
revoke all on function public.vkl_sm_march_tt(uuid, int, int) from public;
revoke all on function public.vkl_sm_rut_quan(uuid, bigint) from public;
grant execute on function public.vkl_sm_co_hoi(uuid, int, int) to anon, authenticated;
grant execute on function public.vkl_sm_march_tt(uuid, int, int) to anon, authenticated;
grant execute on function public.vkl_sm_rut_quan(uuid, bigint) to anon, authenticated;

-- ===== 20:26 18/11 (Tyler "Làm"): bản đã áp, migration son_mon_co_hoi_bo_uoc_2026_11_18 =====
-- vkl_sm_co_hoi thay bằng bản không có mức thô: chưa trinh sát thì nguon 'chua' (chỉ lực ta, trinh_ve), có trinh sát thì 'trinh'.
-- drop function vkl_priv.sm_nhieu. (Thân hàm đầy đủ xem migration trên Supabase.)
