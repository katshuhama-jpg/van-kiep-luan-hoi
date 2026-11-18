-- 18/11 10:45 sửa lỗi: môn cắm cờ sau 08:40 (Bạch Long Cung, Thái Đỉnh Đạo Viện, Cửu Kiếm Phái) có mốc bảo hộ môn
-- nhưng ô cắm cờ không được bảo hộ. Lý do: vkl_sm_pick_tile ghi ô trước, rồi mới ghi cam_co_luc; mốc moi_bh_toi do
-- trigger BEFORE đặt nên trigger AFTER "update of moi_bh_toi" không chạy (cột đó không nằm trong câu UPDATE).
-- Sửa: trigger AFTER chạy cả khi cam_co_luc đổi. Rồi bù bảo hộ cho ô cắm cờ của các môn bị sót. Chạy lại không hỏng.
drop trigger if exists vkl_sm_mon_bh_o on public.vkl_sm_mon;
create trigger vkl_sm_mon_bh_o after update of cam_co_luc, moi_bh_toi on public.vkl_sm_mon
  for each row execute function vkl_priv.sm_mon_bh_o();

-- bù: ô đầu tiên (ô cắm cờ) của mọi môn đang bảo hộ mà chưa có bảo hộ tới mốc
update public.vkl_sm_tile t set bao_ho_toi = m.moi_bh_toi
  from public.vkl_sm_mon m
 where m.id = t.mon_id and m.moi_bh_toi > now() and m.giai_tan_luc is null
   and (t.bao_ho_toi is null or t.bao_ho_toi < m.moi_bh_toi)
   and (t.q, t.r) = (select x.q, x.r from public.vkl_sm_tile x where x.mon_id = m.id order by x.chiem_luc nulls first limit 1);

select m.ten, t.q, t.r, t.bao_ho_toi at time zone 'Asia/Ho_Chi_Minh' as bao_ho_toi
  from public.vkl_sm_tile t join public.vkl_sm_mon m on m.id = t.mon_id
 where m.giai_tan_luc is null order by m.id, t.chiem_luc;
