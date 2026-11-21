-- 21/11 (Tyler giao "tuỳ bạn quyết"): hai luật chống nhặt ô của môn vắng người / môn nhỏ.
--  1. Hộ sơn trận: mỗi ô có chủ có thêm sức giữ nền bằng Lực chiến trung bình một đệ tử của môn đó x 1,5 (cfg tran.nen).
--     Ô trống người không còn lực giữ 0: một người lẻ khó lấy trắng, phải kéo 2-3 người. Ô có người đứng giữ vẫn mạnh hơn nhiều.
--  2. Thế yếu: môn bị đánh có tổng Lực chiến dưới 50% môn đánh (cfg tran.yeu_the) thì thắng chỉ đuổi được người giữ,
--     ô trở về trống (trừ Linh Mạch, Thiên Trì: vẫn giành như cũ), không về tay môn đánh, không có điểm chiếm (kq 'duoi', báo loai 'duoi', không lên tin thiên hạ).
-- Cách gắn: hàm mới sm_tran5 + sm_tick5 (cron mỗi phút, xử trận đánh ô môn khác sớm 170 giây, trước sm_tick2/3/4).
-- Không sửa hàm cũ. Gỡ: cron.unschedule('vkl_sm_tick5') là trận lại đi qua sm_tran2/sm_tran3 như trước.

update public.vkl_sm_cfg set v = v || '{"nen": 1.5, "yeu_the": 0.5}'::jsonb where k = 'tran' and not (v ? 'nen');

create or replace function vkl_priv.sm_lc_mon(p_mon bigint)
returns table (n int, tong numeric) language sql stable security definer set search_path = '' as $$
  select count(*)::int, coalesce(sum(vkl_priv.sm_cap(coalesce(l.lc, 0))), 0)
    from public.vkl_sm_member m left join public.vkl_sm_luc_chien l on l.player_id = m.player_id
   where m.mon_id = p_mon;
$$;
revoke all on function vkl_priv.sm_lc_mon(bigint) from public, anon, authenticated;

create or replace function vkl_priv.sm_la_danh_mon(p_chinh bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.vkl_sm_chinh c
      join public.vkl_sm_tile t on t.ky_id = c.ky_id and t.q = c.toi_q and t.r = c.toi_r
     where c.id = p_chinh and t.mon_id is not null and t.mon_id <> c.mon_id
       and t.mon_id is distinct from vkl_priv.sm_yeu_mon());
$$;
revoke all on function vkl_priv.sm_la_danh_mon(bigint) from public, anon, authenticated;

create or replace function vkl_priv.sm_tran5(p_chinh bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  c public.vkl_sm_chinh; t public.vkl_sm_tile; d public.vkl_sm_dat; cf jsonb;
  v_atk numeric; v_n_atk int; v_def numeric := 0; v_n_def int := 0; v_win boolean; v_kq jsonb;
  v_kv_a numeric; v_kv_b numeric := 0; v_dem boolean; v_mot boolean := false; v_san numeric;
  v_bo_q int; v_bo_r int; v_bo_ten text;
  v_na int; v_lc_a numeric; v_nb int; v_lc_b numeric; v_nen numeric := 0; v_duoi boolean := false; v_loai text;
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
  else
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
      'the_yeu', v_duoi, 'du_o', true);
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

create or replace function vkl_priv.sm_tick5()
returns int language plpgsql security definer set search_path = '' as $$
declare r record; v_n int := 0;
begin
  for r in select id from public.vkl_sm_chinh where trang_thai = 'di' and toi_noi_luc <= now() + interval '170 seconds'
            order by toi_noi_luc, id for update skip locked loop
    if vkl_priv.sm_la_danh_mon(r.id) then
      perform vkl_priv.sm_tran5(r.id);
      v_n := v_n + 1;
    end if;
  end loop;
  return v_n;
end;
$$;
revoke all on function vkl_priv.sm_tick5() from public, anon, authenticated;

select cron.schedule('vkl_sm_tick5', '* * * * *', 'select vkl_priv.sm_tick5()');

-- Cơ hội thắng tính cả hộ sơn trận và báo thế yếu (đã áp bằng apply_migration son_mon_co_hoi2_ho_son_2026_11_21).
create or replace function public.vkl_sm_co_hoi2(p_token uuid, p_q integer, p_r integer)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  r jsonb := public.vkl_sm_co_hoi(p_token, p_q, p_r); v_me uuid := vkl_priv.sm_me(p_token); v_a bigint; t public.vkl_sm_tile;
  v_lc_a numeric; v_nb int; v_lc_b numeric; v_nen numeric; v_mult numeric; v_toi timestamptz; v_them numeric;
begin
  if r ? 'trong' or r ? 'cua_ta' then return r; end if;
  select mon_id into v_a from public.vkl_sm_member where player_id = v_me;
  select * into t from public.vkl_sm_tile where ky_id = (select ky_lap from public.vkl_sm_mon where id = v_a) and q = p_q and r = p_r;
  if t.mon_id is null or t.mon_id = vkl_priv.sm_yeu_mon() then return r; end if;
  select x.tong into v_lc_a from vkl_priv.sm_lc_mon(v_a) x;
  select x.n, x.tong into v_nb, v_lc_b from vkl_priv.sm_lc_mon(t.mon_id) x;
  v_nen := case when v_nb > 0 then v_lc_b / v_nb else 0 end * coalesce(vkl_priv.sm_cfg('tran', 'nen'), 1);
  r := r || jsonb_build_object('the_yeu', v_lc_b < v_lc_a * coalesce(vkl_priv.sm_cfg('tran', 'yeu_the'), 0.5)
    and not exists (select 1 from public.vkl_sm_dat x where x.ky_id = t.ky_id and x.q = t.q and x.r = t.r and x.loai in ('linh_mach', 'thien_tri')));
  if r ->> 'nguon' = 'trinh' then
    v_toi := (r ->> 'toi')::timestamptz;
    v_mult := vkl_priv.sm_cfg('tran', 'san_nha') * (1 + vkl_priv.sm_kv_bonus(t.mon_id, v_toi))
      * (case when (r ->> 'dem')::boolean then vkl_priv.sm_cfg('tran', 'dem') else 1 end)
      * (case when (select count(*) from public.vkl_sm_tile where ky_id = t.ky_id and mon_id = t.mon_id) = 1 then vkl_priv.sm_cfg('tran', 'mot_o') else 1 end);
    v_them := v_nen * v_mult;
    r := r || jsonb_build_object('nen', round(v_them), 'giu', round((r ->> 'giu')::numeric + v_them),
      'lo', round((r ->> 'lo')::numeric + v_them), 'hi', round((r ->> 'hi')::numeric + v_them));
  end if;
  return r;
end;
$$;
revoke all on function public.vkl_sm_co_hoi2(uuid, integer, integer) from public;
grant execute on function public.vkl_sm_co_hoi2(uuid, integer, integer) to anon, authenticated;
