-- 21/11 (Tyler hỏi môn nuốt môn; số liệu): chưa môn nào mất quá 1 ô vì PvP (15 trận, 5 thắng), thù 12 giờ đã giới hạn
-- 1 môn chỉ lấy được của 1 môn tối đa 2 ô/ngày. Nhưng thử khô cho thấy mất CHÍNH ĐIỆN thì đứt mạch kéo theo nửa môn
-- (Vô Hư 6 -> 3, Thương Hải 6 -> 3, Kim Thủy 6 -> 4) chỉ trong một trận. Nên:
--  1. Chính điện môn khác không đánh được (sm_tran5 hủy 'chinh_dien'; vkl_sm_march5 = march4 + chặn từ lúc ra lệnh).
--  2. Bị vây: môn mất từ 2 ô trở lên trong 12 giờ (kể cả đứt mạch, trong một trận hay nhiều trận) thì các ô còn lại
--     được bảo hộ thêm cfg tran.vay_gio (6) giờ. Chặn liên minh 2-3 môn thay nhau đánh một môn.
-- Thử khô (hoàn tác): đánh chính điện Thương Hải -> hủy; thắng ô thứ 2 trong 12 giờ -> 4 ô còn lại bảo hộ 6 giờ.
-- Đã áp bằng apply_migration son_mon_chinh_dien_bi_vay_2026_11_21.

update public.vkl_sm_cfg set v = v || '{"vay_gio": 6}'::jsonb where k = 'tran' and not (v ? 'vay_gio');

create or replace function vkl_priv.sm_tran5(p_chinh bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  c public.vkl_sm_chinh; t public.vkl_sm_tile; d public.vkl_sm_dat; cf jsonb;
  v_atk numeric; v_n_atk int; v_def numeric := 0; v_n_def int := 0; v_win boolean; v_kq jsonb;
  v_kv_a numeric; v_kv_b numeric := 0; v_dem boolean; v_mot boolean := false; v_san numeric;
  v_bo_q int; v_bo_r int; v_bo_ten text;
  v_na int; v_truoc int; v_sau int; v_mat int; v_vay boolean := false; v_lc_a numeric; v_nb int; v_lc_b numeric; v_nen numeric := 0; v_duoi boolean := false; v_loai text;
begin
  select v into cf from public.vkl_sm_cfg where k = 'dat';
  select * into c from public.vkl_sm_chinh where id = p_chinh for update;
  if c.trang_thai <> 'di' then return null; end if;
  if not vkl_priv.sm_la_danh_mon(c.id) then return null; end if;
  select * into t from public.vkl_sm_tile where ky_id = c.ky_id and q = c.toi_q and r = c.toi_r for update;
  select * into d from public.vkl_sm_dat where ky_id = c.ky_id and q = c.toi_q and r = c.toi_r;
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
  elsif t.chinh_dien then
    -- 21/11: chính điện không bị đánh (mất chính điện từng làm đứt mạch nửa môn trong một trận)
    v_kq := jsonb_build_object('kq', 'huy', 'ly_do', 'chinh_dien');
  else
    select count(*)::int into v_truoc from public.vkl_sm_tile where ky_id = c.ky_id and mon_id = t.mon_id;
    select g.n, g.lc into v_n_def, v_def from vkl_priv.sm_giu(c.ky_id, t.mon_id, t.q, t.r) g;
    select x.n, x.tong into v_na, v_lc_a from vkl_priv.sm_lc_mon(c.mon_id) x;
    select x.n, x.tong into v_nb, v_lc_b from vkl_priv.sm_lc_mon(t.mon_id) x;
    -- hộ sơn trận: sức một đệ tử trung bình của môn giữ
    v_nen := case when v_nb > 0 then v_lc_b / v_nb else 0 end * coalesce(vkl_priv.sm_cfg('tran', 'nen'), 1);
    v_duoi := v_lc_b < v_lc_a * coalesce(vkl_priv.sm_cfg('tran', 'yeu_the'), 0.5) and coalesce(d.loai, '') not in ('linh_mach', 'thien_tri');
    v_kv_b := vkl_priv.sm_kv_bonus(t.mon_id, c.toi_noi_luc);
    v_mot := (select count(*) from public.vkl_sm_tile where ky_id = c.ky_id and mon_id = t.mon_id) = 1;
    v_san := vkl_priv.sm_cfg('tran', 'san_nha');
    v_def := (v_def + v_nen) * v_san * (1 + v_kv_b) * (case when v_dem then vkl_priv.sm_cfg('tran', 'dem') else 1 end)
             * (case when v_mot then vkl_priv.sm_cfg('tran', 'mot_o') else 1 end)
             * (case when d.loai = 'thien_tri' then (cf ->> 'tt_giu')::numeric else 1 end);
    v_win := v_atk > v_def;
    if v_win then
      update public.vkl_sm_member set dung_q = null, dung_r = null where mon_id = t.mon_id and dung_q = t.q and dung_r = t.r;
      if v_duoi then
        -- thế yếu: đuổi người giữ, ô về trống
        update public.vkl_sm_tile set mon_id = null, chinh_dien = false, bao_ho_toi = null, chiem_luc = null
         where ky_id = t.ky_id and q = t.q and r = t.r;
        perform vkl_priv.sm_chon_cd(c.ky_id, t.mon_id);
      else
        update public.vkl_sm_tile set mon_id = c.mon_id, chinh_dien = false, chiem_luc = now(),
          bao_ho_toi = now() + make_interval(hours => vkl_priv.sm_cfg('gio', 'bao_ho_gio')::int)
         where ky_id = t.ky_id and q = t.q and r = t.r;
        perform vkl_priv.sm_chon_cd(c.ky_id, t.mon_id);
        perform vkl_priv.sm_chon_cd(c.ky_id, c.mon_id);
        if (select count(*) from public.vkl_sm_tile where ky_id = c.ky_id and mon_id = c.mon_id) > vkl_priv.sm_o_tran(c.mon_id) then
          select o.q, o.r, o.ten into v_bo_q, v_bo_r, v_bo_ten from vkl_priv.sm_o_xa(c.ky_id, c.mon_id, t.q, t.r) o;
          if v_bo_q is not null then
            update public.vkl_sm_member set dung_q = null, dung_r = null where mon_id = c.mon_id and dung_q = v_bo_q and dung_r = v_bo_r;
            update public.vkl_sm_tile set mon_id = null, chinh_dien = false, bao_ho_toi = null where ky_id = c.ky_id and q = v_bo_q and r = v_bo_r;
          end if;
        end if;
      end if;
      insert into public.vkl_sm_thu (mon_a, mon_b, toi) values (c.mon_id, t.mon_id, now() + make_interval(hours => (cf ->> 'thu_gio')::int))
      on conflict (mon_a, mon_b) do update set toi = excluded.toi;
      -- 21/11 bị vây: mất từ 2 ô trở lên trong 12 giờ (kể cả đứt mạch) thì các ô còn lại được bảo hộ thêm
      select count(*)::int into v_sau from public.vkl_sm_tile where ky_id = c.ky_id and mon_id = t.mon_id;
      select count(*)::int into v_mat from public.vkl_sm_bao
       where mon_b = t.mon_id and loai in ('tran', 'duoi') and noi_dung ->> 'kq' in ('thang', 'duoi') and luc > now() - interval '12 hours'
         and mon_a is distinct from vkl_priv.sm_yeu_mon();
      if v_sau > 0 and (v_truoc - v_sau >= 2 or v_mat + 1 >= 2) then
        update public.vkl_sm_tile set bao_ho_toi = greatest(coalesce(bao_ho_toi, now()), now() + make_interval(hours => coalesce(vkl_priv.sm_cfg('tran', 'vay_gio'), 6)::int))
         where ky_id = c.ky_id and mon_id = t.mon_id;
        v_vay := true;
      end if;
      if not exists (select 1 from public.vkl_sm_tile where ky_id = c.ky_id and mon_id = t.mon_id) then
        insert into public.vkl_sm_bao (ky_id, loai, mon_a, mon_b, q, r) values (c.ky_id, 'mat_het', t.mon_id, c.mon_id, t.q, t.r);
      end if;
    else
      update public.vkl_sm_member m set nghi_toi = now() + make_interval(hours => vkl_priv.sm_cfg('gio', 'nghi_gio')::int)
        from public.vkl_sm_chinh_theo th where th.chinh_id = c.id and th.player_id = m.player_id;
    end if;
    v_kq := jsonb_build_object('kq', case when v_win and v_duoi then 'duoi' when v_win then 'thang' else 'thua' end,
      'atk', round(v_atk), 'def', round(v_def), 'nen', round(v_nen), 'n_atk', v_n_atk, 'n_def', v_n_def,
      'kv_a', v_kv_a, 'kv_b', v_kv_b, 'dem', v_dem, 'mot_o', v_mot, 'mon_b', t.mon_id, 'thien_tri', d.loai = 'thien_tri',
      'the_yeu', v_duoi, 'du_o', true, 'mat_o', greatest(coalesce(v_truoc - v_sau, 0), 0), 'bi_vay', v_vay);
    if v_bo_q is not null then v_kq := v_kq || jsonb_build_object('bo_o', v_bo_ten, 'bo_q', v_bo_q, 'bo_r', v_bo_r); end if;
    if (select count(*) from public.vkl_sm_bao where loai in ('tran', 'duoi') and mon_a = c.mon_id and mon_b = t.mon_id and luc > now() - interval '1 day') = 5
       and not exists (select 1 from public.vkl_sm_bao where loai = 'tran' and mon_a = t.mon_id and mon_b = c.mon_id and luc > now() - interval '1 day') then
      perform vkl_priv.sm_flag('mot_chieu', jsonb_build_object('a', c.mon_id, 'b', t.mon_id));
    end if;
  end if;

  v_loai := case when v_kq ->> 'kq' = 'huy' then 'huy' when v_kq ->> 'kq' = 'duoi' then 'duoi' else 'tran' end;
  update public.vkl_sm_chinh set trang_thai = case when v_loai = 'huy' then 'huy' else 'xong' end, ket_qua = v_kq where id = c.id;
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, mon_b, q, r, noi_dung)
  values (c.ky_id, v_loai, c.mon_id, t.mon_id, t.q, t.r, v_kq || jsonb_build_object('ten_o', t.ten, 'chinh', c.id));
  return v_kq;
end;
$$;
revoke all on function vkl_priv.sm_tran5(bigint) from public, anon, authenticated;

create or replace function public.vkl_sm_march5(p_token uuid, p_q integer, p_r integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_mon bigint; t public.vkl_sm_tile;
begin
  select mon_id into v_mon from public.vkl_sm_member where player_id = v_me;
  select * into t from public.vkl_sm_tile where ky_id = (select ky_lap from public.vkl_sm_mon where id = v_mon) and q = p_q and r = p_r;
  if t.chinh_dien and t.mon_id is not null and t.mon_id <> v_mon and t.mon_id is distinct from vkl_priv.sm_yeu_mon() then
    raise exception 'SM_CHINH_DIEN';
  end if;
  return to_jsonb(public.vkl_sm_march4(p_token, p_q, p_r));
end;
$$;
revoke all on function public.vkl_sm_march5(uuid, integer, integer) from public;
grant execute on function public.vkl_sm_march5(uuid, integer, integer) to anon, authenticated;
