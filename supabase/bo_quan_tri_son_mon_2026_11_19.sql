-- 19/11: Tyler bỏ trang quản trị Sơn Môn trên web (/quan-tri/son-mon), xem bằng dashboard artifact "Sơn Môn trực tiếp".
-- Đã áp (migration bo_vkl_sm_admin_mon_2026_11_19):
drop function if exists public.vkl_sm_admin_mon(uuid, bigint);
-- vkl_sm_admin(token) cũ giữ nguyên (không sửa hàm cũ), không còn trang nào gọi.
