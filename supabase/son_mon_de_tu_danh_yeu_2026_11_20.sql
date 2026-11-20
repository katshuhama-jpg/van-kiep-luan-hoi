-- 20/11 (Tyler, góp ý vickary ở Vô Hư Cốc: "chả làm được gì ngồi nhìn, yêu thú cũng không ăn được"):
--  * Đệ tử cũng phát lệnh xuất chinh được khi đánh ô yêu thú, hoặc Linh Mạch / Thiên Trì đang có môn khác giữ.
--    Đánh ô thường của môn khác vẫn chỉ môn chủ, trưởng lão.
--  * Môn đủ ô vẫn đánh được ô yêu thú (trước đây bị chặn SM_DU_O): thắng thì nhận ô, bỏ ô xa chính điện nhất (như đánh ô có chủ).
-- Không sửa hàm cũ:
--  * public.vkl_sm_march4: client gọi thay vkl_sm_march3. Trường hợp khác đi lại vkl_sm_march3.
--  * vkl_priv.sm_tran4 + sm_tick4 (mỗi phút, khi còn 150 giây tới nơi): tính đoàn "đủ ô đánh yêu thú", trước sm_tick3/2 và tick cũ
--    (các hàm đó sẽ hủy đoàn này vì đủ ô).

create or replace function vkl_priv.sm_la_yeu_du_o(p_chinh bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.vkl_sm_chinh c
      join public.vkl_sm_tile t on t.ky_id = c.ky_id and t.q = c.toi_q and t.r = c.toi_r
     where c.id = p_chinh
       and t.mon_id is not distinct from vkl_priv.sm_yeu_mon() and vkl_priv.sm_yeu_mon() is not null
       and (select count(*) from public.vkl_sm_tile x where x.ky_id = c.ky_id and x.mon_id = c.mon_id) >= vkl_priv.sm_o_max(c.mon_id));
$$;

create or replace function public.vkl_sm_march4(p_token uuid, p_q integer, p_r integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_mon public.vkl_sm_mon; t public.vkl_sm_tile; d public.vkl_sm_dat;
  v_tu record; v_th timestamptz; v_toi timestamptz; v_id bigint; v_yeu bigint := vkl_priv.sm_yeu_mon(); v_la_yeu boolean; v_dac_biet boolean;
  v_du boolean;
begin
  if not vkl_priv.sm_dat_on() then return public.vkl_sm_march3(p_token, p_q, p_r); end if;
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id;
  select * into t from public.vkl_sm_tile where ky_id = v_mon.ky_lap and q = p_q and r = p_r;
  if t.ky_id is null then raise exception 'SM_O'; end if;
  select * into d from public.vkl_sm_dat where ky_id = t.ky_id and q = p_q and r = p_r;
  v_la_yeu := v_yeu is not null and t.mon_id = v_yeu;
  v_dac_biet := not v_la_yeu and d.loai in ('linh_mach', 'thien_tri') and t.mon_id is not null and t.mon_id <> v_mon.id;
  v_du := (select count(*) from public.vkl_sm_tile where mon_id = v_mon.id) >= vkl_priv.sm_o_max(v_mon.id);
  -- môn chủ, trưởng lão: đường cũ, trừ ô yêu thú lúc môn đủ ô
  if not (v_la_yeu or v_dac_biet) or (m.chuc in ('chu', 'lao') and not (v_la_yeu and v_du)) then
    return public.vkl_sm_march3(p_token, p_q, p_r);
  end if;
  perform 1 from public.vkl_sm_mon where id = v_mon.id for update;
  if v_dac_biet then
    if exists (select 1 from public.vkl_sm_thu where mon_a = v_mon.id and mon_b = t.mon_id and toi > now()) then raise exception 'SM_THU'; end if;
    if t.bao_ho_toi > now() then raise exception 'SM_BAO_HO'; end if;
  end if;
  if exists (select 1 from public.vkl_sm_chinh where mon_id = v_mon.id and trang_thai in ('tap_hop', 'di')) then raise exception 'SM_DANG_CHINH'; end if;
  if exists (select 1 from public.vkl_sm_chinh where ky_id = t.ky_id and toi_q = p_q and toi_r = p_r and trang_thai in ('tap_hop', 'di')) then raise exception 'SM_O_DANG_BI_TOI'; end if;
  select q, r into v_tu from public.vkl_sm_tile where mon_id = v_mon.id and vkl_priv.sm_dist(q, r, p_q, p_r) = 1 limit 1;
  if v_tu is null then raise exception 'SM_KHONG_KE'; end if;
  if m.nghi_toi > now() then raise exception 'SM_NGHI'; end if;
  if v_dac_biet and v_mon.moi_bh_toi > now() then update public.vkl_sm_mon set moi_bh_toi = now() where id = v_mon.id; end if;
  v_th := now() + make_interval(mins => vkl_priv.sm_cfg('gio', 'tap_hop_phut')::int);
  v_toi := v_th + make_interval(mins => vkl_priv.sm_cfg('gio', 'di_phut')::int);
  insert into public.vkl_sm_chinh (ky_id, mon_id, nguoi_phat, tu_q, tu_r, toi_q, toi_r, tap_hop_toi, toi_noi_luc)
  values (v_mon.ky_lap, v_mon.id, v_me, v_tu.q, v_tu.r, p_q, p_r, v_th, v_toi) returning id into v_id;
  insert into public.vkl_sm_chinh_theo (chinh_id, player_id) values (v_id, v_me);
  return jsonb_build_object('id', v_id, 'tap_hop_toi', v_th, 'toi_noi_luc', v_toi, 'yeu', v_la_yeu,
    'bo_khi_thang', case when v_du then (select ten from vkl_priv.sm_o_xa(v_mon.ky_lap, v_mon.id, p_q, p_r)) end);
end;
$$;
revoke all on function public.vkl_sm_march4(uuid, integer, integer) from public;
grant execute on function public.vkl_sm_march4(uuid, integer, integer) to anon, authenticated;

-- Tính đoàn môn đủ ô đánh ô yêu thú
create or replace function vkl_priv.sm_tran4(p_chinh bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  c public.vkl_sm_chinh; t public.vkl_sm_tile; d public.vkl_sm_dat; cf jsonb; v_yeu bigint := vkl_priv.sm_yeu_mon();
  v_atk numeric; v_n_atk int; v_def numeric; v_win boolean; v_kq jsonb; v_kv_a numeric; v_bo_q int; v_bo_r int; v_bo_ten text;
begin
  select v into cf from public.vkl_sm_cfg where k = 'dat';
  select * into c from public.vkl_sm_chinh where id = p_chinh for update;
  if c.trang_thai <> 'di' then return null; end if;
  if not vkl_priv.sm_la_yeu_du_o(c.id) then return null; end if;
  select * into t from public.vkl_sm_tile where ky_id = c.ky_id and q = c.toi_q and r = c.toi_r for update;
  select * into d from public.vkl_sm_dat where ky_id = c.ky_id and q = c.toi_q and r = c.toi_r;
  select count(*)::int, coalesce(sum(vkl_priv.sm_cap(coalesce(l.lc, 0))), 0) into v_n_atk, v_atk
    from public.vkl_sm_chinh_theo th
    join public.vkl_sm_member m on m.player_id = th.player_id and m.mon_id = c.mon_id
    left join public.vkl_sm_luc_chien l on l.player_id = th.player_id
   where th.chinh_id = c.id;
  v_kv_a := vkl_priv.sm_kv_bonus(c.mon_id, c.toi_noi_luc);
  v_atk := v_atk * (1 + v_kv_a);
  if exists (select 1 from public.vkl_sm_mon where id = c.mon_id and giai_tan_luc is not null) or v_n_atk = 0 then
    v_kq := jsonb_build_object('kq', 'huy', 'ly_do', 'khong_nguoi');
  else
    v_def := coalesce(d.yeu_luc, 0);
    v_win := v_atk > v_def;
    if v_win then
      update public.vkl_sm_tile set mon_id = c.mon_id, chinh_dien = false, chiem_luc = now(),
        bao_ho_toi = now() + make_interval(hours => vkl_priv.sm_cfg('gio', 'bao_ho_gio')::int)
       where ky_id = t.ky_id and q = t.q and r = t.r;
      delete from public.vkl_sm_dat where ky_id = t.ky_id and q = t.q and r = t.r and loai = 'yeu_thu';
      insert into public.vkl_gift (to_player, from_player, kind, amount, note)
      select p.username, 'son_mon', 'phuc', (cf ->> 'yeu_phuc')::int, 'Trừ yêu thú ở ' || t.ten
        from public.vkl_sm_chinh_theo th join public.vkl_players p on p.id = th.player_id where th.chinh_id = c.id;
      if (select count(*) from public.vkl_sm_tile where ky_id = c.ky_id and mon_id = c.mon_id) > vkl_priv.sm_o_max(c.mon_id) then
        select o.q, o.r, o.ten into v_bo_q, v_bo_r, v_bo_ten from vkl_priv.sm_o_xa(c.ky_id, c.mon_id, t.q, t.r) o;
        if v_bo_q is not null then
          update public.vkl_sm_member set dung_q = null, dung_r = null where mon_id = c.mon_id and dung_q = v_bo_q and dung_r = v_bo_r;
          update public.vkl_sm_tile set mon_id = null, chinh_dien = false, bao_ho_toi = null where ky_id = c.ky_id and q = v_bo_q and r = v_bo_r;
        end if;
      end if;
    else
      update public.vkl_sm_member m set nghi_toi = now() + make_interval(hours => vkl_priv.sm_cfg('gio', 'nghi_gio')::int)
        from public.vkl_sm_chinh_theo th where th.chinh_id = c.id and th.player_id = m.player_id;
    end if;
    v_kq := jsonb_build_object('kq', case when v_win then 'thang' else 'thua' end, 'yeu', true,
      'atk', round(v_atk), 'def', round(v_def), 'n_atk', v_n_atk, 'n_def', 0, 'kv_a', v_kv_a, 'mon_b', null, 'du_o', true);
    if v_bo_q is not null then v_kq := v_kq || jsonb_build_object('bo_o', v_bo_ten, 'bo_q', v_bo_q, 'bo_r', v_bo_r); end if;
  end if;
  update public.vkl_sm_chinh set trang_thai = case when v_kq ->> 'kq' = 'huy' then 'huy' else 'xong' end, ket_qua = v_kq where id = c.id;
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, mon_b, q, r, noi_dung)
  values (c.ky_id, case when v_kq ->> 'kq' = 'huy' then 'huy' else 'tran' end, c.mon_id, null, t.q, t.r, v_kq || jsonb_build_object('ten_o', t.ten, 'chinh', c.id));
  return v_kq;
end;
$$;

create or replace function vkl_priv.sm_tick4()
returns int language plpgsql security definer set search_path = '' as $$
declare x record; v_n int := 0;
begin
  for x in select c.id from public.vkl_sm_chinh c
            where c.trang_thai = 'di' and c.toi_noi_luc <= now() + interval '150 seconds' and vkl_priv.sm_la_yeu_du_o(c.id)
            order by c.toi_noi_luc loop
    perform vkl_priv.sm_tran4(x.id);
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;
revoke all on function vkl_priv.sm_tran4(bigint) from public;
revoke all on function vkl_priv.sm_tick4() from public;

select cron.schedule('vkl_sm_tick4', '* * * * *', 'select vkl_priv.sm_tick4()');
