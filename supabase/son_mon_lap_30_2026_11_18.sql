-- 17/11 tối (người chơi góp ý qua Tyler: chơi cẩn thận từng kiếp thì 50 kiếp là quá xa): hạ điều kiện lập môn
-- 50 kiếp + 5 ngày -> 30 kiếp + 5 ngày; van an toàn (các môn đầy trên 80%) 30 + 4 -> 20 + 4. Chỉ đổi dữ liệu cấu hình, không đổi hàm.
-- Số 17/11 (người có chân thân chơi trong 7 ngày): đủ 50+5: 81 người, đủ 30+5: 121 người. Cần khoảng 25 môn.
update public.vkl_sm_cfg set v = v || '{"kiep": 30, "kiep_ha": 20}'::jsonb where k = 'lap';
