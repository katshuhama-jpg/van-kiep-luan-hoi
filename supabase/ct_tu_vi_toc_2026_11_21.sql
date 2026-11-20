-- 21/11 (Tyler chốt 23:5x 20/11): C9 Viên mãn chơi đều khoảng ngày 139 -> tốc độ tu luyện +11% mỗi Chuyển (thay +15%).
-- sim-tu-vi TOC=1.11: chơi đều ngày 141 (doc 139), offline 1 lần/ngày ngày 289 (doc 286). Hàm mới tạo đêm 20/11, chưa ai dùng (cờ CT_TU_VI_ON tắt).
create or replace function vkl_priv.ct_tv_toc(p_chuyen int)
returns numeric language sql immutable set search_path = '' as $$ select power(1.11, p_chuyen - 1)::numeric; $$;
