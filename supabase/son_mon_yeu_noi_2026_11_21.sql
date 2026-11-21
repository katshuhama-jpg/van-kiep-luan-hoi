-- 21/11 (Tyler: "môn ở vòng trong khó hơn vì không có quái"): ổ yêu chỉ sinh ở vòng 5-6, môn giữa bản đồ
-- (Cửu Kiếm, Bạch Long, Thái Đỉnh: yêu gần nhất cách 3 ô) không đánh được yêu thú nào để mở đất hay lấy phúc duyên.
-- sm_yeu_noi (cron 5:03, sau sm_dat_5h): môn nào không có ô yêu trong 2 ô quanh đất thì sinh 1 ổ yêu kề đất môn đó,
-- lực theo khoảng vòng 5 (đã nhân hệ số tăng dần theo ngày). Tối đa yeu_noi_max ổ mỗi sáng (mặc định 4), ưu tiên môn nhiều ô.
-- Ổ này như ổ thường: sáng hôm sau chưa ai đánh thì tan, có thể đánh môn kề bên theo luật đợt tấn công.

update public.vkl_sm_cfg set v = v || '{"yeu_noi_max": 4, "yeu_noi_o_min": 2}'::jsonb where k = 'dat' and not (v ? 'yeu_noi_max');

create or replace function vkl_priv.sm_yeu_noi()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_ky int := vkl_priv.sm_ky_now(); c jsonb; v_yeu bigint := vkl_priv.sm_yeu_mon(); m record; x record; v_n int := 0; v_ds text[] := '{}';
begin
  if v_ky is null or v_yeu is null or not vkl_priv.sm_dat_on() then return jsonb_build_object('bo_qua', true); end if;
  select v into c from public.vkl_sm_cfg where k = 'dat';
  for m in
    select mo.id, count(*) n from public.vkl_sm_mon mo join public.vkl_sm_tile t on t.ky_id = v_ky and t.mon_id = mo.id
     where mo.giai_tan_luc is null and mo.id <> v_yeu
     group by mo.id having count(*) >= coalesce((c ->> 'yeu_noi_o_min')::int, 2)
     order by count(*) desc, random()
  loop
    exit when v_n >= coalesce((c ->> 'yeu_noi_max')::int, 4);
    continue when exists (select 1 from public.vkl_sm_tile a join public.vkl_sm_tile y on y.ky_id = a.ky_id and y.mon_id = v_yeu
                           where a.ky_id = v_ky and a.mon_id = m.id and vkl_priv.sm_dist(a.q, a.r, y.q, y.r) <= 2);
    select e.q, e.r, e.ten into x from public.vkl_sm_tile e
     where e.ky_id = v_ky and e.mon_id is null
       and exists (select 1 from public.vkl_sm_tile a where a.ky_id = v_ky and a.mon_id = m.id and vkl_priv.sm_dist(a.q, a.r, e.q, e.r) = 1)
       and not exists (select 1 from public.vkl_sm_dat d where d.ky_id = v_ky and d.q = e.q and d.r = e.r)
       and not exists (select 1 from public.vkl_sm_chinh h where h.ky_id = v_ky and h.toi_q = e.q and h.toi_r = e.r and h.trang_thai in ('tap_hop', 'di'))
     order by random() limit 1;
    continue when x.q is null;
    insert into public.vkl_sm_dat (ky_id, q, r, loai, yeu_luc, yeu_luc_dat)
    values (v_ky, x.q, x.r, 'yeu_thu', (c ->> 'y5_lo')::int + floor(random() * (((c ->> 'y5_hi')::int - (c ->> 'y5_lo')::int) / 500 + 1)) * 500, now());
    update public.vkl_sm_tile set mon_id = v_yeu, chinh_dien = false, chiem_luc = now(), bao_ho_toi = now() + interval '100 years'
     where ky_id = v_ky and q = x.q and r = x.r and mon_id is null;
    v_ds := v_ds || x.ten;
    v_n := v_n + 1;
  end loop;
  return jsonb_build_object('n', v_n, 'o', v_ds);
end;
$$;
revoke all on function vkl_priv.sm_yeu_noi() from public, anon, authenticated;

select cron.schedule('vkl_sm_yeu_noi', '3 22 * * *', 'select vkl_priv.sm_yeu_noi()');
