-- 21/11 (Tyler: "Quái có vẻ hơi yếu, hãy tăng dần độ khó"): yêu thú mạnh dần theo ngày của Kỷ.
-- Hệ số = 1 + yeu_tang x số ngày từ đầu Kỷ (mặc định 0,07/ngày: ngày 3 = 1,21; ngày cuối Kỷ 1/12 = 1,91).
-- Không sửa hàm cũ: mọi lực yêu thú đều sinh ra từ khoảng y5_lo..y6_hi trong cfg 'dat' (ổ 5:00, yêu canh Linh Mạch)
-- hoặc từ lực ô yêu đang có (đợt tấn công, ổ lan). Nên chỉ cần mỗi sáng 4:50 nhân lại khoảng đó từ mức gốc,
-- và nhân các ô yêu đang đứng theo tỉ lệ hệ số mới / hệ số hôm qua. Đợt tấn công đã báo trước thì giữ nguyên số đã báo.

update public.vkl_sm_cfg set v = v || jsonb_build_object(
  'yeu_goc', jsonb_build_object('y5_lo', v -> 'y5_lo', 'y5_hi', v -> 'y5_hi', 'y6_lo', v -> 'y6_lo', 'y6_hi', v -> 'y6_hi'),
  'yeu_tang', 0.07, 'yeu_he', 1)
 where k = 'dat' and not (v ? 'yeu_goc');

create or replace function vkl_priv.sm_yeu_do_kho()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c jsonb; g jsonb; v_ky public.vkl_sm_ky; v_d int; v_he numeric; v_cu numeric; v_ti numeric; v_n int := 0;
begin
  select v into c from public.vkl_sm_cfg where k = 'dat' for update;
  g := c -> 'yeu_goc';
  if g is null then return null; end if;
  select * into v_ky from public.vkl_sm_ky where not ket_xong order by id desc limit 1;
  if v_ky.id is null then return null; end if;
  v_d := greatest(0, vkl_priv.sm_day(now()) - vkl_priv.sm_day(v_ky.bat_dau));
  v_he := round(1 + coalesce((c ->> 'yeu_tang')::numeric, 0.07) * v_d, 3);
  v_cu := coalesce((c ->> 'yeu_he')::numeric, 1);
  update public.vkl_sm_cfg set v = v || jsonb_build_object(
      'y5_lo', vkl_priv.sm_r500((g ->> 'y5_lo')::numeric * v_he, 5000), 'y5_hi', vkl_priv.sm_r500((g ->> 'y5_hi')::numeric * v_he, 5000),
      'y6_lo', vkl_priv.sm_r500((g ->> 'y6_lo')::numeric * v_he, 5000), 'y6_hi', vkl_priv.sm_r500((g ->> 'y6_hi')::numeric * v_he, 5000),
      'yeu_he', v_he, 'yeu_ngay', v_d)
   where k = 'dat';
  if v_he <> v_cu then
    v_ti := v_he / v_cu;
    update public.vkl_sm_dat set yeu_luc = vkl_priv.sm_r500(yeu_luc * v_ti, 5000)
     where ky_id = v_ky.id and yeu_luc is not null;
    get diagnostics v_n = row_count;
  end if;
  return jsonb_build_object('ngay', v_d, 'he', v_he, 'cu', v_cu, 'o', v_n);
end;
$$;
revoke all on function vkl_priv.sm_yeu_do_kho() from public, anon, authenticated;

select cron.schedule('vkl_sm_yeu_do_kho', '50 21 * * *', 'select vkl_priv.sm_yeu_do_kho()');
select vkl_priv.sm_yeu_do_kho();
