-- 21/11 (Tyler chốt "chiếm là chiếm", phương án 2): trần theo số người (1 + đạo hữu/3) chỉ áp cho khai hoang.
-- Đất giành bằng xuất chinh giữ được tới gấp đôi trần đó (cfg dat.chiem_he, mặc định 2); vượt mới bỏ ô xa chính điện nhất.
-- Đã áp bằng apply_migration son_mon_chiem_la_chiem_2026_11_21. Thử trong giao dịch: môn 6 ô thắng -> 7/12, không bỏ ô.
update public.vkl_sm_cfg set v = v || '{"chiem_he": 2}'::jsonb where k = 'dat' and not (v ? 'chiem_he');

create or replace function vkl_priv.sm_o_tran(p_mon bigint)
returns integer language sql stable security definer set search_path = '' as $$
  select (vkl_priv.sm_o_max(p_mon) * coalesce((select (v ->> 'chiem_he')::numeric from public.vkl_sm_cfg where k = 'dat'), 2))::int;
$$;
revoke all on function vkl_priv.sm_o_tran(bigint) from public, anon, authenticated;

-- sm_tran3 / sm_tran4: điều kiện bỏ ô "> sm_o_max" đổi thành "> sm_o_tran".
-- vkl_sm_march3 / vkl_sm_march4: 'bo_khi_thang' chỉ trả khi môn đã giữ >= sm_o_tran.
do $$
declare f text; d text; n text;
begin
  foreach f in array array['vkl_priv.sm_tran3(bigint)', 'vkl_priv.sm_tran4(bigint)'] loop
    d := pg_get_functiondef(f::regprocedure);
    n := replace(d, ') > vkl_priv.sm_o_max(c.mon_id) then', ') > vkl_priv.sm_o_tran(c.mon_id) then');
    if n <> d then execute n; end if;
  end loop;
  d := pg_get_functiondef('public.vkl_sm_march3(uuid,integer,integer)'::regprocedure);
  n := replace(d, '''bo_khi_thang'', (select ten from vkl_priv.sm_o_xa(v_mon.ky_lap, v_mon.id, p_q, p_r)))',
    '''bo_khi_thang'', case when (select count(*) from public.vkl_sm_tile where mon_id = v_mon.id) >= vkl_priv.sm_o_tran(v_mon.id) then (select ten from vkl_priv.sm_o_xa(v_mon.ky_lap, v_mon.id, p_q, p_r)) end)');
  if n <> d then execute n; end if;
  d := pg_get_functiondef('public.vkl_sm_march4(uuid,integer,integer)'::regprocedure);
  n := replace(d, '''bo_khi_thang'', case when v_du then',
    '''bo_khi_thang'', case when v_du and (select count(*) from public.vkl_sm_tile where mon_id = v_mon.id) >= vkl_priv.sm_o_tran(v_mon.id) then');
  if n <> d then execute n; end if;
end $$;
