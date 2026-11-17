-- 4.6.0 Ngày 7 (đêm 17/11): tạo Kỷ 1, 18/11 5:00 - 1/12 21:00 giờ Việt Nam, bán kính 6 (127 ô).
-- Chỉ tạo khi chưa có Kỷ nào, áp lại không tạo trùng.
do $$
begin
  if not exists (select 1 from public.vkl_sm_ky) then
    perform vkl_priv.sm_ky_create('2026-11-18 05:00:00+07', '2026-12-01 21:00:00+07', 6);
  end if;
end $$;
